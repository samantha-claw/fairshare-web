"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback, useRef, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  Group,
  Member,
  Expense,
  SearchResult,
  InvitableFriend,
  Balance,
  Settlement,
  ActivityItem,
} from "@/types/group";

// ==========================================
// ⚙️ LOGIC & STATE
// ==========================================

export function useGroup() {
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

  /* ── Data Fetching ───────────────────────────────────── */

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

      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();
      if (groupError) throw groupError;
      setGroup(groupData as Group);

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

      const { data: expensesData, error: expError } = await supabase
        .from("expenses")
        .select(
         `id, name, amount, created_at, paid_by,
          profiles:paid_by ( full_name, username, display_name, avatar_url ),
          expense_splits ( user_id, profiles ( full_name, display_name, avatar_url ) )`
      )
       .eq("group_id", groupId)
      .order("created_at", { ascending: false });

      if (expError) console.error("Error fetching expenses:", expError);
      if (expensesData) {
        // @ts-ignore
        setExpenses(expensesData);
      }

      const { data: balancesData } = await supabase.rpc("get_group_balances", {
        _group_id: groupId,
      });
      if (balancesData) {
        // @ts-ignore
        setBalances(balancesData);
      }

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

  /* ── Realtime Subscriptions ──────────────────────────── */

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

  /* ── Fetch Invitable Friends ─────────────────────────── */

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

  /* ── Expense Modal Helpers ───────────────────────────── */

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

  /* ── Settle Up Modal Helpers ─────────────────────────── */

  function openSettleUpModal() {
    setSettleReceiver("");
    setSettleAmount("");
    setIsSettleModalOpen(true);
  }

  /* ── Handlers ────────────────────────────────────────── */

  /**
   * ════════════════════════════════════════════════════════
   * ADD MEMBER
   * → Notifies the added user after successful RPC
   * ════════════════════════════════════════════════════════
   */
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

      // ── Notify the added member ──
      const groupName = group?.name || "a group";
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        title: "New Group Invitation 🤝",
        message: `You have been added to the group: ${groupName}`,
        type: "group",
        link: `/dashboard/groups/${groupId}`,
      }).then(({ error: notifError }) => {
        if (notifError) {
          console.error("Failed to send group invitation notification:", notifError);
        }
      });

      setInvitableFriends((prev) => prev.filter((f) => f.friend_id !== targetUserId));
      setSearchResults((prev) => prev.filter((u) => u.id !== targetUserId));
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingMember(null);
    }
  }

  /**
   * ════════════════════════════════════════════════════════
   * SAVE EXPENSE (Add / Edit)
   * → Notifies all participants except the current user
   * ════════════════════════════════════════════════════════
   */
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
      // ── Notify all participants except the current user ──
      const currency = group?.currency || "USD";
      const formattedAmount = formatCurrency(parseFloat(expenseAmount), currency);
      const membersToNotify = selectedMembers.filter((id) => id !== currentUser);

      if (membersToNotify.length > 0) {
        const notifications = membersToNotify.map((memberId) => ({
          user_id: memberId,
          title: "New Expense Added 💸",
          message: `You were added to an expense: ${expenseName} for ${formattedAmount}`,
          type: "expense",
          link: `/dashboard/groups/${groupId}`,
        }));

        const { error: notifError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (notifError) {
          console.error("Failed to send expense notifications:", notifError);
        }
      }

      setIsExpenseModalOpen(false);
      setEditingExpenseId(null);
      setExpenseName("");
      setExpenseAmount("");
      setSelectedMembers([]);
      fetchData();
    }
    setSubmittingExpense(false);
  }

  /**
   * ════════════════════════════════════════════════════════
   * INITIATE SETTLEMENT
   * → Notifies the receiver after the settlement is created
   * ════════════════════════════════════════════════════════
   */
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

      // ── Notify the settlement receiver ──
      const currency = group?.currency || "USD";
      const formattedAmount = formatCurrency(parseFloat(settleAmount), currency);

      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: settleReceiver,
          title: "Payment Confirmation Needed 🤝",
          message: `A payment of ${formattedAmount} was sent to you. Please confirm receipt.`,
          type: "settlement",
          link: `/dashboard/groups/${groupId}`,
        });

      if (notifError) {
        console.error("Failed to send settlement notification:", notifError);
      }

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

    const myBal = balances.find((b) => b.user_id === currentUser);
    if (myBal && myBal.net_balance !== 0) {
      alert(
        "You must settle your balances before leaving the group. " +
          (myBal.net_balance > 0
            ? `You are still owed ${formatCurrency(myBal.net_balance, group?.currency)}.`
            : `You still owe ${formatCurrency(myBal.net_balance, group?.currency)}.`)
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

  /* ── Derived Data ────────────────────────────────────── */

  const isOwner = currentUser === group?.owner_id;
  const otherMembers = members.filter((m) => m.id !== currentUser);
  const myBalance = balances.find((b) => b.user_id === currentUser);
  const myNetBalance = myBalance?.net_balance ?? 0;
  const canLeave = myNetBalance === 0;
  const totalGroupExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const allActivities: ActivityItem[] = [
    ...expenses.map((e) => ({ ...e, type: "expense" as const })),
    ...completedSettlements.map((s) => ({ ...s, type: "settlement" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  /* ── Return ──────────────────────────────────────────── */

  return {
    // Core data
    loading,
    error,
    group,
    members,
    expenses,
    currentUser,
    balances,
    pendingSettlements,
    completedSettlements,

    // Derived
    isOwner,
    otherMembers,
    myNetBalance,
    canLeave,
    totalGroupExpenses,
    allActivities,

    // Tab
    activeTab,
    setActiveTab,

    // Processing
    processingSettlementId,

    // Member modal
    isMemberModalOpen,
    setIsMemberModalOpen,
    invitableFriends,
    loadingFriends,
    addingMember,
    searchTerm,
    setSearchTerm,
    searchResults,
    searching,
    openMemberModal,
    handleAddMember,

    // Expense modal
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    expenseName,
    setExpenseName,
    expenseAmount,
    setExpenseAmount,
    selectedMembers,
    setSelectedMembers,
    editingExpenseId,
    submittingExpense,
    openAddExpenseModal,
    openEditExpenseModal,
    handleSaveExpense,

    // Settle modal
    isSettleModalOpen,
    setIsSettleModalOpen,
    settleReceiver,
    setSettleReceiver,
    settleAmount,
    setSettleAmount,
    submittingSettle,
    openSettleUpModal,
    handleInitiateSettlement,

    // Settlement actions
    handleApproveSettlement,
    handleRejectSettlement,
    handleDeleteSettlement,

    // Expense / member actions
    handleDeleteExpense,
    handleRemoveMember,

    // Settings modal
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    deleteConfirmText,
    setDeleteConfirmText,
    deletingGroup,
    leavingGroup,
    handleDeleteGroup,
    handleLeaveGroup,

    // Navigation
    navigateToDashboard: () => router.push("/dashboard"),
    goBack: () => router.back(),
  };
}