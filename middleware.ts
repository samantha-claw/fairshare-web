// middleware.ts — complete corrected version
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  const { pathname, searchParams, origin } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') ||
                     pathname.startsWith('/register');
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