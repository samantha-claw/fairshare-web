"use client";

import { useRouter } from "next/navigation";
import { Users, UserPlus, PlusCircle, ArrowLeft, Eye } from "lucide-react";
import { EmptyState } from "./empty-state";
import { AgentSplitIllustration } from "./agent-split-illustration";
import {
  EMPTY_STATE_CONTENT,
  type EmptyStateKey,
} from "@/lib/constants/empty-state-content";

// ─── Helper: tries Lottie URL, falls back to SVG ────────
function getIllustration(key: EmptyStateKey) {
  const content = EMPTY_STATE_CONTENT[key];
  // In production, check if .lottie file exists.
  // For now, always use SVG illustration as the reliable fallback.
  return <AgentSplitIllustration pose={content.pose} />;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1️⃣  GROUPS EMPTY STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface GroupsEmptyStateProps {
  onCreateGroup: () => void;
  onJoinGroup?: () => void;
}

export function GroupsEmptyState({
  onCreateGroup,
  onJoinGroup,
}: GroupsEmptyStateProps) {
  const c = EMPTY_STATE_CONTENT.groups;
  return (
    <EmptyState
      illustration={getIllustration("groups")}
      title={c.title}
      description={c.description}
      action={{
        label: c.actionLabel!,
        onClick: onCreateGroup,
        icon: <Users className="h-4 w-4" />,
      }}
      secondaryAction={
        onJoinGroup
          ? { label: c.secondaryLabel!, onClick: onJoinGroup }
          : undefined
      }
    />
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2️⃣  FRIENDS EMPTY STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface FriendsEmptyStateProps {
  onFindFriends: () => void;
  onShareLink?: () => void;
}

export function FriendsEmptyState({
  onFindFriends,
  onShareLink,
}: FriendsEmptyStateProps) {
  const c = EMPTY_STATE_CONTENT.friends;
  return (
    <EmptyState
      illustration={getIllustration("friends")}
      title={c.title}
      description={c.description}
      action={{
        label: c.actionLabel!,
        onClick: onFindFriends,
        icon: <UserPlus className="h-4 w-4" />,
      }}
      secondaryAction={
        onShareLink
          ? { label: c.secondaryLabel!, onClick: onShareLink }
          : undefined
      }
    />
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3️⃣  EXPENSES EMPTY STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface ExpensesEmptyStateProps {
  onAddExpense: () => void;
}

export function ExpensesEmptyState({ onAddExpense }: ExpensesEmptyStateProps) {
  const c = EMPTY_STATE_CONTENT.expenses;
  return (
    <EmptyState
      illustration={getIllustration("expenses")}
      title={c.title}
      description={c.description}
      action={{
        label: c.actionLabel!,
        onClick: onAddExpense,
        icon: <PlusCircle className="h-4 w-4" />,
      }}
    />
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4️⃣  NOTIFICATIONS EMPTY STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface NotificationsEmptyStateProps {
  onBack?: () => void;
}

export function NotificationsEmptyState({
  onBack,
}: NotificationsEmptyStateProps) {
  const router = useRouter();
  const c = EMPTY_STATE_CONTENT.notifications;
  return (
    <EmptyState
      illustration={getIllustration("notifications")}
      title={c.title}
      description={c.description}
      secondaryAction={{
        label: c.secondaryLabel!,
        onClick: onBack ?? (() => router.push("/dashboard")),
      }}
    />
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5️⃣  SETTLEMENTS EMPTY STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface SettlementsEmptyStateProps {
  onViewGroups?: () => void;
}

export function SettlementsEmptyState({
  onViewGroups,
}: SettlementsEmptyStateProps) {
  const router = useRouter();
  const c = EMPTY_STATE_CONTENT.settlements;
  return (
    <EmptyState
      illustration={getIllustration("settlements")}
      title={c.title}
      description={c.description}
      secondaryAction={{
        label: c.secondaryLabel!,
        onClick: onViewGroups ?? (() => router.push("/dashboard/groups")),
      }}
    />
  );
}