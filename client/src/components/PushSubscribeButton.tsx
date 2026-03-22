import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushSubscribeButton() {
  const { toast } = useToast();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  if (!supported) return null;

  async function handleToggle() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (subscribed) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setSubscribed(false);
        toast({ title: "Notifications off", description: "You won't receive City of the Day alerts anymore." });
      } else {
        // Request permission first
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast({ title: "Permission denied", description: "Enable notifications in your browser settings to get daily city alerts.", variant: "destructive" });
          setLoading(false);
          return;
        }

        // Fetch VAPID public key and subscribe
        const res = await fetch("/api/push/vapid-public-key");
        const { publicKey } = await res.json();

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });

        setSubscribed(true);
        toast({ title: "You're subscribed!", description: "You'll get a notification when each new city goes live at 9am Eastern." });
      }
    } catch (err) {
      toast({ title: "Something went wrong", description: "Could not update notification settings.", variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={loading}
      title={subscribed ? "Turn off notifications" : "Get daily city alerts"}
      className={subscribed ? "text-primary" : "text-muted-foreground"}
    >
      {subscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
    </Button>
  );
}
