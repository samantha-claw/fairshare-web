"use client";

import React, { useEffect, useState, useCallback, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

interface MemberProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profiles: MemberProfile;
}

interface GroupMembersListProps {
  groupId: string;
}

/* ────────────────────────────────────────────────────────────
   Role badge
   ──────────────────────────────────────────────────────────── */

const ROLE_STYLES: Record<GroupMember["role"], string> = {
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
  member: "bg-gray-50 text-gray-600 border-gray-200",
};

function RoleBadge({ role }: { role: GroupMember["role"] }) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full border px-2 py-0.5
        text-xs font-medium capitalize
        ${ROLE_STYLES[role]}
      `}
    >
      {role}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   Avatar with fallback initials
   ──────────────────────────────────────────────────────────── */

function Avatar({
  url,
  name,
}: {
  url: string | null;
  name: string;
}) {
  const initials = name
    .split(/[_\s]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
      {initials || "?"}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Confirmation modal
   ──────────────────────────────────────────────────────────── */

interface ConfirmModalProps {
  memberName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmRemoveModal({
  memberName,
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
        {/* Warning icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217
                 3.374 1.948 3.374h14.71c1.73 0
                 2.813-1.874 1.948-3.374L13.949
                 3.378c-.866-1.5-3.032-1.5-3.898
                 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h3 className="text-center text-base font-semibold text-gray-900">
          Remove member
        </h3>
        <p className="mt-2 text-center text-sm text-gray-500">
          Are you sure you want to remove{" "}
          <strong className="text-gray-700">{memberName}</strong> from
          this group? This action cannot be undone.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              flex-1 rounded-md border border-gray-300 bg-white
              px-4 py-2 text-sm font-medium text-gray-700
              shadow-sm transition-colors hover:bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:ring-offset-2
              disabled:opacity-50
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="
              flex flex-1 items-center justify-center rounded-md
              bg-red-600 px-4 py-2 text-sm font-medium text-white
              shadow-sm transition-colors hover:bg-red-700
              focus:outline-none focus:ring-2 focus:ring-red-500
              focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {loading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Removing…
              </>
            ) : (
              "Remove"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Add member form (shown inline)
   ──────────────────────────────────────────────────────────── */

interface AddMemberFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (username: string) => void;
  onCancel: () => void;
}

function AddMemberForm({
  loading,
  error,
  onSubmit,
  onCancel,
}: AddMemberFormProps) {
  const [username, setUsername] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = username.trim().toLowerCase();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-blue-200 bg-blue-50/50 p-4"
    >
      <label
        htmlFor="add-member-username"
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        Add member by username
      </label>

      <div className="flex gap-2">
        <input
          id="add-member-username"
          type="text"
          required
          value={username}
          placeholder="e.g. janedoe"
          autoFocus
          onChange={(e) => setUsername(e.target.value)}
          className="
            block flex-1 rounded-md border border-gray-300 bg-white
            px-3 py-2 text-sm text-gray-900 placeholder-gray-400
            shadow-sm transition-colors
            focus:border-blue-500 focus:outline-none focus:ring-1
            focus:ring-blue-500
          "
        />

        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="
            rounded-md bg-blue-600 px-4 py-2 text-sm font-medium
            text-white shadow-sm transition-colors hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {loading ? (
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            "Add"
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="
            rounded-md border border-gray-300 bg-white px-3 py-2
            text-sm font-medium text-gray-700 shadow-sm
            transition-colors hover:bg-gray-50
          "
        >
          Cancel
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}

/* ────────────────────────────────────────────────────────────
   Skeleton loader
   ──────────────────────────────────────────────────────────── */

function MembersSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-3 rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="h-9 w-9 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-200" />
          </div>
          <div className="h-5 w-14 rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────── */

export function GroupMembersList({ groupId }: GroupMembersListProps) {
  // ── Data state ──────────────────────────────────────────
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── UI state machine ────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);


  // ── Derived state ───────────────────────────────────────
  const currentUserRole = members.find(
    (m) => m.user_id === currentUserId
  )?.role;

  const isOwner = currentUserRole === "owner";

  // ── Fetch members ───────────────────────────────────────

  const fetchMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from("group_members")
      .select(
        `
        id,
        user_id,
        group_id,
        role,
        joined_at,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });

    if (error) {
      setFetchError(error.message);
      return;
    }

    // Supabase returns the join as an object, but we typed it
    // as a nested interface — cast safely.
    setMembers((data as unknown as GroupMember[]) ?? []);
  }, [groupId, supabase]);

  // ── Initial load ────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setCurrentUserId(session.user.id);
      }

      await fetchMembers();
      setLoading(false);
    }

    init();
  }, [fetchMembers, supabase.auth]);

  // ── Add member handler ──────────────────────────────────

  async function handleAddMember(username: string) {
    setAddError(null);
    setAddLoading(true);

    try {
      // 1. Look up the user by username (case-insensitive)
      const { data: profile, error: lookupError } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", username)
        .single();

      if (lookupError || !profile) {
        setAddError(`No user found with username "${username}".`);
        return;
      }

      // 2. Check if already a member
      const alreadyMember = members.some(
        (m) => m.user_id === profile.id
      );

      if (alreadyMember) {
        setAddError(`${profile.username} is already in this group.`);
        return;
      }

      // 3. Insert into group_members (RLS: owner only)
      const { error: insertError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: profile.id,
          role: "member",
        });

      if (insertError) {
        setAddError(insertError.message);
        return;
      }

      // 4. Refresh the list & close the form
      await fetchMembers();
      setShowAddForm(false);
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Failed to add member."
      );
    } finally {
      setAddLoading(false);
    }
  }

  // ── Remove member handler ───────────────────────────────

  async function handleRemoveMember() {
    if (!memberToRemove) return;

    setRemoveLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberToRemove.id);

      if (deleteError) {
        alert(deleteError.message);
        return;
      }

      // Optimistic removal from local state
      setMembers((prev) =>
        prev.filter((m) => m.id !== memberToRemove.id)
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to remove member."
      );
    } finally {
      setRemoveLoading(false);
      setMemberToRemove(null);
    }
  }

  // ── Render: loading ─────────────────────────────────────

  if (loading) {
    return (
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Members
        </h2>
        <MembersSkeleton />
      </section>
    );
  }

  // ── Render: error ───────────────────────────────────────

  if (fetchError) {
    return (
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Members
        </h2>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      </section>
    );
  }

  // ── Render: members list ────────────────────────────────

  // Sort: owner first, then admin, then member
  const ROLE_ORDER: Record<string, number> = {
    owner: 0,
    admin: 1,
    member: 2,
  };

  const sorted = [...members].sort(
    (a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3)
  );

  return (
    <section>
      {/* ── Header row ────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Members
          <span className="ml-1.5 text-sm font-normal text-gray-400">
            ({members.length})
          </span>
        </h2>

        {isOwner && !showAddForm && (
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setAddError(null);
            }}
            className="
              inline-flex items-center gap-1 rounded-md bg-blue-600
              px-3 py-1.5 text-sm font-medium text-white shadow-sm
              transition-colors hover:bg-blue-700
              focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:ring-offset-2
            "
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add member
          </button>
        )}
      </div>

      {/* ── Add member form (inline) ──────────────────── */}
      {showAddForm && (
        <div className="mb-4">
          <AddMemberForm
            loading={addLoading}
            error={addError}
            onSubmit={handleAddMember}
            onCancel={() => {
              setShowAddForm(false);
              setAddError(null);
            }}
          />
        </div>
      )}

      {/* ── Members list ──────────────────────────────── */}
      <div className="space-y-2">
        {sorted.map((member) => {
          const profile = member.profiles;
          const displayName =
            profile.display_name || profile.username;
          const isSelf = member.user_id === currentUserId;
          const canRemove =
            isOwner && !isSelf && member.role !== "owner";

          return (
            <div
              key={member.id}
              className="
                flex items-center gap-3 rounded-lg border
                border-gray-200 bg-white px-4 py-3
                transition-colors hover:bg-gray-50
              "
            >
              {/* Avatar */}
              <Avatar
                url={profile.avatar_url}
                name={displayName}
              />

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {displayName}
                    {isSelf && (
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        (you)
                      </span>
                    )}
                  </p>
                </div>
                <p className="truncate text-xs text-gray-500">
                  @{profile.username}
                </p>
              </div>

              {/* Role badge */}
              <RoleBadge role={member.role} />

              {/* Remove button (owner only, not self, not other owners) */}
              {canRemove && (
                <button
                  type="button"
                  onClick={() => setMemberToRemove(member)}
                  title={`Remove ${displayName}`}
                  className="
                    ml-1 rounded-md p-1.5 text-gray-400
                    transition-colors hover:bg-red-50 hover:text-red-600
                    focus:outline-none focus:ring-2 focus:ring-red-500
                    focus:ring-offset-2
                  "
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0
                         11-6.75 0 3.375 3.375 0 016.75 0zM4
                         19.235v-.11a6.375 6.375 0 0112.75
                         0v.109A12.318 12.318 0 0110.374 21c-2.331
                         0-4.512-.645-6.374-1.766z"
                    />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Empty state ───────────────────────────────── */}
      {members.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-8 text-center">
          <p className="text-sm text-gray-500">
            No members yet. Add someone to get started.
          </p>
        </div>
      )}

      {/* ── Confirmation modal ────────────────────────── */}
      {memberToRemove && (
        <ConfirmRemoveModal
          memberName={
            memberToRemove.profiles.display_name ||
            memberToRemove.profiles.username
          }
          loading={removeLoading}
          onConfirm={handleRemoveMember}
          onCancel={() => setMemberToRemove(null)}
        />
      )}
    </section>
  );
}