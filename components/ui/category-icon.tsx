"use client";

import {
  UtensilsCrossed,
  Car,
  Home,
  Film,
  ShoppingCart,
  Heart,
  BookOpen,
  Plane,
  Zap,
  Package,
  type LucideProps,
} from "lucide-react";
import type { ExpenseCategory } from "@/types/group";

const CATEGORY_ICON_MAP: Record<ExpenseCategory, React.ComponentType<LucideProps>> = {
  food: UtensilsCrossed,
  transport: Car,
  housing: Home,
  entertainment: Film,
  shopping: ShoppingCart,
  health: Heart,
  education: BookOpen,
  travel: Plane,
  utilities: Zap,
  other: Package,
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: "#f97316",
  transport: "#3b82f6",
  housing: "#8b5cf6",
  entertainment: "#ec4899",
  shopping: "#14b8a6",
  health: "#ef4444",
  education: "#f59e0b",
  travel: "#06b6d4",
  utilities: "#6366f1",
  other: "#6b7280",
};

export const CATEGORY_COLOR_MAP = CATEGORY_COLORS;

interface CategoryIconProps extends LucideProps {
  category: ExpenseCategory | string;
  showBackground?: boolean;
}

export function CategoryIcon({ category, showBackground = false, ...props }: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[category as ExpenseCategory] || Package;
  const color = CATEGORY_COLORS[category as ExpenseCategory] || "#6b7280";

  if (showBackground) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon style={{ color }} {...props} />
      </div>
    );
  }

  return <Icon style={{ color }} {...props} />;
}
