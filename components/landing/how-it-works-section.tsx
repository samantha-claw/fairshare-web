"use client";

import { motion } from "framer-motion";
import { Users, Receipt, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Create a group",
    description: "Start a group for your roommates, trip, or any shared expense scenario. Give it a name and add members.",
  },
  {
    number: "02",
    icon: Receipt,
    title: "Add expenses",
    description: "Log shared expenses as they happen. Split equally or customize who owes what for each expense.",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Settle up",
    description: "When ready, see who should pay whom. Our smart algorithm minimizes transactions for easy settling.",
  },
];

export function HowItWorksSection() {
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
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
            Three steps to fair splitting
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-text-secondary">
            No complicated setup. No learning curve. Just straightforward expense tracking 
            that anyone can use.
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
