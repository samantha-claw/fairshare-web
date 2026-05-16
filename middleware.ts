import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

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

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: any) {
  const { pathname } = request.nextUrl;

  // Rate limit auth routes
  const isRateLimitedRoute =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password");

  if (isRateLimitedRoute) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-request-id") ||
      crypto.randomUUID();

    if (isRateLimited(ip)) {
      return new Response("Too many requests. Please wait a moment.", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
  }

  // Let next-intl handle locale routing
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if the request starts with _next/static (static files)
    // - … if the request starts with _next/image (image optimization)
    // - … if the request starts with favicon.ico (favicon)
    // - … if the request starts with known file extensions
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
