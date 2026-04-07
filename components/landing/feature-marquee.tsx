"use client";

import { motion } from "framer-motion";
import { Users, Receipt, QrCode, Bell, TrendingUp, Wallet, Clock, Shield } from "lucide-react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

const features = [
  { icon: Users, label: "Group Splitting" },
  { icon: Receipt, label: "Expense Tracking" },
  { icon: TrendingUp, label: "Smart Settlements" },
  { icon: QrCode, label: "QR Code Join" },
  { icon: Bell, label: "Real-time Notifications" },
  { icon: Wallet, label: "Balance Overview" },
  { icon: Clock, label: "Transaction History" },
  { icon: Shield, label: "Secure & Private" },
];

export function FeatureMarquee() {
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
