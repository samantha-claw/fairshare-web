import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function generateUniqueUsername(
  base: string,
  userId: string,
  supabase: any
): Promise<string> {
  const sanitized = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  // Check availability and append a random suffix if needed.
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix =
      attempt === 0 ? "" : `_${Math.random().toString(36).slice(2, 6)}`;
    const candidate = `${sanitized || "user"}${suffix}`;

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  // Guaranteed unique fallback.
  return `user_${userId.slice(0, 12)}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.session.user;

      // Only create/update profile data when safe: never overwrite an existing username.
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", user.id)
        .maybeSingle();

      if (existingProfileError) {
        console.error("Profile lookup error:", existingProfileError);
      } else {
        const hasValidUsername =
          typeof existingProfile?.username === "string" &&
          existingProfile.username.trim().length > 0;

        if (!hasValidUsername) {
          const baseUsername =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "user";

          const username = await generateUniqueUsername(
            baseUsername,
            user.id,
            supabase
          );

          if (!existingProfile) {
            const { error: insertProfileError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email,
                full_name:
                  user.user_metadata?.full_name || user.user_metadata?.name || null,
                display_name:
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email?.split("@")[0] ||
                  "User",
                avatar_url:
                  user.user_metadata?.avatar_url ||
                  user.user_metadata?.picture ||
                  null,
                username,
              });

            if (insertProfileError) {
              console.error("Profile insert error:", insertProfileError);
            }
          } else {
            const { error: updateUsernameError } = await supabase
              .from("profiles")
              .update({ username })
              .eq("id", user.id);

            if (updateUsernameError) {
              console.error("Username update error:", updateUsernameError);
            }
          }
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // If we get here, something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}