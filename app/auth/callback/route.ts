import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.session.user;

      // ── Ensure a profile exists for this user ──
      // Google OAuth users won't have a profile row on first login.
      // We upsert to create one if missing, without overwriting existing data.
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              null,
            display_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "User",
            avatar_url:
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null,
            username:
              user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              `user_${user.id.slice(0, 8)}`,
          },
          {
            onConflict: "id",
            ignoreDuplicates: true, // Don't overwrite if profile already exists
          }
        );

      if (profileError) {
        console.error("Profile upsert error:", profileError);
        // Don't block login — the profile can be completed later
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // If we get here, something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}