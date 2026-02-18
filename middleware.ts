import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// يجب أن يكون اسم الدالة "middleware" لكي يتعرف عليها Next.js
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // جلب بيانات المستخدم الحالي
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // تحديد الصفحات التي لا تحتاج لتسجيل دخول
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  const isPublicRoute = request.nextUrl.pathname === '/';

  // 1. إذا كان غير مسجل دخول، ويحاول دخول صفحة محمية (مثل dashboard) -> أرسله للـ login
  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. إذا كان مسجل دخول بالفعل، ويحاول دخول صفحة login أو register -> أرسله للـ dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// هذه الإعدادات تخبر Next.js متى يقوم بتشغيل هذا الملف
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
