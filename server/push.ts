import webpush from "web-push";
import { storage } from "./storage";
import { pool } from "./db";

const log = (message: string) => {
  console.log(message);
};

const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:wordofday2025@gmail.com";

let vapidInitialized = false;

async function ensurePushSettingsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function initVapid() {
  if (vapidInitialized) {
    return;
  }

  await ensurePushSettingsTable();

  const pubRow = await pool.query(`SELECT value FROM app_settings WHERE key = 'vapid_public_key' LIMIT 1`);
  const privRow = await pool.query(`SELECT value FROM app_settings WHERE key = 'vapid_private_key' LIMIT 1`);

  let publicKey = pubRow.rows[0]?.value as string | undefined;
  let privateKey = privRow.rows[0]?.value as string | undefined;

  if (!publicKey || !privateKey) {
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;

    await pool.query(
      `INSERT INTO app_settings (key, value)
       VALUES ('vapid_public_key', $1), ('vapid_private_key', $2)
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [publicKey, privateKey],
    );

    log("[Push] Generated and stored new VAPID keys");
  }

  webpush.setVapidDetails(VAPID_EMAIL, publicKey, privateKey);
  vapidInitialized = true;
}

export async function getVapidPublicKey(): Promise<string | null> {
  await ensurePushSettingsTable();
  const row = await pool.query(`SELECT value FROM app_settings WHERE key = 'vapid_public_key' LIMIT 1`);
  return (row.rows[0]?.value as string | undefined) || null;
}

export async function sendPushToAll(payload: {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}) {
  await initVapid();

  const subscriptions = await storage.getAllPushSubscriptions();
  if (subscriptions.length === 0) {
    log("[Push] No subscribers to notify");
    return;
  }

  log(`[Push] Sending notification to ${subscriptions.length} subscriber(s): "${payload.title}"`);

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
    icon: "/icon-192.png",
    badge: "/favicon-32.png",
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification
        );
      } catch (err: any) {
        // 410 Gone = subscription is no longer valid, clean it up
        if (err.statusCode === 410 || err.statusCode === 404) {
          log(`[Push] Removing stale subscription: ${sub.endpoint.slice(-30)}`);
          await storage.deletePushSubscription(sub.endpoint);
        } else {
          throw err;
        }
      }
    })
  );

  const failed = results.filter(r => r.status === "rejected").length;
  log(`[Push] Sent to ${subscriptions.length - failed}/${subscriptions.length} subscribers`);
}

export async function notifyCityOfTheDay(cityName: string, country: string) {
  await sendPushToAll({
    title: `Today's City: ${cityName}`,
    body: `Discover ${cityName}, ${country} — your daily travel inspiration is ready!`,
    url: "/",
  });
}

export async function notifyEveningReminder() {
  await sendPushToAll({
    title: "Did you see today's city?",
    body: "Your City of the Day is waiting — explore it before midnight!",
    url: "/",
  });
}
