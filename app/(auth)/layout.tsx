// app/(auth)/layout.tsx
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a1a]">
      {/* ── Gradient Background Layer ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Primary gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />

        {/* Floating Orbs */}
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/25 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-cyan-500/20 blur-[110px]" />
        <div className="absolute -bottom-20 right-1/4 h-[350px] w-[350px] rounded-full bg-violet-500/15 blur-[90px]" />
        <div className="absolute left-1/2 top-10 h-[200px] w-[200px] rounded-full bg-pink-500/10 blur-[80px]" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
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