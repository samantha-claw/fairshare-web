"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Is FairShare really free?",
    answer:
      "Yes, 100% free. No premium tier, no ads, no hidden fees. We believe expense tracking should be accessible to everyone.",
  },
  {
    question: "How does smart settlement work?",
    answer:
      "Instead of everyone paying everyone, FairShare calculates the minimum number of transactions needed to settle all debts. For example, if you owe Sarah $20 and Sarah owes Mike $20, you can just pay Mike directly. Fewer transfers, less hassle.",
  },
  {
    question: "Can I split expenses unevenly?",
    answer:
      "Absolutely! You can split equally, by percentage, or specify exact amounts for each person. Perfect for when someone didn't order dessert or left early.",
  },
  {
    question: "What if someone owes me and I owe them?",
    answer:
      "FairShare automatically nets out debts. If you owe Sarah $20 and she owes you $15, it shows you only owe $5. This happens automatically across all your groups.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. Your expense data is only visible to you and members of your groups. We never sell your data or show you ads based on your spending.",
  },
  {
    question: "Do I need everyone to have the app?",
    answer:
      "Everyone who wants to see balances and add expenses needs an account, but you can track expenses on behalf of others. They'll get notified and can join when they're ready.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 bg-surface">
      <div className="mx-auto max-w-3xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-text-secondary uppercase tracking-wide">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-text-secondary">
            Everything you need to know about FairShare.
          </p>
        </motion.div>

        {/* FAQ items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border border-border rounded-2xl bg-background overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-medium text-text-primary pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-text-tertiary transition-transform duration-300 flex-shrink-0",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96 pb-6" : "max-h-0"
                )}
              >
                <p className="px-6 text-text-secondary leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
