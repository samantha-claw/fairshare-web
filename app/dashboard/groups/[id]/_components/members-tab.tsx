"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { QrCode, UserPlus, Crown } from "lucide-react";
import type { Member, Group } from "@/types/group";

interface MembersTabProps {
  members: Member[];
  group: Group;
  isOwner: boolean;
  onOpenAddModal: () => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
  onOpenQRModal: () => void;
}

export function MembersTab({
  members,
  group,
  isOwner,
  onOpenAddModal,
  onRemoveMember,
  onOpenQRModal,
}: MembersTabProps) {
  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3">
        {isOwner && (
          <button
            onClick={onOpenAddModal}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-all hover:bg-surface-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </button>
        )}
        <button
          onClick={onOpenQRModal}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-text-primary px-4 py-3 text-sm font-medium text-surface transition-all hover:opacity-90"
        >
          <QrCode className="h-4 w-4" />
          Share Group
        </button>
      </div>

      {/* Members List */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="divide-y divide-border">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4"
            >
              <Link
                href={`/dashboard/profile/${member.id}`}
                className="shrink-0"
              >
                <Avatar
                  src={member.avatar_url}
                  name={member.display_name || member.full_name || member.username}
                  size="lg"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/profile/${member.id}`}
                  className="font-medium text-text-primary hover:underline"
                >
                  {member.display_name || member.full_name}
                </Link>
                <p className="text-sm text-text-secondary">
                  @{member.username}
                </p>
              </div>

              {member.id === group.owner_id && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-primary">
                  <Crown className="h-3 w-3" />
                  Owner
                </span>
              )}

              {isOwner && member.id !== group.owner_id && (
                <button
                  onClick={() =>
                    onRemoveMember(member.id, member.display_name || member.username)
                  }
                  className="text-xs text-negative hover:underline"
                >
                  Remove
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
