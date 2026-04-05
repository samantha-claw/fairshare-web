import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-text-primary">
              <svg className="h-4 w-4 text-surface" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-text-primary">FairShare</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:text-text-secondary">
              Sign in
            </Link>
            <Link href="/register" className="rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-surface shadow-sm transition-colors hover:opacity-90">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-border/40 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-text-secondary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
            </span>
            Now in public beta
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            Split expenses,{" "}
            <span className="bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
              not friendships
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
            FairShare makes it effortless to track shared expenses, settle balances, and collaborate financially with friends and groups.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex w-full items-center justify-center rounded-md bg-text-primary px-6 py-3 text-sm font-medium text-surface shadow-sm transition-colors hover:opacity-90 sm:w-auto">
              Create free account
            </Link>
            <Link href="/login" className="inline-flex w-full items-center justify-center rounded-md border border-border bg-surface px-6 py-3 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-surface-2 sm:w-auto">
              Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
          <p className="text-sm text-text-tertiary">
            &copy; {new Date().getFullYear()} FairShare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
