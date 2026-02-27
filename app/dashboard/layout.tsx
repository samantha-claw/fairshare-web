// ==========================================
// 📦 IMPORTS
// ==========================================
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserProvider } from "@/contexts/user-context";

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
  return (
    <UserProvider>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}