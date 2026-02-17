"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ────────────────────────────────────────────────────────────
   Sub-components (co-located, not extracted into separate files
   until reuse is needed)
   ──────────────────────────────────────────────────────────── */

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v12m-3-2.818l.879.659c1.171.879
                   3.07.879 4.242 0 1.172-.879
                   1.172-2.303 0-3.182C13.536 12.219
                   12.768 12 12 12c-.725
                   0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303
                   0-3.182s2.9-.879 4.006 0l.415.33M21
                   12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            FairShare
          </span>
        </a>

        {/* Nav links */}
        <nav className="flex items-center gap-2">
          <a
            href="/login"
            className="
              rounded-md px-4 py-2 text-sm font-medium text-gray-700
              transition-colors hover:text-gray-900
            "
          >
            Sign in
          </a>
          <a
            href="/register"
            className="
              rounded-md bg-blue-600 px-4 py-2 text-sm font-medium
              text-white shadow-sm transition-colors hover:bg-blue-700
              focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:ring-offset-2
            "
          >
            Get started
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Background gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10
                   h-[600px] w-[600px] -translate-x-1/2 rounded-full
                   bg-blue-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 right-0 -z-10
                   h-[400px] w-[400px] rounded-full
                   bg-purple-100/40 blur-3xl"
      />

      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
          Now in public beta
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Split expenses,{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            not friendships
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
          FairShare makes it effortless to track shared expenses, settle
          balances, and collaborate financially with friends and groups —
          all in one place.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/register"
            className="
              inline-flex w-full items-center justify-center rounded-md
              bg-blue-600 px-6 py-3 text-sm font-medium text-white
              shadow-sm transition-colors hover:bg-blue-700
              focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:ring-offset-2 sm:w-auto
            "
          >
            Create free account
          </a>
          <a
            href="/login"
            className="
              inline-flex w-full items-center justify-center rounded-md
              border border-gray-300 bg-white px-6 py-3 text-sm
              font-medium text-gray-700 shadow-sm transition-colors
              hover:bg-gray-50 focus:outline-none focus:ring-2
              focus:ring-blue-500 focus:ring-offset-2 sm:w-auto
            "
          >
            Sign in →
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Features ────────────────────────────────────────────── */

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        {description}
      </p>
    </div>
  );
}

function Features() {
  const features: FeatureProps[] = [
    {
      title: "Group Expenses",
      description:
        "Create groups for trips, households, or any shared spending. Everyone sees the same ledger in real time.",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
    {
      title: "Smart Splitting",
      description:
        "Split equally, by percentage, or by exact amounts. FairShare calculates who owes what automatically.",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Instant Settlements",
      description:
        "See optimized repayment paths so the fewest transactions settle all debts across the group.",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
        </svg>
      ),
    },
    {
      title: "Friend System",
      description:
        "Add friends, manage requests, and quickly pull people into groups without sharing codes.",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
    },
    {
      title: "Role-Based Access",
      description:
        "Group owners and admins control who can add expenses. Members see everything, edit only their own.",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
    {
      title: "Privacy First",
      description:
        "Row-level security ensures you only see your own data. Public profiles are opt-in. Your finances stay yours.",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="border-t border-gray-100 bg-gray-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to share fairly
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Built for real-world group finances — from weekend trips to
            shared households.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Create an account",
      description: "Sign up in seconds with just an email and password.",
    },
    {
      step: "02",
      title: "Start a group",
      description:
        "Create a group and invite friends. Everyone joins with one click.",
    },
    {
      step: "03",
      title: "Log expenses",
      description:
        "Add expenses as they happen. FairShare splits and tracks everything.",
    },
    {
      step: "04",
      title: "Settle up",
      description:
        "See exactly who owes whom and settle with minimal transactions.",
    },
  ];

  return (
    <section className="border-t border-gray-100 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Four simple steps from signup to settled.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {s.step}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-gray-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Bottom CTA ──────────────────────────────────────────── */

function BottomCTA() {
  return (
    <section className="border-t border-gray-100 bg-gray-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Ready to share fairly?
        </h2>
        <p className="mt-4 text-base leading-relaxed text-gray-500">
          Join FairShare today — it&apos;s free and takes less than a
          minute.
        </p>
        <a
          href="/register"
          className="
            mt-8 inline-flex items-center justify-center rounded-md
            bg-blue-600 px-8 py-3 text-sm font-medium text-white
            shadow-sm transition-colors hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:ring-offset-2
          "
        >
          Create free account
        </a>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} FairShare. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-gray-400 transition-colors hover:text-gray-600">
            Privacy
          </a>
          <a href="#" className="text-sm text-gray-400 transition-colors hover:text-gray-600">
            Terms
          </a>
          <a href="#" className="text-sm text-gray-400 transition-colors hover:text-gray-600">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ── Loading skeleton ────────────────────────────────────── */

function LandingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="h-8 w-8 animate-spin text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main Page Component
   ──────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [checking, setChecking] = useState(true);

  const router = useRouter();

  /* ── Redirect authenticated users straight to dashboard ── */

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
        return;
      }

      setChecking(false);
    }

    checkSession();
  }, [router, supabase.auth]);

  /* ── Show spinner while we verify session ──────────────── */

  if (checking) return <LandingSkeleton />;

  /* ── Unauthenticated: full landing experience ──────────── */

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <BottomCTA />
      <Footer />
    </div>
  );
}