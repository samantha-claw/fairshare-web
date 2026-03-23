// middleware.ts — complete corrected version
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── In-memory rate limiter ─────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;           // max requests per window per IP
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }

  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

function getSafeRedirectPath(nextParam: string | null, origin: string): string {
  if (!nextParam) return '/dashboard';
  try {
    const decoded = decodeURIComponent(nextParam);
    if (decoded.startsWith('//') || /^[a-zA-Z][a-zA-Z+\-.]*:/.test(decoded)) {
      return '/dashboard';
    }
    const url = new URL(decoded, origin);
    if (url.origin !== origin) return '/dashboard';
    return decoded;
  } catch {
    return '/dashboard';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams, origin } = request.nextUrl;

  // Rate limit auth routes
  const isRateLimitedRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  if (isRateLimitedRoute) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-request-id") ||
      crypto.randomUUID();

    if (isRateLimited(ip)) {
      return new NextResponse("Too many requests. Please wait a moment.", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = pathname.startsWith('/login') ||
                     pathname.startsWith('/register') ||
                     pathname.startsWith('/forgot-password');
  const isPublicPage = pathname.startsWith('/auth') || pathname === '/';

  // Not logged in → redirect to login, preserving return URL
  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Logged in → redirect away from auth pages to next or dashboard
  if (user && isAuthPage) {
    const nextPath = searchParams.get('next');
    const safePath = getSafeRedirectPath(nextPath, origin);
    const url = request.nextUrl.clone();
    url.pathname = safePath;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};