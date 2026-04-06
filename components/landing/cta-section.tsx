"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-background">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl bg-text-primary dark:bg-surface p-8 sm:p-12 text-center overflow-hidden border border-border"
        >
          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-surface dark:text-text-primary mb-4">
              Ready to split expenses fairly?
            </h2>
            <p className="text-surface/80 dark:text-text-secondary mb-8 max-w-lg mx-auto">
              Join thousands of users who&apos;ve simplified their group expenses. 
              Free forever, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-surface dark:bg-text-primary px-8 py-4 text-base font-medium text-text-primary dark:text-surface shadow-lg transition-all hover:opacity-90"
              >
                Get started free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-surface/30 dark:border-border px-8 py-4 text-base font-medium text-surface dark:text-text-primary transition-colors hover:bg-surface/10 dark:hover:bg-surface-2"
              >
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
