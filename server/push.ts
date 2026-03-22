import webpush from "web-push";
import { storage } from "./storage";
import { log } from "./vite";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@citydiscoverer.ai";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export { VAPID_PUBLIC_KEY };

export async function sendPushToAll(payload: {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}) {
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
