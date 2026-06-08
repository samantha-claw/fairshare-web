import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { locale?: string } }) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }

  // Preserve the current locale prefix when redirecting to login
  const locale = params?.locale && routing.locales.includes(params.locale as (typeof routing.locales)[number])
    ? params.locale
    : routing.defaultLocale;
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/${locale}/login`, { status: 302 });
}