"use client";

import { motion } from "framer-motion";
import { BarChart3, Sparkles } from "lucide-react";

export function AnalysisTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="relative inline-flex mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-2">
            <BarChart3 className="h-10 w-10 text-text-tertiary" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-2">
            <Sparkles className="h-4 w-4 text-text-tertiary" />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Analysis Coming Soon
        </h3>
        <p className="text-sm text-text-secondary max-w-sm">
          Get insights into your group spending patterns, category breakdowns,
          and expense trends. We're working on it!
        </p>

        <div className="mt-8 grid grid-cols-3 gap-4 opacity-50">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-surface-2 border border-border"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
