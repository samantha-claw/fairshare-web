"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, CalendarDays } from "lucide-react";

interface PublicProfile {
  id: string;
  username: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
}

function Avatar({ src, name }: { src?: string; name: string }) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "?"
  )}&background=dbeafe&color=1d4ed8&bold=true&size=150`;

  return (
    <img
      src={src || fallback}
      alt={name}
      className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg sm:h-32 sm:w-32"
    />
  );
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const supabase = createClient();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, display_name, avatar_url, created_at")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data as PublicProfile);
    } catch (err) {
      console.error(err);
      setError("User not found or profile is private.");
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId, fetchProfile]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading Profile…
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <User className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">User Not Found</h2>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Header Cover ── */}
      <div className="h-32 w-full bg-gradient-to-r from-blue-600 to-indigo-700 sm:h-48">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="relative -mt-12 sm:-mt-16">
          <div className="flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
            {/* ── Avatar ── */}
            <Avatar src={profile.avatar_url} name={profile.display_name || profile.full_name || profile.username} />
            
            {/* ── User Info ── */}
            <div className="mt-4 flex-1 text-center sm:mt-0 sm:pb-2 sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {profile.display_name || profile.full_name}
              </h1>
              <p className="text-sm font-medium text-gray-500">@{profile.username}</p>
            </div>
          </div>
        </div>

        {/* ── Details Card ── */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">Profile Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Full Name</p>
                <p className="text-xs text-gray-500">{profile.full_name || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Joined FairShare</p>
                <p className="text-xs text-gray-500">
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
