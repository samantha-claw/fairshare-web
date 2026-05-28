import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Preserve the current locale prefix when redirecting to login
  const locale = new URL(request.url).pathname.split("/")[1] === "ar" ? "ar" : "en";
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/${locale}/login`, { status: 302 });
}