"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X, ChevronRight, Users, Wallet, Receipt, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "FAQ", href: "#faq" },
];

export function HeroSection() {
  const [menuState, setMenuState] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    const scrollOptions: AddEventListenerOptions = { passive: true };
    window.addEventListener("scroll", handleScroll, scrollOptions);
    return () => window.removeEventListener("scroll", handleScroll, scrollOptions);
  }, []);

  return (
    <>
      {/* Header */}
      <header>
        <nav
          data-state={menuState && "active"}
          className="group fixed z-50 w-full pt-2"
        >
          <div
            className={cn(
              "mx-auto max-w-6xl rounded-2xl px-4 transition-all duration-300 sm:px-6",
              scrolled &&
                "bg-surface/80 backdrop-blur-xl border border-border shadow-sm"
            )}
          >
            <div
              className={cn(
                "relative flex flex-wrap items-center justify-between gap-6 py-4 duration-200",
                scrolled && "lg:py-3"
              )}
            >
              {/* Logo */}
              <Link
                href="/"
                aria-label="home"
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-text-primary">
                  <Wallet className="h-4 w-4 text-surface" />
                </div>
                <span className="text-lg font-semibold text-text-primary">
                  FairShare
                </span>
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                aria-expanded={menuState}
                aria-controls="mobile-menu"
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="m-auto size-6 duration-200 group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
                <X className="absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
              </button>

              {/* Desktop navigation */}
              <div className="hidden lg:block">
                <ul className="flex gap-8 text-sm">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-text-secondary hover:text-text-primary block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Desktop CTA */}
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-sm font-medium text-surface shadow-sm transition-all hover:opacity-90"
                >
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Mobile menu content */}
              <div id="mobile-menu" className="bg-surface group-data-[state=active]:block mb-6 hidden w-full flex-wrap items-center justify-end space-y-4 rounded-2xl border border-border p-6 shadow-xl lg:hidden">
                <div className="lg:hidden">
                  <ul className="space-y-4 text-base">
                    {menuItems.map((item, index) => (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className="text-text-secondary hover:text-text-primary block duration-150"
                          onClick={() => setMenuState(false)}
                        >
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-2"
                    onClick={() => setMenuState(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-text-primary px-4 py-2 text-sm font-medium text-surface shadow-sm transition-all hover:opacity-90"
                    onClick={() => setMenuState(false)}
                  >
                    Get Started
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <main className="overflow-x-hidden">
        <section className="relative min-h-screen flex items-center pt-32 pb-20 px-4 sm:px-6">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-border/30 blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl w-full">
            <div className="flex flex-col items-center text-center">
              {/* Beta badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
                </span>
                <span className="text-text-secondary">Free forever — No hidden fees</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="max-w-4xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Split expenses,{" "}
                <span className="bg-gradient-to-r from-text-primary via-text-secondary to-text-tertiary bg-clip-text text-transparent">
                  not friendships
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 max-w-2xl text-lg text-text-secondary sm:text-xl"
              >
                The smart way to track shared expenses with friends, roommates, and groups. 
                Settle debts fairly with minimum transactions.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-text-primary px-8 py-4 text-base font-medium text-surface shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
                >
                  Start splitting for free
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-8 py-4 text-base font-medium text-text-primary transition-colors hover:bg-surface-2"
                >
                  See how it works
                </Link>
              </motion.div>

              {/* Stats preview */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-16 grid grid-cols-3 gap-8 text-center"
              >
                <div>
                  <div className="text-2xl font-bold text-text-primary sm:text-3xl">10K+</div>
                  <div className="text-sm text-text-secondary">Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary sm:text-3xl">$2M+</div>
                  <div className="text-sm text-text-secondary">Tracked</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary sm:text-3xl">50+</div>
                  <div className="text-sm text-text-secondary">Countries</div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
