// 🔔 Push Notifications — subscribe / unsubscribe / permission helpers
"use client";

/** Check if browser supports Web Push */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Get current notification permission state */
export function getPermissionState(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/** Request notification permission from user */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  const result = await Notification.requestPermission();
  return result;
}

/** Register the service worker (idempotent) */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("[Push] service worker registered:", reg.scope);
    return reg;
  } catch (err) {
    console.error("[Push] service worker registration failed:", err);
    return null;
  }
}

/** VAPID public key — must match server's private key */
const VAPID_PUBLIC_KEY =
  "BJ1Gvvu--HyPIY9P1R39-3Bd2UD0QBRevUveOOvQCFmbIObbw7Y6iW7oPuakUYJ8525fQaBNkXt0FQW-P6bE7Bg";

/** Subscribe to push notifications (returns subscription object) */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  if (Notification.permission !== "granted") {
    const perm = await requestPermission();
    if (perm !== "granted") return null;
  }

  const reg = await navigator.serviceWorker.ready;
  if (!reg) return null;

  try {
    // Unsubscribe any existing subscription first (avoid dupes)
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log("[Push] subscribed:", subscription.endpoint);
    return subscription;
  } catch (err) {
    console.error("[Push] subscribe failed:", err);
    return null;
  }
}

/** Unsubscribe from push notifications */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log("[Push] unsubscribed");
      return true;
    }
    return false;
  } catch (err) {
    console.error("[Push] unsubscribe failed:", err);
    return false;
  }
}

/** Get current subscription if any */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.error("[Push] get subscription failed:", err);
    return null;
  }
}

// ── Helper: convert VAPID key ─────────────────────────
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

// ── Test helper: show a local notification ───────────
export function showTestNotification() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification("FairShare", {
    body: "Push notifications are working! 🎉",
    icon: "/icon-192x192.png",
  });
}
