"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { QrCode, UserPlus, Crown, MoreHorizontal } from "lucide-react";
import { useState } from "react";
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3">
        {isOwner && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenAddModal}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-4 text-sm font-medium text-text-primary transition-all hover:bg-surface-2"
          >
            <UserPlus className="h-5 w-5" />
            Add Member
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenQRModal}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-text-primary px-4 py-4 text-sm font-medium text-surface transition-all hover:opacity-90"
        >
          <QrCode className="h-5 w-5" />
          Share Group
        </motion.button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {members.map((member, index) => {
          const isGroupOwner = member.id === group.owner_id;
          const isHovered = hoveredId === member.id;

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onMouseEnter={() => setHoveredId(member.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative group"
            >
              <Link
                href={`/dashboard/profile/${member.id}`}
                className="block rounded-2xl border border-border bg-surface overflow-hidden transition-all hover:border-border-2 hover:shadow-lg"
              >
                {/* Avatar Section */}
                <div className="relative aspect-square bg-surface-2 overflow-hidden">
                  {member.avatar_url ? (
                    <motion.img
                      src={member.avatar_url}
                      alt={member.display_name || member.full_name || member.username}
                      className="h-full w-full object-cover"
                      animate={{
                        scale: isHovered ? 1.05 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Avatar
                        src={member.avatar_url}
                        name={member.display_name || member.full_name || member.username}
                        size="lg"
                        className="h-20 w-20"
                      />
                    </div>
                  )}

                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-text-primary/60 to-transparent"
                  />
                </div>

                {/* Info Section */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text-primary truncate">
                      {member.display_name || member.full_name}
                    </h3>
                    {isGroupOwner && (
                      <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-text-secondary truncate">
                    @{member.username}
                  </p>
                </div>
              </Link>

              {/* Remove Button (Owner only) */}
              {isOwner && !isGroupOwner && (
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpenId(menuOpenId === member.id ? null : member.id);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/80 backdrop-blur-sm text-text-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-100 transition-opacity hover:text-negative hover:bg-surface"
                    aria-label="Open member actions"
                    aria-haspopup="menu"
                    aria-expanded={menuOpenId === member.id}
                    aria-controls={menuOpenId === member.id ? `member-menu-${member.id}` : undefined}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </button>

                  {menuOpenId === member.id && (
                    <motion.div
                      id={`member-menu-${member.id}`}
                      role="menu"
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-xl border border-border bg-surface p-1 shadow-lg"
                    >
                      <button
                        role="menuitem"
                        onClick={(e) => {
                          e.preventDefault();
                          onRemoveMember(member.id, member.display_name || member.username);
                          setMenuOpenId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-negative hover:bg-negative/10 transition-colors"
                      >
                        Remove
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Member Count */}
      <div className="text-center text-sm text-text-tertiary pt-4">
        {members.length} member{members.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
