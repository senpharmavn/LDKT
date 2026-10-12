import { removePushSubscription, savePushSubscription } from "./api";

export type PushState = "checking" | "unsupported" | "unavailable" | "blocked" | "off" | "on";

export async function getPushState(): Promise<PushState> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "unavailable";
  if (Notification.permission === "denied") return "blocked";

  const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  await registration.update();
  const subscription = await registration.pushManager.getSubscription();
  return subscription && subscriptionUsesCurrentKey(subscription) ? "on" : "off";
}

export async function enablePushNotifications(): Promise<PushState> {
  const current = await getPushState();
  if (current === "unsupported" || current === "unavailable" || current === "blocked") return current;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "blocked" : "off";

  const registration = await navigator.serviceWorker.ready;
  let existing = await registration.pushManager.getSubscription();
  if (existing && !subscriptionUsesCurrentKey(existing)) {
    await removePushSubscription(existing.endpoint).catch(() => undefined);
    await existing.unsubscribe();
    existing = null;
  }
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
  });
  const result = await savePushSubscription(subscription.toJSON());
  if (!result.remoteSaved) {
    if (!existing) await subscription.unsubscribe();
    throw new Error(result.error || "Không lưu được thiết bị nhận thông báo.");
  }
  return "on";
}

export async function disablePushNotifications(): Promise<PushState> {
  if (!("serviceWorker" in navigator)) return "unsupported";
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await removePushSubscription(subscription.endpoint);
    await subscription.unsubscribe();
  }
  return "off";
}

export async function clearChallengeNotificationState() {
  if (typeof navigator !== "undefined" && "clearAppBadge" in navigator) {
    await navigator.clearAppBadge();
  }

  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    const notifications = await registration?.getNotifications();
    notifications
      ?.filter((notification) =>
        notification.tag.startsWith("ldkt-challenge-") || notification.tag.startsWith("ldkt-test-"),
      )
      .forEach((notification) => notification.close());
  }
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function subscriptionUsesCurrentKey(subscription: PushSubscription) {
  const currentKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const subscriptionKey = subscription.options.applicationServerKey;
  if (!currentKey || !subscriptionKey) return false;

  const expected = urlBase64ToUint8Array(currentKey);
  const actual = new Uint8Array(subscriptionKey);
  return expected.length === actual.length && expected.every((value, index) => value === actual[index]);
}
