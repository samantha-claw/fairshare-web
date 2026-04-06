"use client";

import { motion } from "framer-motion";
import { 
  Users, Wallet, Receipt, QrCode, Bell, TrendingUp,
  ArrowRight, CheckCircle, Sparkles
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Users,
    secondaryIcon: Sparkles,
    title: "Group Expense Tracking",
    description: "Create unlimited groups for roommates, trips, or events. Everyone sees the same balances in real-time.",
    color: "text-text-primary",
  },
  {
    icon: TrendingUp,
    secondaryIcon: CheckCircle,
    title: "Smart Settlements",
    description: "Our algorithm calculates the minimum number of transactions to settle all debts. No more payment chains.",
    color: "text-positive",
  },
  {
    icon: Receipt,
    secondaryIcon: Sparkles,
    title: "Easy Expense Entry",
    description: "Add expenses in seconds with descriptions, categories, and custom splits. Split equally or by percentage.",
    color: "text-text-primary",
  },
  {
    icon: QrCode,
    secondaryIcon: CheckCircle,
    title: "QR Code Invites",
    description: "Share a QR code to instantly add members to your group. No more typing emails or usernames.",
    color: "text-positive",
  },
  {
    icon: Bell,
    secondaryIcon: Sparkles,
    title: "Real-time Notifications",
    description: "Get notified when expenses are added or someone settles up. Stay on top of your group activity.",
    color: "text-text-primary",
  },
  {
    icon: Wallet,
    secondaryIcon: CheckCircle,
    title: "Balance Dashboard",
    description: "See at a glance who owes what. Clear visualization of your financial position across all groups.",
    color: "text-positive",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 bg-background">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-text-secondary uppercase tracking-wide">
            Features
          </span>
          <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
            Everything you need to split fairly
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-text-secondary">
            Built for simplicity. No ads, no premium tiers, no hidden costs. 
            Just honest expense tracking that works.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative p-6 rounded-2xl border border-border bg-surface hover:border-border-2 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="relative inline-flex mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-text-primary group-hover:bg-background transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <feature.secondaryIcon className="absolute -top-1 -right-1 h-4 w-4 text-positive" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feature.description}
              </p>

              {/* Hover arrow */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-4 w-4 text-text-tertiary" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
