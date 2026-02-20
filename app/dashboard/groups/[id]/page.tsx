"use client";

import React, { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */

export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const supabase = createClient();

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

      // 5. Pending Settlements (for the pending section)
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

      // 6. Completed Settlements (for activity log)
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
      // 1. Insert settlement as pending
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

      // 2. Log activity (only for initiated)
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

      // Log approved settlement
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
      // Delete rejected settlement (do not log)
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

      // Log deletion
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

  const isOwner = currentUser === group.owner_id;
  const otherMembers = members.filter((m) => m.id !== currentUser);

  // Combine expenses and completed settlements for activity timeline
  const allActivities = [
    ...expenses.map((e) => ({ ...e, type: "expense" as const })),
    ...completedSettlements.map((s) => ({ ...s, type: "settlement" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white px-6 py-6">
        <div className="mx-auto flex max-w-3xl items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{group.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {members.length} member{members.length !== 1 && "s"} · {group.currency || "USD"}
            </p>
          </div>
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

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        {/* ── Members Section ──────────────────────────── */}
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
                Add Member
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-all hover:border-blue-200 hover:shadow-sm"
              >
                <Avatar src={m.avatar_url} name={m.display_name || m.full_name || m.username} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{m.display_name || m.full_name}</p>
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
                    className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Balances Section ─────────────────────────── */}
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
                <div key={bal.user_id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Avatar src={bal.avatar_url} name={bal.display_name} size="md" />
                    <span className="text-sm font-medium text-gray-900">{bal.display_name}</span>
                  </div>
                  <div className="text-right text-sm font-bold">
                    {bal.net_balance > 0 ? (
                      <span className="text-green-600">Gets back {bal.net_balance} {group.currency || "USD"}</span>
                    ) : bal.net_balance < 0 ? (
                      <span className="text-red-600">Owes {Math.abs(bal.net_balance)} {group.currency || "USD"}</span>
                    ) : (
                      <span className="text-gray-400">Settled up</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Pending Settlements Section ──────────────── */}
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
                    {/* Info */}
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={s.from_profile.avatar_url}
                        name={s.from_profile.display_name || s.from_profile.username}
                        size="sm"
                      />
                      <div className="text-sm">
                        <p className="text-gray-800">
                          <span className="font-semibold">
                            {isSender ? "You" : s.from_profile.display_name || s.from_profile.username}
                          </span>
                          {" → "}
                          <span className="font-semibold">
                            {isReceiver ? "You" : s.to_profile.display_name || s.to_profile.username}
                          </span>
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

                    {/* Amount + Actions */}
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">
                        {s.amount} {group.currency || "USD"}
                      </span>

                      {/* Receiver: Approve / Reject */}
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

                      {/* Sender: Pending + Delete */}
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

                      {/* Neither sender nor receiver */}
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

        {/* ── Expenses Section ─────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Expenses</h2>
            <div className="flex items-center gap-2">
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
          </div>

          {expenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
              <p className="text-gray-500">No expenses yet. Start adding!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-gray-100 p-3 text-xl">🧾</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{exp.name}</h3>
                      <p className="text-xs text-gray-500">
                        Paid by{" "}
                        <span className="font-medium text-gray-700">
                          {exp.profiles.display_name || exp.profiles.full_name}
                        </span>{" "}
                        · {new Date(exp.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {exp.amount} {group.currency || "USD"}
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
        </section>

        {/* ── Activity Timeline (Expenses + Settlements) ── */}
        <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
            <p className="text-xs text-gray-500">Timeline of all group expenses and settlements.</p>
          </div>

          {allActivities.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No activity to show yet.</p>
          ) : (
            <div className="relative ml-4 space-y-6 border-l-2 border-gray-100 pb-4">
              {allActivities.map((item) => {
                if (item.type === "expense") {
                  const exp = item as Expense;
                  const isSettleUp = exp.name.toLowerCase().includes("settle up") || exp.name.toLowerCase().includes("cash payment");
                  return (
                    <div key={`expense-${exp.id}`} className="relative pl-6">
                      <span
                        className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${
                          isSettleUp ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {isSettleUp ? "🤝" : "💸"}
                      </span>
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <p className="text-sm text-gray-800">
                            <span className="font-semibold text-gray-900">
                              {exp.profiles?.display_name || exp.profiles?.full_name || "Someone"}
                            </span>{" "}
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
                        <div className={`whitespace-nowrap text-sm font-bold ${isSettleUp ? "text-green-600" : "text-gray-900"}`}>
                          {exp.amount} {group?.currency || "USD"}
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
                            <span className="font-semibold text-gray-900">
                              {s.from_profile.display_name || s.from_profile.username}
                            </span>{" "}
                            paid{" "}
                            <span className="font-semibold text-gray-900">
                              {s.to_profile.display_name || s.to_profile.username}
                            </span>
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
                          {s.amount} {group?.currency || "USD"}
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </section>
      </main>

      {/* ════════════════════════════════════════════════════
         MODAL: ADD MEMBER
         ════════════════════════════════════════════════════ */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsMemberModalOpen(false)} />

            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl sm:my-8">
              <div className="border-b border-gray-100 px-6 pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Add Member</h3>
                  <button onClick={() => setIsMemberModalOpen(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
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
                    <div className="flex items-center justify-center py-8"><Spinner className="h-5 w-5 text-gray-400" /></div>
                  ) : invitableFriends.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">All your friends are already in this group</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {invitableFriends.map((friend) => (
                        <li key={friend.friend_id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:border-blue-200 hover:bg-blue-50/30">
                          <div className="flex items-center gap-3">
                            <Avatar src={friend.friend_avatar_url} name={friend.friend_display_name || friend.friend_full_name || friend.friend_username} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">{friend.friend_display_name || friend.friend_full_name}</p>
                              <p className="truncate text-xs text-gray-500">@{friend.friend_username}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddMember(friend.friend_id)}
                            disabled={addingMember === friend.friend_id}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {addingMember === friend.friend_id ? <Spinner className="h-3.5 w-3.5" /> : "+"} {addingMember === friend.friend_id ? "Adding…" : "Add"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Divider */}
                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">or search any user</span></div>
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
                    {searching && <div className="absolute right-3 top-2.5"><Spinner className="h-5 w-5 text-gray-400" /></div>}
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <ul className="space-y-2">
                    {searchResults.map((user) => (
                      <li key={user.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:border-blue-200">
                        <Link href={`/dashboard/profile/${user.id}`} target="_blank" className="flex flex-1 items-center gap-3 hover:opacity-80">
                          <Avatar src={user.avatar_url} name={user.display_name || user.full_name || user.username} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 hover:text-blue-600">{user.display_name || user.full_name || user.username}</p>
                            <p className="truncate text-xs text-gray-500">@{user.username}</p>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleAddMember(user.id)}
                          disabled={addingMember === user.id}
                          className="ml-4 inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {addingMember === user.id ? <Spinner className="h-3.5 w-3.5" /> : "+"} {addingMember === user.id ? "Adding…" : "Add"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!searching && searchTerm.trim() && searchResults.length === 0 && (
                  <p className="mt-3 text-center text-sm text-gray-400">No users found for &ldquo;{searchTerm}&rdquo;</p>
                )}
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                <button onClick={() => setIsMemberModalOpen(false)} className="w-full rounded-lg py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
         MODAL: ADD/EDIT EXPENSE (No settlement logic)
         ════════════════════════════════════════════════════ */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)} />

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
                      <button type="button" onClick={() => setSelectedMembers(members.map((m) => m.id))} className="text-xs text-blue-600 hover:underline">
                        Select All
                      </button>
                    </label>
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                      {members.map((m) => (
                        <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-100">
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
                            <span className="text-sm font-medium text-gray-700">{m.display_name || m.username}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedMembers.length} of {members.length} selected
                      {selectedMembers.length > 0 && (
                        <>
                          {" · "}
                          <button type="button" onClick={() => setSelectedMembers([])} className="text-red-500 hover:underline">
                            Clear
                          </button>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
                    <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingExpense || selectedMembers.length === 0}
                      className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingExpense ? "Saving…" : editingExpenseId ? "Save Changes" : "Add Expense"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
         MODAL: SETTLE UP (Dedicated)
         ════════════════════════════════════════════════════ */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsSettleModalOpen(false)} />

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
                  {/* Select Receiver */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Who are you paying?
                    </label>
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                      {otherMembers.length === 0 ? (
                        <p className="p-3 text-center text-sm text-gray-400">No other members in this group.</p>
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

                  {/* Amount */}
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

                  {/* Info banner */}
                  <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p className="text-xs text-blue-700">
                      This settlement will be <strong>pending</strong> until the recipient approves it.
                      Balances update only after approval.
                    </p>
                  </div>

                  {/* Actions */}
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
    </div>
  );
}