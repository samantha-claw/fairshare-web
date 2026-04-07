"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

const features = [
  "Unlimited groups",
  "Unlimited expenses",
  "Smart settlement algorithm",
  "Real-time notifications",
  "QR code group invites",
  "Transaction history",
  "Mobile & web access",
  "No ads, ever",
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 bg-background">
      <div className="mx-auto max-w-4xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-text-secondary uppercase tracking-wide">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
            100% Free. No catch.
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-text-secondary">
            We believe expense tracking should be accessible to everyone. 
            No premium tiers, no hidden fees, no ads.
          </p>
        </motion.div>

        {/* Single pricing card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative rounded-3xl border border-border bg-surface p-8 sm:p-12 shadow-sm"
        >
          {/* Free badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="inline-flex items-center gap-2 rounded-full bg-text-primary px-4 py-1.5 text-sm font-medium text-surface">
              <Sparkles className="h-4 w-4" />
              Free Forever
            </div>
          </div>

          {/* Price */}
          <div className="text-center mb-8 pt-4">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-text-primary">$0</span>
              <span className="text-text-secondary">/month</span>
            </div>
            <p className="mt-2 text-text-secondary">No credit card required</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-positive/10">
                  <Check className="h-3 w-3 text-positive" />
                </div>
                <span className="text-sm text-text-primary">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-text-primary px-8 py-4 text-base font-medium text-surface shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
            >
              Start for free
            </Link>
            <p className="mt-4 text-xs text-text-tertiary">
              Free forever • No limits • No spam
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
