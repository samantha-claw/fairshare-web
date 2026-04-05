"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { Member, Group } from "@/types/group";

// ==========================================
// 🧩 TYPES
// ==========================================
interface MembersCardProps {
  members: Member[];
  group: Group;
  isOwner: boolean;
  onOpenAddModal: () => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function MembersCard({
  members,
  group,
  isOwner,
  onOpenAddModal,
  onRemoveMember,
}: MembersCardProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Members</h2>
        {isOwner && (
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1 rounded-md bg-text-text-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:opacity-90"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add
          </button>
        )}
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="group flex items-center gap-3 rounded-lg border border-border bg-surface-2/50 p-3 transition-all hover:border-blue-200 hover:shadow-sm"
          >
            <Link href={`/dashboard/profile/${m.id}`}>
              <Avatar src={m.avatar_url} name={m.display_name || m.full_name || m.username} size="md" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/profile/${m.id}`}
                className="block truncate text-sm font-medium text-text-primary hover:text-text-primary hover:underline"
              >
                {m.display_name || m.full_name}
              </Link>
              <p className="truncate text-xs text-text-secondary">@{m.username}</p>
            </div>
            {m.id === group.owner_id && (
              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Owner
              </span>
            )}
            {isOwner && m.id !== group.owner_id && (
              <button
                onClick={() => onRemoveMember(m.id, m.display_name || m.username)}
                className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}