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
          className="relative rounded-3xl bg-text-primary p-8 sm:p-12 text-center overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-surface blur-3xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full bg-surface blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-surface mb-4">
              Ready to split expenses fairly?
            </h2>
            <p className="text-surface/80 mb-8 max-w-lg mx-auto">
              Join thousands of users who've simplified their group expenses. 
              Free forever, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-surface px-8 py-4 text-base font-medium text-text-primary shadow-lg transition-all hover:opacity-90"
              >
                Get started free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-surface/30 px-8 py-4 text-base font-medium text-surface transition-colors hover:bg-surface/10"
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
