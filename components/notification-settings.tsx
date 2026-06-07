"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
  showTestNotification,
} from "@/lib/push-notifications";
import { createClient } from "@/lib/supabase/client";

export function NotificationSettings() {
  const t = useTranslations("notificationSettings");
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setSupported(isPushSupported());
    setPermission(getPermissionState());
    getCurrentSubscription().then((sub) => setSubscribed(!!sub));
  }, []);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    setMessage(null);

    try {
      if (subscribed) {
        // Unsubscribe
        const success = await unsubscribeFromPush();
        if (success) {
          setSubscribed(false);
          setMessage({ type: "success", text: t("disabled") });
          // Also remove from server
          await removeSubscriptionFromServer();
        } else {
          setMessage({ type: "error", text: t("errorDisable") });
        }
      } else {
        // Subscribe
        const subscription = await subscribeToPush();
        if (subscription) {
          setSubscribed(true);
          setPermission("granted");
          setMessage({ type: "success", text: t("enabled") });
          // Save to server
          await saveSubscriptionToServer(subscription);
          // Test notification
          setTimeout(() => showTestNotification(), 500);
        } else {
          setMessage({ type: "error", text: t("errorEnable") });
        }
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: t("errorGeneric") });
    } finally {
      setLoading(false);
      // Auto-clear message after 4s
      setTimeout(() => setMessage(null), 4000);
    }
  }

  async function saveSubscriptionToServer(subscription: PushSubscription) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sub = subscription.toJSON();
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: sub.keys?.p256dh,
          auth: sub.keys?.auth,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" }
      );
    } catch (err) {
      console.error("[Push] save to server failed:", err);
    }
  }

  async function removeSubscriptionFromServer() {
    try {
      const sub = await getCurrentSubscription();
      if (!sub) return;
      const supabase = createClient();
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", sub.endpoint);
    } catch (err) {
      console.error("[Push] remove from server failed:", err);
    }
  }

  if (!supported) {
    return (
      <div className="rounded-xl border border-border bg-surface-2/50 p-4">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-text-tertiary" />
          <div>
            <p className="text-sm font-medium text-text-primary">{t("notSupportedTitle")}</p>
            <p className="text-xs text-text-secondary">{t("notSupportedDesc")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              subscribed ? "bg-blue-500/10" : "bg-surface-2"
            }`}
          >
            {subscribed ? (
              <Bell className="h-5 w-5 text-blue-500" />
            ) : (
              <BellOff className="h-5 w-5 text-text-tertiary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary">
              {t("title")}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {subscribed
                ? t("activeSubtitle")
                : permission === "denied"
                ? t("blockedSubtitle")
                : t("inactiveSubtitle")}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading || permission === "denied"}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            subscribed ? "bg-blue-500" : "bg-surface-2"
          } ${permission === "denied" ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={subscribed ? t("disableAria") : t("enableAria")}
        >
          {loading ? (
            <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
          ) : (
            <motion.span
              layout
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md ${
                subscribed ? "right-0.5" : "left-0.5"
              }`}
            />
          )}
        </button>
      </div>

      {/* Status message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
              message.type === "success"
                ? "bg-positive/10 text-positive"
                : "bg-negative/10 text-negative"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission denied hint */}
      {permission === "denied" && (
        <p className="text-xs text-text-tertiary px-1">
          {t("deniedHint")}
        </p>
      )}
    </div>
  );
}
