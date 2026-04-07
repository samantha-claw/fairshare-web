import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* ── Subtle Background Pattern ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Primary gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-background to-surface-2" />
        
        {/* Decorative circles */}
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-surface-2/50 blur-[120px]" />
        <div className="absolute -right-20 top-1/4 h-[400px] w-[400px] rounded-full bg-surface-2/30 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-surface-2/40 blur-[110px]" />
        
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
