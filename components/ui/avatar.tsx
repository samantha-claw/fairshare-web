// ==========================================
// 📦 IMPORTS
// ==========================================
import { getAvatarFallback } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ==========================================
// 🧩 TYPES
// ==========================================
interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  return (
    <img
      src={src || getAvatarFallback(name)}
      alt={name}
      className={cn(
        `${sizeMap[size]} rounded-full object-cover ring-1 ring-gray-200`,
        className
      )}
    />
  );
}
