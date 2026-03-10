import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === "23505" ||
    (typeof err.message === "string" && /duplicate/i.test(err.message))
  );
}

function asStringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

async function generateUniqueUsername(
  base: string,
  userId: string,
  supabase: SupabaseClient
): Promise<string> {
  const sanitized = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  // Atomically set username for existing profile row when username is still null.
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix =
      attempt === 0 ? "" : `_${Math.random().toString(36).slice(2, 6)}`;
    const candidate = `${sanitized || "user"}${suffix}`;

    const { data: updatedRow, error } = await supabase
      .from("profiles")
      .update({ username: candidate })
      .eq("id", userId)
      .is("username", null)
      .select("id")
      .maybeSingle();

    if (updatedRow) return candidate;

    if (error) {
      if (isUniqueViolation(error)) {
        continue;
      }
      console.error("Username assignment retry error:", error);
      continue;
    }

    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    if (currentProfileError) {
      console.error("Username lookup after update attempt failed:", currentProfileError);
      continue;
    }

    const existingUsername =
      typeof currentProfile?.username === "string"
        ? currentProfile.username.trim()
        : "";

    if (existingUsername.length > 0) {
      return existingUsername;
    }

    return `user_${userId.slice(0, 12)}`;
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
          const full_name = asStringOrNull(user.user_metadata?.full_name);
          const metadataName = asStringOrNull(user.user_metadata?.name);
          const emailPrefix =
            typeof user.email === "string" ? user.email.split("@")[0] : null;
          const baseUsername = full_name ?? metadataName ?? emailPrefix ?? "user";
          const display_name =
            full_name ?? metadataName ?? emailPrefix ?? "User";
          const avatar_url =
            asStringOrNull(user.user_metadata?.avatar_url) ??
            asStringOrNull(user.user_metadata?.picture);

          if (!existingProfile) {
            let inserted = false;

            for (let attempt = 0; attempt < 5; attempt++) {
              const suffix =
                attempt === 0
                  ? ""
                  : `_${Math.random().toString(36).slice(2, 6)}`;
              const candidate = `${
                baseUsername
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "")
                  .slice(0, 20) || "user"
              }${suffix}`;

              const { error: insertProfileError } = await supabase
                .from("profiles")
                .insert({
                  id: user.id,
                  email: user.email,
                  full_name,
                  display_name,
                  avatar_url,
                  username: candidate,
                });

              if (!insertProfileError) {
                inserted = true;
                break;
              }

              if (isUniqueViolation(insertProfileError)) {
                continue;
              }

              console.error("Profile insert error:", insertProfileError);
              break;
            }

            if (!inserted) {
              const fallbackUsername = `user_${user.id.slice(0, 12)}`;
              const { error: fallbackInsertError } = await supabase
                .from("profiles")
                .insert({
                  id: user.id,
                  email: user.email,
                  full_name,
                  display_name,
                  avatar_url,
                  username: fallbackUsername,
                });

              if (fallbackInsertError) {
                console.error("Profile fallback insert error:", fallbackInsertError);
              }
            }
          } else {
            const username = await generateUniqueUsername(
              baseUsername,
              user.id,
              supabase
            );

            const { error: fallbackUpdateUsernameError } = await supabase
              .from("profiles")
              .update({ username })
              .eq("id", user.id)
              .is("username", null);

            if (fallbackUpdateUsernameError) {
              if (!isUniqueViolation(fallbackUpdateUsernameError)) {
                console.error("Username update error:", fallbackUpdateUsernameError);
              }
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