"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Users, Receipt, CheckCircle } from "lucide-react";

export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");

  const steps = [
    {
      number: "01",
      icon: Users,
      title: t("steps.step1"),
      description: t("steps.step1Desc"),
    },
    {
      number: "02",
      icon: Receipt,
      title: t("steps.step2"),
      description: t("steps.step2Desc"),
    },
    {
      number: "03",
      icon: CheckCircle,
      title: t("steps.step3"),
      description: t("steps.step3Desc"),
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-surface">
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
            {t("sectionLabel")}
          </span>
          <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-text-secondary">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border" />
              )}

              {/* Step number */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-background border border-border mb-4">
                  <step.icon className="h-10 w-10 text-text-primary" />
                </div>
                <div className="text-sm font-mono text-text-tertiary mb-2">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-text-primary">
                  {step.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-center text-text-secondary leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
