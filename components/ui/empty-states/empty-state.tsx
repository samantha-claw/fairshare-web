"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// ─── Types ──────────────────────────────────────────────
interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

interface EmptyStateProps {
  /** Inline SVG / React illustration component */
  illustration?: ReactNode;
  /** Remote .lottie URL — takes precedence over illustration */
  animationUrl?: string;
  /** Bold headline */
  title: string;
  /** Supporting body copy */
  description: string;
  /** Primary CTA */
  action?: EmptyStateAction;
  /** Optional secondary link-style CTA */
  secondaryAction?: EmptyStateAction;
  /** Extra wrapper classes */
  className?: string;
}

// ─── Animation Variants ─────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
} as const;

const illustrationVariant = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 200, damping: 18 },
  },
} as const;

// ─── Lottie Player (lazy) ───────────────────────────────
function LottiePlayer({ src }: { src: string }) {
  // Dynamic import keeps bundle small when not used
  // Install: npm i @lottiefiles/dotlottie-react
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DotLottieReact } = require("@lottiefiles/dotlottie-react");
    return (
      <DotLottieReact
        src={src}
        loop
        autoplay
        style={{ width: "100%", maxWidth: 260, height: "auto" }}
      />
    );
  } catch {
    return null;
  }
}

// ─── Component ──────────────────────────────────────────
export function EmptyState({
  illustration,
  animationUrl,
  title,
  description,
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`relative mx-auto w-full max-w-lg ${className}`}
    >
      {/* ── Outer Card ── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-white/70 px-6 py-10 text-center backdrop-blur-sm sm:px-10 sm:py-14">
        {/* Subtle gradient glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-100/60 blur-3xl" />

        {/* ── Illustration / Animation ── */}
        <motion.div
          variants={illustrationVariant}
          className="mx-auto mb-6 flex w-full max-w-[220px] items-center justify-center sm:max-w-[260px]"
        >
          {animationUrl ? (
            <LottiePlayer src={animationUrl} />
          ) : illustration ? (
            illustration
          ) : (
            /* Absolute fallback — sparkles icon */
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-indigo-50">
              <Sparkles className="h-12 w-12 text-indigo-300" />
            </div>
          )}
        </motion.div>

        {/* ── Title ── */}
        <motion.h3
          variants={item}
          className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl"
        >
          {title}
        </motion.h3>

        {/* ── Description ── */}
        <motion.p
          variants={item}
          className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500 sm:text-[15px]"
        >
          {description}
        </motion.p>

        {/* ── Actions ── */}
        {(action || secondaryAction) && (
          <motion.div
            variants={item}
            className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            {action && (
              <button
                onClick={action.onClick}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 active:scale-[0.97]"
              >
                {action.icon}
                {action.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                {secondaryAction.label}
              </button>
            )}
          </motion.div>
        )}

        {/* ── Agent Split watermark ── */}
        <motion.p
          variants={item}
          className="mt-8 text-[10px] font-bold uppercase tracking-widest text-gray-300"
        >
          — Agent Split was here —
        </motion.p>
      </div>
    </motion.div>
  );
}