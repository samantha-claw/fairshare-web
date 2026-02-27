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
    "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-button-primary hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5",
  secondary:
    "border border-gray-200 bg-white text-gray-700 shadow-button hover:bg-gray-50 hover:border-gray-300",
  danger:
    "bg-red-600 text-white shadow-button hover:bg-red-700",
  ghost:
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
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
      className={`inline-flex items-center justify-center font-semibold rounded-button transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}