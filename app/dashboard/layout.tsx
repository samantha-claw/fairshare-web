// ==========================================
// 📦 IMPORTS
// ==========================================
import { DashboardShell } from "@/components/layout/dashboard-shell";

// ==========================================
// 🧩 TYPES
// ==========================================
interface DashboardLayoutProps {
  children: React.ReactNode;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}