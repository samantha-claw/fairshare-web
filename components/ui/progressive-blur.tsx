"use client";

import { cn } from "@/lib/utils";

interface ProgressiveBlurProps {
  className?: string;
  direction?: "left" | "right";
  blurIntensity?: number;
}

export function ProgressiveBlur({
  className,
  direction = "right",
  blurIntensity = 1,
}: ProgressiveBlurProps) {
  const gradientDirection =
    direction === "left"
      ? "to right"
      : "to left";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 w-20",
        direction === "left" ? "left-0" : "right-0",
        className
      )}
      style={{
        backdropFilter: `blur(${blurIntensity}px)`,
        WebkitBackdropFilter: `blur(${blurIntensity}px)`,
        maskImage: `linear-gradient(${gradientDirection}, black, transparent)`,
        WebkitMaskImage: `linear-gradient(${gradientDirection}, black, transparent)`,
      }}
    />
  );
}
