"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import React from "react";

interface TestimonialsColumnProps {
  testimonials: { text: string; name: string; role: string }[];
  duration?: number;
  className?: string;
}

function TestimonialsColumn({
  testimonials,
  duration = 40,
  className,
}: TestimonialsColumnProps) {
  return (
    <div className={className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {/* Duplicate for seamless loop */}
        {[...Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map(({ text, name, role }, i) => (
              <div
                className="p-6 rounded-2xl border border-border bg-surface max-w-sm w-full"
                key={i}
              >
                <p className="text-sm text-text-secondary leading-relaxed">
                  "{text}"
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-10 w-10 rounded-full bg-surface-2 flex items-center justify-center text-text-primary font-medium">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary text-sm">
                      {name}
                    </div>
                    <div className="text-xs text-text-tertiary">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

export function TestimonialsSection() {
  const t = useTranslations("landing.testimonials");

  const testimonials = [
    {
      text: t("items.t1Text"),
      name: t("items.t1Name"),
      role: t("items.t1Role"),
    },
    {
      text: t("items.t2Text"),
      name: t("items.t2Name"),
      role: t("items.t2Role"),
    },
    {
      text: t("items.t3Text"),
      name: t("items.t3Name"),
      role: t("items.t3Role"),
    },
    {
      text: t("items.t4Text"),
      name: t("items.t4Name"),
      role: t("items.t4Role"),
    },
    {
      text: t("items.t5Text"),
      name: t("items.t5Name"),
      role: t("items.t5Role"),
    },
    {
      text: t("items.t6Text"),
      name: t("items.t6Name"),
      role: t("items.t6Role"),
    },
  ];

  // Split testimonials into two columns
  const leftColumn = testimonials.slice(0, 3);
  const rightColumn = testimonials.slice(3);

  return (
    <section id="testimonials" className="py-24 bg-background overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
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

        {/* Testimonials columns */}
        <div className="relative h-[600px] overflow-hidden flex justify-center gap-6">
          {/* Fade gradients */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />

          {/* Columns */}
          <TestimonialsColumn
            testimonials={leftColumn}
            duration={50}
            className="hidden md:block"
          />
          <TestimonialsColumn
            testimonials={rightColumn}
            duration={60}
            className="hidden md:block"
          />

          {/* Single testimonial on mobile */}
          <div className="md:hidden">
            <TestimonialsColumn testimonials={testimonials.slice(0, 3)} duration={40} />
          </div>
        </div>
      </div>
    </section>
  );
}
