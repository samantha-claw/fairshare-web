"use client";

import React, { useEffect, useState, useCallback, useRef, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";

/* ════════════════════════════════════════════════════════════
   INTERFACES
   ════════════════════════════════════════════════════════════ */

interface Group {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  currency: string;
}

interface Member {
  id: string;
  username: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  profiles: {
    username: string;
    full_name: string;
    display_name: string;
    avatar_url: string;
  };
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  created_at: string;
  paid_by: string;
  profiles: { full_name: string; username: string; display_name: string };
  expense_splits?: { user_id: string }[];
}

interface SearchResult {
  id: string;
  username: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
}

interface InvitableFriend {
  friend_id: string;
  friend_username: string;
  friend_full_name: string;
  friend_display_name: string;
  friend_avatar_url: string;
}

interface Balance {
  user_id: string;
  display_name: string;
  avatar_url: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
}

interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
  notes: string | null;
  created_at: string;
  created_by: string;
  from_profile: { display_name: string; username: string; avatar_url: string };
  to_profile: { display_name: string; username: string; avatar_url: string };
}

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e0e7ff&color=4338ca&bold=true`;

  return (
    <img
      src={src || fallback}
      alt={name}
      className={`${sizeMap[size]} rounded-full object-cover ring-1 ring-gray-200`}
    />
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */

export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  /* ── Core state ──────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<Settlement[]>([]);
  const [completedSettlements, setCompletedSettlements] = useState<Settlement[]>([]);

  /* ── Member modal state ──────────────────────────────── */
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [invitableFriends, setInvitableFriends] = useState<InvitableFriend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);

  /* ── Search state ────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  /* ── Expense modal state ─────────────────────────────── */
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  /* ── Settle Up modal state ───────────────────────────── */
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleReceiver, setSettleReceiver] = useState<string>("");
  const [settleAmount, setSettleAmount] = useState("");
  const [submittingSettle, setSubmittingSettle] = useState(false);

  /* ── Settlement action loading ───────────────────────── */
  const [processingSettlementId, setProcessingSettlementId] = useState<string | null>(null);

  /* ── Group Settings modal state ──────────────────────── */
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);

  /* ── Active tab state ────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<"expenses" | "activity">("expenses");

  /* ── Debounced live search ───────────────────────────── */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      const { data, error: searchError } = await supabase
        .from("profiles")
        .select("id, username, full_name, display_name, avatar_url")
        .ilike("username", `%${searchTerm.trim()}%`)
        .limit(5);

      if (!searchError && data) {
        const existingMemberIds = members.map((m) => m.id);
        const newUsers = data.filter((user: any) => !existingMemberIds.includes(user.id));
        setSearchResults(newUsers as SearchResult[]);
      }
      setSearching(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, members, supabase]);

  /* ════════════════════════════════════════════════════════
     DATA FETCHING
     ════════════════════════════════════════════════════════ */

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setCurrentUser(session.user.id);

      // 1. Group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();
      if (groupError) throw groupError;
      setGroup(groupData as Group);

      // 2. Members
      const { data: membersData } = await supabase
        .from("group_members")
        .select(`*, profiles ( username, full_name, display_name, avatar_url )`)
        .eq("group_id", groupId);

      if (membersData) {
        setMembers(
          membersData.map((m: any) => ({
            id: m.user_id,
            ...m.profiles,
            profiles: m.profiles,
          }))
        );
      }

      // 3. Expenses
      const { data: expensesData, error: expError } = await supabase
        .from("expenses")
        .select(
          `id, name, amount, created_at, paid_by,
           profiles:paid_by ( full_name, username, display_name ),
           expense_splits ( user_id )`
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (expError) console.error("Error fetching expenses:", expError);
      if (expensesData) {
        // @ts-ignore
        setExpenses(expensesData);
      }

      // 4. Balances
      const { data: balancesData } = await supabase.rpc("get_group_balances", {
        _group_id: groupId,
      });
      if (balancesData) {
        // @ts-ignore
        setBalances(balancesData);
      }

      // 5. Pending Settlements
      const { data: pendingSettlementsData } = await supabase
        .from("settlements")
        .select(
          `*,
           from_profile:from_user ( display_name, username, avatar_url ),
           to_profile:to_user ( display_name, username, avatar_url )`
        )
        .eq("group_id", groupId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingSettlementsData) {
        setPendingSettlements(pendingSettlementsData as unknown as Settlement[]);
      }

      // 6. Completed Settlements
      const { data: completedSettlementsData } = await supabase
        .from("settlements")
        .select(
          `*,
           from_profile:from_user ( display_name, username, avatar_url ),
           to_profile:to_user ( display_name, username, avatar_url )`
        )
        .eq("group_id", groupId)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (completedSettlementsData) {
        setCompletedSettlements(completedSettlementsData as unknown as Settlement[]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load group data.");
    } finally {
      setLoading(false);
    }
  }, [groupId, supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ════════════════════════════════════════════════════════
     REALTIME SUBSCRIPTIONS
     ════════════════════════════════════════════════════════ */

  useEffect(() => {
    const channel = supabase
      .channel(`group-details-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `group_id=eq.${groupId}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_splits" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settlements", filter: `group_id=eq.${groupId}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_log", filter: `group_id=eq.${groupId}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` },
        () => fetchData()
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [groupId, supabase, fetchData]);

  /* ════════════════════════════════════════════════════════
     FETCH INVITABLE FRIENDS
     ════════════════════════════════════════════════════════ */

  const fetchInvitableFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const { data, error: friendsError } = await supabase.rpc("get_friends_to_invite", {
        _group_id: groupId,
      });
      if (friendsError) throw friendsError;
      setInvitableFriends((data as InvitableFriend[]) || []);
    } catch (err) {
      console.error("Failed to load invitable friends:", err);
    } finally {
      setLoadingFriends(false);
    }
  }, [supabase, groupId]);

  function openMemberModal() {
    setIsMemberModalOpen(true);
    setSearchTerm("");
    setSearchResults([]);
    fetchInvitableFriends();
  }

  /* ════════════════════════════════════════════════════════
     EXPENSE MODAL HELPERS
     ════════════════════════════════════════════════════════ */

  function openAddExpenseModal() {
    setEditingExpenseId(null);
    setExpenseName("");
    setExpenseAmount("");
    setSelectedMembers(members.map((m) => m.id));
    setIsExpenseModalOpen(true);
  }

  function openEditExpenseModal(exp: Expense) {
    setEditingExpenseId(exp.id);
    setExpenseName(exp.name);
    setExpenseAmount(exp.amount.toString());
    const participantIds = exp.expense_splits?.map((split) => split.user_id) || [];
    setSelectedMembers(participantIds);
    setIsExpenseModalOpen(true);
  }

  /* ════════════════════════════════════════════════════════
     SETTLE UP MODAL HELPERS
     ════════════════════════════════════════════════════════ */

  function openSettleUpModal() {
    setSettleReceiver("");
    setSettleAmount("");
    setIsSettleModalOpen(true);
  }

  /* ════════════════════════════════════════════════════════
     HANDLERS
     ════════════════════════════════════════════════════════ */

  async function handleAddMember(targetUserId: string) {
    setAddingMember(targetUserId);
    try {
      const { error: addError } = await supabase.rpc("add_member_to_group", {
        _group_id: groupId,
        _user_id: targetUserId,
      });

      if (addError) {
        alert(addError.message);
        return;
      }

      setInvitableFriends((prev) => prev.filter((f) => f.friend_id !== targetUserId));
      setSearchResults((prev) => prev.filter((u) => u.id !== targetUserId));
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingMember(null);
    }
  }

  async function handleSaveExpense(e: FormEvent) {
    e.preventDefault();
    if (!expenseName || !expenseAmount) return;
    if (selectedMembers.length === 0) {
      alert("Please select at least one member to split with.");
      return;
    }

    setSubmittingExpense(true);
    let rpcError;

    if (editingExpenseId) {
      const res = await supabase.rpc("edit_expense_custom_split", {
        _expense_id: editingExpenseId,
        _name: expenseName,
        _amount: parseFloat(expenseAmount),
        _participant_ids: selectedMembers,
      });
      rpcError = res.error;
    } else {
      const res = await supabase.rpc("add_expense_custom_split", {
        _group_id: groupId,
        _name: expenseName,
        _amount: parseFloat(expenseAmount),
        _participant_ids: selectedMembers,
      });
      rpcError = res.error;
    }

    if (rpcError) {
      alert("Error saving expense: " + rpcError.message);
    } else {
      setIsExpenseModalOpen(false);
      setEditingExpenseId(null);
      setExpenseName("");
      setExpenseAmount("");
      setSelectedMembers([]);
      fetchData();
    }
    setSubmittingExpense(false);
  }

  /* ── Settlement Handlers ─────────────────────────────── */

  async function handleInitiateSettlement(e: FormEvent) {
    e.preventDefault();

    if (!settleReceiver) {
      alert("Please select who you are paying.");
      return;
    }
    if (!settleAmount || parseFloat(settleAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (!currentUser) {
      alert("Session expired. Please refresh.");
      return;
    }

    setSubmittingSettle(true);

    try {
      const { error: insertError } = await supabase.from("settlements").insert({
        group_id: groupId,
        from_user: currentUser,
        to_user: settleReceiver,
        amount: parseFloat(settleAmount),
        status: "pending",
        notes: "Settle up",
        created_by: currentUser,
      });

      if (insertError) {
        alert("Error: " + insertError.message);
        return;
      }

      await supabase.from("activity_log").insert({
        group_id: groupId,
        user_id: currentUser,
        action: "settlement_initiated",
        metadata: {
          amount: parseFloat(settleAmount),
          to_user: settleReceiver,
          type: "settlement",
        },
      });

      setIsSettleModalOpen(false);
      setSettleReceiver("");
      setSettleAmount("");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setSubmittingSettle(false);
    }
  }

  async function handleApproveSettlement(settlementId: string) {
    if (!currentUser) return;
    setProcessingSettlementId(settlementId);

    try {
      const { error: updateError } = await supabase
        .from("settlements")
        .update({ status: "completed" })
        .eq("id", settlementId)
        .eq("to_user", currentUser);

      if (updateError) {
        alert("Error: " + updateError.message);
        return;
      }

      await supabase.from("activity_log").insert({
        group_id: groupId,
        user_id: currentUser,
        action: "settlement_approved",
        metadata: { settlement_id: settlementId },
      });

      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingSettlementId(null);
    }
  }

  async function handleRejectSettlement(settlementId: string) {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to reject this settlement?")) return;
    setProcessingSettlementId(settlementId);

    try {
      const { error: deleteError } = await supabase
        .from("settlements")
        .delete()
        .eq("id", settlementId)
        .eq("to_user", currentUser)
        .eq("status", "pending");

      if (deleteError) {
        alert("Error: " + deleteError.message);
        return;
      }

      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingSettlementId(null);
    }
  }

  async function handleDeleteSettlement(settlementId: string) {
    if (!currentUser) return;
    if (!confirm("Cancel this settlement request?")) return;
    setProcessingSettlementId(settlementId);

    try {
      const { error: deleteError } = await supabase
        .from("settlements")
        .delete()
        .eq("id", settlementId)
        .eq("from_user", currentUser)
        .eq("status", "pending");

      if (deleteError) {
        alert("Error: " + deleteError.message);
        return;
      }

      await supabase.from("activity_log").insert({
        group_id: groupId,
        user_id: currentUser,
        action: "settlement_deleted",
        metadata: { settlement_id: settlementId },
      });

      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingSettlementId(null);
    }
  }

  async function handleDeleteExpense(expenseId: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will recalculate all balances.`))
      return;

    const { error: delError } = await supabase.rpc("delete_expense", { _expense_id: expenseId });

    if (delError) {
      alert("Error deleting expense: " + delError.message);
    } else {
      fetchData();
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Are you sure you want to remove ${memberName} from the group?`)) return;

    const { error: removeError } = await supabase.rpc("remove_member_from_group", {
      _group_id: groupId,
      _user_id: memberId,
    });

    if (removeError) {
      alert("Error: " + removeError.message);
    } else {
      fetchData();
    }
  }

  /* ── Group Settings Handlers ─────────────────────────── */

  async function handleDeleteGroup() {
    if (!group || deleteConfirmText !== group.name) {
      alert("Please type the group name exactly to confirm deletion.");
      return;
    }

    setDeletingGroup(true);
    try {
      const { error: deleteError } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId)
        .eq("owner_id", currentUser!);

      if (deleteError) {
        alert("Error deleting group: " + deleteError.message);
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setDeletingGroup(false);
    }
  }

  async function handleLeaveGroup() {
    if (!currentUser) return;

    // Check current user's balance
    const myBalance = balances.find((b) => b.user_id === currentUser);
    if (myBalance && myBalance.net_balance !== 0) {
      alert(
        "You must settle your balances before leaving the group. " +
          (myBalance.net_balance > 0
            ? `You are still owed ${formatCurrency(myBalance.net_balance, group?.currency)}.`
            : `You still owe ${formatCurrency(myBalance.net_balance, group?.currency)}.`)
      );
      return;
    }

    if (!confirm("Are you sure you want to leave this group? This action cannot be undone.")) return;

    setLeavingGroup(true);
    try {
      const { error: leaveError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", currentUser);

      if (leaveError) {
        alert("Error leaving group: " + leaveError.message);
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setLeavingGroup(false);
    }
  }

  /* ════════════════════════════════════════════════════════
     DERIVED DATA
     ════════════════════════════════════════════════════════ */

  const isOwner = currentUser === group?.owner_id;
  const otherMembers = members.filter((m) => m.id !== currentUser);
  const myBalance = balances.find((b) => b.user_id === currentUser);
  const myNetBalance = myBalance?.net_balance ?? 0;
  const canLeave = myNetBalance === 0;

  const totalGroupExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Combine expenses and completed settlements for activity timeline
  const allActivities = [
    ...expenses.map((e) => ({ ...e, type: "expense" as const })),
    ...completedSettlements.map((s) => ({ ...s, type: "settlement" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Spinner className="h-5 w-5" />
          Loading Group…
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-semibold text-red-600">{error || "Group not found"}</h2>
          <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{group.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {members.length} member{members.length !== 1 && "s"} · {group.currency || "USD"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
              title="Group Settings"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Dashboard
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {/* ── Summary Cards Row ────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total Expenses */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Expenses</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(totalGroupExpenses, group.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* My Balance */}
          <div
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              myNetBalance > 0
                ? "border-green-200"
                : myNetBalance < 0
                ? "border-red-200"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  myNetBalance > 0
                    ? "bg-green-100 text-green-600"
                    : myNetBalance < 0
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">My Balance</p>
                <p
                  className={`text-xl font-bold ${
                    myNetBalance > 0
                      ? "text-green-600"
                      : myNetBalance < 0
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {myNetBalance > 0 && "+"}
                  {myNetBalance < 0 && "-"}
                  {formatCurrency(myNetBalance, group.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Settlements Count */}
          <div
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              pendingSettlements.length > 0 ? "border-amber-200" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  pendingSettlements.length > 0
                    ? "bg-amber-100 text-amber-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending</p>
                <p className="text-xl font-bold text-gray-900">{pendingSettlements.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Grid Layout ─────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column (2 cols wide) */}
          <div className="space-y-6 lg:col-span-2">
            {/* ── Pending Settlements ──────────────────── */}
            {pendingSettlements.length > 0 && (
              <section className="rounded-xl border border-amber-200 bg-amber-50/30 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-lg">⏳</span>
                  <h2 className="text-sm font-semibold text-amber-800">
                    Pending Settlements ({pendingSettlements.length})
                  </h2>
                </div>

                <div className="space-y-3">
                  {pendingSettlements.map((s) => {
                    const isSender = currentUser === s.from_user;
                    const isReceiver = currentUser === s.to_user;
                    const isProcessing = processingSettlementId === s.id;

                    return (
                      <div
                        key={s.id}
                        className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Link href={`/dashboard/profile/${s.from_user}`}>
                            <Avatar
                              src={s.from_profile.avatar_url}
                              name={s.from_profile.display_name || s.from_profile.username}
                              size="sm"
                            />
                          </Link>
                          <div className="text-sm">
                            <p className="text-gray-800">
                              <Link
                                href={`/dashboard/profile/${s.from_user}`}
                                className="font-semibold hover:text-blue-600 hover:underline"
                              >
                                {isSender ? "You" : s.from_profile.display_name || s.from_profile.username}
                              </Link>
                              {" → "}
                              <Link
                                href={`/dashboard/profile/${s.to_user}`}
                                className="font-semibold hover:text-blue-600 hover:underline"
                              >
                                {isReceiver ? "You" : s.to_profile.display_name || s.to_profile.username}
                              </Link>
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(s.created_at).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(s.amount, group.currency)}
                          </span>

                          {isReceiver && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleApproveSettlement(s.id)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isProcessing ? <Spinner className="h-3.5 w-3.5" /> : "✅"} Approve
                              </button>
                              <button
                                onClick={() => handleRejectSettlement(s.id)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isProcessing ? <Spinner className="h-3.5 w-3.5" /> : "❌"} Reject
                              </button>
                            </div>
                          )}

                          {isSender && (
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                Pending…
                              </span>
                              <button
                                onClick={() => handleDeleteSettlement(s.id)}
                                disabled={isProcessing}
                                className="p-1 text-gray-400 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Cancel request"
                              >
                                {isProcessing ? (
                                  <Spinner className="h-4 w-4" />
                                ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          )}

                          {!isSender && !isReceiver && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Pending</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Expenses / Activity Tabs ─────────────── */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Tab Bar */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                    activeTab === "expenses"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  💸 Expenses ({expenses.length})
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                    activeTab === "activity"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📋 Activity ({allActivities.length})
                </button>
              </div>

              <div className="p-6">
                {/* Actions Row */}
                <div className="mb-4 flex items-center justify-end gap-2">
                  <button
                    onClick={openSettleUpModal}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <span>🤝</span> Settle Up
                  </button>
                  <button
                    onClick={openAddExpenseModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
                  >
                    <span>💸</span> Add Expense
                  </button>
                </div>

                {/* Expenses Tab */}
                {activeTab === "expenses" && (
                  <>
                    {expenses.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
                        <p className="text-gray-500">No expenses yet. Start adding!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {expenses.map((exp) => (
                          <div
                            key={exp.id}
                            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-gray-200 hover:shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div className="rounded-lg bg-white p-3 text-xl shadow-sm ring-1 ring-gray-100">
                                🧾
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{exp.name}</h3>
                                <p className="text-xs text-gray-500">
                                  Paid by{" "}
                                  <Link
                                    href={`/dashboard/profile/${exp.paid_by}`}
                                    className="font-medium text-gray-700 hover:text-blue-600 hover:underline"
                                  >
                                    {exp.profiles.display_name || exp.profiles.full_name}
                                  </Link>{" "}
                                  · {new Date(exp.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(exp.amount, group.currency)}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                                  {exp.expense_splits?.length} members
                                </span>

                                {(currentUser === exp.paid_by || isOwner) && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => openEditExpenseModal(exp)}
                                      className="p-1 text-gray-400 transition-colors hover:text-blue-600"
                                      title="Edit"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteExpense(exp.id, exp.name)}
                                      className="p-1 text-gray-400 transition-colors hover:text-red-600"
                                      title="Delete"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Activity Tab */}
                {activeTab === "activity" && (
                  <>
                    {allActivities.length === 0 ? (
                      <p className="py-4 text-center text-sm text-gray-500">No activity to show yet.</p>
                    ) : (
                      <div className="relative ml-4 space-y-6 border-l-2 border-gray-100 pb-4">
                        {allActivities.map((item) => {
                          if (item.type === "expense") {
                            const exp = item as Expense;
                            const isSettleUp =
                              exp.name.toLowerCase().includes("settle up") ||
                              exp.name.toLowerCase().includes("cash payment");
                            return (
                              <div key={`expense-${exp.id}`} className="relative pl-6">
                                <span
                                  className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${
                                    isSettleUp
                                      ? "bg-green-100 text-green-600"
                                      : "bg-blue-100 text-blue-600"
                                  }`}
                                >
                                  {isSettleUp ? "🤝" : "💸"}
                                </span>
                                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                                  <div>
                                    <p className="text-sm text-gray-800">
                                      <Link
                                        href={`/dashboard/profile/${exp.paid_by}`}
                                        className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                                      >
                                        {exp.profiles?.display_name ||
                                          exp.profiles?.full_name ||
                                          "Someone"}
                                      </Link>{" "}
                                      {isSettleUp ? "settled up" : "added"}{" "}
                                      <span className="font-semibold text-gray-900">{exp.name}</span>
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                      {new Date(exp.created_at).toLocaleString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                  <div
                                    className={`whitespace-nowrap text-sm font-bold ${
                                      isSettleUp ? "text-green-600" : "text-gray-900"
                                    }`}
                                  >
                                    {formatCurrency(exp.amount, group.currency)}
                                  </div>
                                </div>
                              </div>
                            );
                          } else {
                            const s = item as Settlement;
                            return (
                              <div key={`settlement-${s.id}`} className="relative pl-6">
                                <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 ring-4 ring-white">
                                  🤝
                                </span>
                                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                                  <div>
                                    <p className="text-sm text-gray-800">
                                      <Link
                                        href={`/dashboard/profile/${s.from_user}`}
                                        className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                                      >
                                        {s.from_profile.display_name || s.from_profile.username}
                                      </Link>{" "}
                                      paid{" "}
                                      <Link
                                        href={`/dashboard/profile/${s.to_user}`}
                                        className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                                      >
                                        {s.to_profile.display_name || s.to_profile.username}
                                      </Link>
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                      {new Date(s.created_at).toLocaleString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                  <div className="whitespace-nowrap text-sm font-bold text-green-600">
                                    {formatCurrency(s.amount, group.currency)}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            {/* ── Members Section ──────────────────────── */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Members</h2>
                {isOwner && (
                  <button
                    onClick={openMemberModal}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
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
                    className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-all hover:border-blue-200 hover:shadow-sm"
                  >
                    <Link href={`/dashboard/profile/${m.id}`}>
                      <Avatar
                        src={m.avatar_url}
                        name={m.display_name || m.full_name || m.username}
                        size="md"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/profile/${m.id}`}
                        className="block truncate text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                      >
                        {m.display_name || m.full_name}
                      </Link>
                      <p className="truncate text-xs text-gray-500">@{m.username}</p>
                    </div>
                    {m.id === group.owner_id && (
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        Owner
                      </span>
                    )}
                    {isOwner && m.id !== group.owner_id && (
                      <button
                        onClick={() => handleRemoveMember(m.id, m.display_name || m.username)}
                        className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Balances Section ─────────────────────── */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Balances</h2>
              </div>

              {balances.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
                  <p className="text-sm text-gray-500">No balances to show yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {balances.map((bal) => (
                    <div
                      key={bal.user_id}
                      className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <Link href={`/dashboard/profile/${bal.user_id}`}>
                          <Avatar src={bal.avatar_url} name={bal.display_name} size="sm" />
                        </Link>
                        <Link
                          href={`/dashboard/profile/${bal.user_id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                        >
                          {bal.display_name}
                        </Link>
                      </div>
                      <div className="text-right text-xs font-bold">
                        {bal.net_balance > 0 ? (
                          <span className="text-green-600">
                            +{formatCurrency(bal.net_balance, group.currency)}
                          </span>
                        ) : bal.net_balance < 0 ? (
                          <span className="text-red-600">
                            -{formatCurrency(bal.net_balance, group.currency)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Settled</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════
         MODAL: ADD MEMBER
         ════════════════════════════════════════════════════ */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setIsMemberModalOpen(false)}
            />

            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl sm:my-8">
              <div className="border-b border-gray-100 px-6 pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Add Member</h3>
                  <button
                    onClick={() => setIsMemberModalOpen(false)}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">Invite friends or search for any user</p>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                {/* Quick Add */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    <h4 className="text-sm font-semibold text-gray-800">Quick Add</h4>
                    <span className="text-xs text-gray-400">— Your friends not in this group</span>
                  </div>

                  {loadingFriends ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="h-5 w-5 text-gray-400" />
                    </div>
                  ) : invitableFriends.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">All your friends are already in this group</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {invitableFriends.map((friend) => (
                        <li
                          key={friend.friend_id}
                          className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:border-blue-200 hover:bg-blue-50/30"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={friend.friend_avatar_url}
                              name={friend.friend_display_name || friend.friend_full_name || friend.friend_username}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {friend.friend_display_name || friend.friend_full_name}
                              </p>
                              <p className="truncate text-xs text-gray-500">@{friend.friend_username}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddMember(friend.friend_id)}
                            disabled={addingMember === friend.friend_id}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {addingMember === friend.friend_id ? (
                              <Spinner className="h-3.5 w-3.5" />
                            ) : (
                              "+"
                            )}{" "}
                            {addingMember === friend.friend_id ? "Adding…" : "Add"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Divider */}
                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">or search any user</span>
                  </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search username…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {searching && (
                      <div className="absolute right-3 top-2.5">
                        <Spinner className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <ul className="space-y-2">
                    {searchResults.map((user) => (
                      <li
                        key={user.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:border-blue-200"
                      >
                        <Link
                          href={`/dashboard/profile/${user.id}`}
                          target="_blank"
                          className="flex flex-1 items-center gap-3 hover:opacity-80"
                        >
                          <Avatar
                            src={user.avatar_url}
                            name={user.display_name || user.full_name || user.username}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 hover:text-blue-600">
                              {user.display_name || user.full_name || user.username}
                            </p>
                            <p className="truncate text-xs text-gray-500">@{user.username}</p>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleAddMember(user.id)}
                          disabled={addingMember === user.id}
                          className="ml-4 inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {addingMember === user.id ? <Spinner className="h-3.5 w-3.5" /> : "+"}{" "}
                          {addingMember === user.id ? "Adding…" : "Add"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!searching && searchTerm.trim() && searchResults.length === 0 && (
                  <p className="mt-3 text-center text-sm text-gray-400">
                    No users found for &ldquo;{searchTerm}&rdquo;
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                <button
                  onClick={() => setIsMemberModalOpen(false)}
                  className="w-full rounded-lg py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
         MODAL: ADD/EDIT EXPENSE
         ════════════════════════════════════════════════════ */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setIsExpenseModalOpen(false)}
            />

            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl sm:my-8">
              <div className="px-6 pb-6 pt-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingExpenseId ? "Edit Expense" : "Add Expense"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">Split among selected members.</p>

                <form onSubmit={handleSaveExpense} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dinner"
                      className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={expenseName}
                      onChange={(e) => setExpenseName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-300 p-3 font-mono text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
                      <span>Split equally between:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedMembers(members.map((m) => m.id))}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Select All
                      </button>
                    </label>
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                      {members.map((m) => (
                        <label
                          key={m.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-100"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedMembers.includes(m.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedMembers([...selectedMembers, m.id]);
                              else setSelectedMembers(selectedMembers.filter((id) => id !== m.id));
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <Avatar src={m.avatar_url} name={m.display_name || m.username} size="sm" />
                            <span className="text-sm font-medium text-gray-700">
                              {m.display_name || m.username}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedMembers.length} of {members.length} selected
                      {selectedMembers.length > 0 && (
                        <>
                          {" · "}
                          <button
                            type="button"
                            onClick={() => setSelectedMembers([])}
                            className="text-red-500 hover:underline"
                          >
                            Clear
                          </button>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsExpenseModalOpen(false)}
                      className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingExpense || selectedMembers.length === 0}
                      className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingExpense
                        ? "Saving…"
                        : editingExpenseId
                        ? "Save Changes"
                        : "Add Expense"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
         MODAL: SETTLE UP
         ════════════════════════════════════════════════════ */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setIsSettleModalOpen(false)}
            />

            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl sm:my-8">
              <div className="px-6 pb-6 pt-6">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-2xl">🤝</span>
                  <h3 className="text-xl font-bold text-gray-900">Settle Up</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Record a payment to a group member. They will need to approve it.
                </p>

                <form onSubmit={handleInitiateSettlement} className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Who are you paying?
                    </label>
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                      {otherMembers.length === 0 ? (
                        <p className="p-3 text-center text-sm text-gray-400">
                          No other members in this group.
                        </p>
                      ) : (
                        otherMembers.map((m) => (
                          <label
                            key={m.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors ${
                              settleReceiver === m.id
                                ? "bg-blue-50 ring-1 ring-blue-300"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name="settle-receiver"
                              value={m.id}
                              checked={settleReceiver === m.id}
                              onChange={() => setSettleReceiver(m.id)}
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Avatar src={m.avatar_url} name={m.display_name || m.username} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {m.display_name || m.full_name || m.username}
                              </p>
                              <p className="truncate text-xs text-gray-500">@{m.username}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        {group.currency || "USD"}
                      </span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="w-full rounded-xl border border-gray-300 p-3 pl-14 font-mono text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p className="text-xs text-blue-700">
                      This settlement will be <strong>pending</strong> until the recipient approves it.
                      Balances update only after approval.
                    </p>
                  </div>

                  <div className="flex gap-3 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsSettleModalOpen(false)}
                      className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingSettle || !settleReceiver || !settleAmount}
                      className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingSettle ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner className="h-4 w-4" /> Sending…
                        </span>
                      ) : (
                        "Send Settlement"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
         MODAL: GROUP SETTINGS (Delete / Leave)
         ════════════════════════════════════════════════════ */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => {
                setIsSettingsModalOpen(false);
                setDeleteConfirmText("");
              }}
            />

            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl sm:my-8">
              <div className="border-b border-gray-100 px-6 pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Group Settings</h3>
                  <button
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      setDeleteConfirmText("");
                    }}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-6">
                {/* Group Info */}
                <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Group Name</p>
                  <p className="text-lg font-semibold text-gray-900">{group.name}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Created {new Date(group.created_at).toLocaleDateString()} · {members.length} members
                  </p>
                </div>

                {isOwner ? (
                  /* ── Owner: Delete Group ── */
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <h4 className="text-sm font-bold text-red-800">Danger Zone</h4>
                    </div>
                    <p className="mb-4 text-xs text-red-700">
                      Deleting this group will permanently remove all expenses, settlements, and member data.
                      This action <strong>cannot be undone</strong>.
                    </p>
                    <label className="mb-2 block text-xs font-medium text-red-700">
                      Type <strong>&quot;{group.name}&quot;</strong> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={group.name}
                      className="mb-3 w-full rounded-lg border border-red-300 bg-white p-2.5 text-sm text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button
                      onClick={handleDeleteGroup}
                      disabled={deletingGroup || deleteConfirmText !== group.name}
                      className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingGroup ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner className="h-4 w-4" /> Deleting…
                        </span>
                      ) : (
                        "Delete Group Permanently"
                      )}
                    </button>
                  </div>
                ) : (
                  /* ── Member: Leave Group ── */
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      <h4 className="text-sm font-bold text-gray-800">Leave Group</h4>
                    </div>

                    {!canLeave ? (
                      <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <p className="text-xs text-amber-800">
                          You must settle your balances before leaving the group.{" "}
                          {myNetBalance > 0
                            ? `You are still owed ${formatCurrency(myNetBalance, group.currency)}.`
                            : `You still owe ${formatCurrency(myNetBalance, group.currency)}.`}
                        </p>
                      </div>
                    ) : (
                      <p className="mb-4 text-xs text-gray-600">
                        You can leave this group since your balance is settled. This action cannot be undone.
                      </p>
                    )}

                    <button
                      onClick={handleLeaveGroup}
                      disabled={leavingGroup || !canLeave}
                      className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      title={!canLeave ? "Settle your balances first" : undefined}
                    >
                      {leavingGroup ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner className="h-4 w-4" /> Leaving…
                        </span>
                      ) : (
                        "Leave Group"
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                <button
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    setDeleteConfirmText("");
                  }}
                  className="w-full rounded-lg py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}