"use client";

import { motion, useSpring, useInView, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Users, Receipt, Globe, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, value: 10000, label: "Active Users", suffix: "+" },
  { icon: Receipt, value: 50000, label: "Expenses Tracked", suffix: "+" },
  { icon: Globe, value: 50, label: "Countries", suffix: "+" },
  { icon: TrendingUp, value: 2, label: "Million USD Tracked", suffix: "M+" },
];

function StatCounter({
  icon: Icon,
  value,
  label,
  suffix,
  delay,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  suffix: string;
  delay: number;
}) {
  const countRef = useRef(null);
  const isInView = useInView(countRef, { once: false });
  const [hasAnimated, setHasAnimated] = useState(false);
  const springValue = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      springValue.set(value);
      setHasAnimated(true);
    } else if (!isInView && hasAnimated) {
      springValue.set(0);
      setHasAnimated(false);
    }
  }, [isInView, value, springValue, hasAnimated]);

  const displayValue = useTransform(springValue, (latest) =>
    Math.floor(latest)
  );

  return (
    <motion.div
      ref={countRef}
      className="flex flex-col items-center text-center group p-6 rounded-2xl bg-surface border border-border hover:border-border-2 transition-all"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-2 text-text-primary group-hover:bg-background transition-colors mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span className="text-3xl font-bold text-text-primary">
          {displayValue}
        </motion.span>
        <span className="text-2xl font-bold text-text-primary">{suffix}</span>
      </div>
      <p className="text-sm text-text-secondary mt-1">{label}</p>
    </motion.div>
  );
}

export function StatsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-surface">
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
            Our Impact
          </span>
          <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
            Trusted by thousands worldwide
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-text-secondary">
            Join a growing community of users who've simplified their expense tracking.
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCounter key={index} {...stat} delay={index * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
