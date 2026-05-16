"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations();
  return (
    <EmptyState
      illustration={getIllustration("groups")}
      title={t("emptyStates.groups.title")}
      description={t("emptyStates.groups.description")}
      action={{
        label: t("emptyStates.groups.actionLabel"),
        onClick: onCreateGroup,
        icon: <Users className="h-4 w-4" />,
      }}
      secondaryAction={
        onJoinGroup
          ? { label: t("emptyStates.groups.secondaryLabel"), onClick: onJoinGroup }
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
  const t = useTranslations();
  return (
    <EmptyState
      illustration={getIllustration("friends")}
      title={t("emptyStates.friends.title")}
      description={t("emptyStates.friends.description")}
      action={{
        label: t("emptyStates.friends.actionLabel"),
        onClick: onFindFriends,
        icon: <UserPlus className="h-4 w-4" />,
      }}
      secondaryAction={
        onShareLink
          ? { label: t("emptyStates.friends.secondaryLabel"), onClick: onShareLink }
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
  const t = useTranslations();
  return (
    <EmptyState
      illustration={getIllustration("expenses")}
      title={t("emptyStates.expenses.title")}
      description={t("emptyStates.expenses.description")}
      action={{
        label: t("emptyStates.expenses.actionLabel"),
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
  const t = useTranslations();
  const router = useRouter();
  return (
    <EmptyState
      illustration={getIllustration("notifications")}
      title={t("emptyStates.notifications.title")}
      description={t("emptyStates.notifications.description")}
      secondaryAction={{
        label: t("emptyStates.notifications.secondaryLabel"),
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
  const t = useTranslations();
  const router = useRouter();
  return (
    <EmptyState
      illustration={getIllustration("settlements")}
      title={t("emptyStates.settlements.title")}
      description={t("emptyStates.settlements.description")}
      secondaryAction={{
        label: t("emptyStates.settlements.secondaryLabel"),
        onClick: onViewGroups ?? (() => router.push("/dashboard/groups")),
      }}
    />
  );
}