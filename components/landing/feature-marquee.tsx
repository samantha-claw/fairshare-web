"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Users, Receipt, QrCode, Bell, TrendingUp, Wallet, Clock, Shield } from "lucide-react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

export function FeatureMarquee() {
  const t = useTranslations("landing.features.items");

  const features = [
    { icon: Users, label: t("groupSplitting") },
    { icon: Receipt, label: t("easyExpense") },
    { icon: TrendingUp, label: t("smartSettlements") },
    { icon: QrCode, label: t("qrInvites") },
    { icon: Bell, label: t("notifications") },
    { icon: Wallet, label: t("balanceDashboard") },
    { icon: Clock, label: t("transactionHistory") },
    { icon: Shield, label: t("noAds") },
  ];

  return (
    <section className="py-12 bg-surface border-y border-border overflow-hidden">
      <div className="relative">
        <InfiniteSlider speed={60} speedOnHover={30} gap={64}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-text-secondary"
            >
              <feature.icon className="h-5 w-5" />
              <span className="text-sm font-medium whitespace-nowrap">
                {feature.label}
              </span>
            </div>
          ))}
        </InfiniteSlider>

        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-surface to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-surface to-transparent" />
        <ProgressiveBlur direction="left" className="opacity-50" />
        <ProgressiveBlur direction="right" className="opacity-50" />
      </div>
    </section>
  );
}
