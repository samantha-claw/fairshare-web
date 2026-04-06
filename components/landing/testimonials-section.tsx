"use client";

import { motion } from "framer-motion";
import React from "react";

const testimonials = [
  {
    text: "Finally, no more awkward conversations about money. FairShare made splitting rent and utilities with roommates completely painless.",
    name: "Sarah M.",
    role: "Medical Student",
  },
  {
    text: "We used it for our Europe trip with 6 friends. Everyone knew exactly what they owed, and settlements took minutes instead of hours.",
    name: "Alex K.",
    role: "Travel Group",
  },
  {
    text: "The smart settlement feature is genius. It figured out that only 2 payments needed to happen instead of everyone paying everyone.",
    name: "Mike T.",
    role: "Apartment Share",
  },
  {
    text: "I've tried other apps but they're all so complicated. FairShare just works. Add expense, see balance, settle up. Simple.",
    name: "Priya S.",
    role: "College Student",
  },
  {
    text: "We use it for our weekly office lunches. Scan the receipt, split it, and everyone gets notified. So much better than Venmo requests.",
    name: "David L.",
    role: "Software Engineer",
  },
  {
    text: "The QR code invite feature is so convenient. New roommate joined, scanned the code, and was immediately part of the household group.",
    name: "Emma J.",
    role: "House Share",
  },
];

interface TestimonialsColumnProps {
  testimonials: typeof testimonials;
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
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
            Loved by thousands
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-text-secondary">
            See what our users have to say about FairShare.
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
