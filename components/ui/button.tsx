// components/ui/button.tsx
import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { Spinner } from "./spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES = {
  primary:
    "bg-text-text-primary text-surface hover:opacity-90 shadow-button-primary",
  secondary:
    "border border-border bg-surface text-text-primary shadow-button hover:bg-surface-2",
  danger:
    "bg-red-600 text-white shadow-button hover:bg-red-700",
  ghost:
    "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
} as const;

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3.5 text-sm gap-2.5",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
