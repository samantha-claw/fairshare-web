"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ==========================================
// 🧩 TYPES
// ==========================================

interface Currency {
  code: string;
  label: string;
  symbol: string;
  flag: string;
}

interface Friend {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  currency?: string;
  friends?: string;
  general?: string;
}

// ==========================================
// 💱 CURRENCIES
// ==========================================

const CURRENCIES: Currency[] = [
  { code: "SDG", label: "Sudanese Pound", symbol: "ج.س", flag: "🇸🇩" },
  { code: "EGP", label: "Egyptian Pound", symbol: "ج.م", flag: "🇪🇬" },
  { code: "USD", label: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", label: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "SAR", label: "Saudi Riyal", symbol: "ر.س", flag: "🇸🇦" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "INR", label: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "MXN", label: "Mexican Peso", symbol: "Mex$", flag: "🇲🇽" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "TRY", label: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "KWD", label: "Kuwaiti Dinar", symbol: "د.ك", flag: "🇰🇼" },
  { code: "QAR", label: "Qatari Riyal", symbol: "ر.ق", flag: "🇶🇦" },
  { code: "OMR", label: "Omani Rial", symbol: "ر.ع", flag: "🇴🇲" },
  { code: "BHD", label: "Bahraini Dinar", symbol: "د.ب", flag: "🇧🇭" },
  { code: "JOD", label: "Jordanian Dinar", symbol: "د.ا", flag: "🇯🇴" },
];

// ==========================================
// ⚙️ HOOK
// ==========================================

export function useCreateGroup() {
  const router = useRouter();
  const supabase = createClient();

  /* ── State ───────────────────────────────────────── */
  const [loading, setLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [userId, setUserId] = useState<string | null>(null);

  // Ref-based guard to prevent duplicate submissions
  // (refs update synchronously, unlike state which is async)
  const isSubmittingRef = useRef(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("SDG");

  // Friends
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  // Search
  const [friendSearch, setFriendSearch] = useState("");

  /* ── Derived ─────────────────────────────────────── */

  const filteredFriends = friends.filter((f) => {
    const q = friendSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      f.display_name.toLowerCase().includes(q) ||
      f.username.toLowerCase().includes(q)
    );
  });

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  /* ── Init: Get user + friends ────────────────────── */

  const initialize = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const currentUserId = session.user.id;
      setUserId(currentUserId);

      // Fetch accepted friendships where user is either sender or receiver
      const { data: friendships, error: friendshipsError } = await supabase
        .from("friendships")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .eq("status", "accepted");

      if (friendshipsError) throw friendshipsError;

      if (!friendships || friendships.length === 0) {
        setFriends([]);
        setFriendsLoading(false);
        return;
      }

      // Extract friend IDs (the other person in each friendship)
      const friendIds = friendships.map((f) =>
        f.requester_id === currentUserId ? f.receiver_id : f.requester_id
      );

      // Remove duplicates
      const uniqueFriendIds = [...new Set(friendIds)];

      if (uniqueFriendIds.length === 0) {
        setFriends([]);
        setFriendsLoading(false);
        return;
      }

      // Fetch profiles for all friends
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", uniqueFriendIds);

      if (profilesError) throw profilesError;

      const friendsList: Friend[] = (profiles || []).map((p) => ({
        id: p.id,
        display_name: p.display_name || p.username || "User",
        username: p.username || "",
        avatar_url: p.avatar_url || "",
      }));

      // Sort alphabetically by display_name
      friendsList.sort((a, b) =>
        a.display_name.localeCompare(b.display_name)
      );

      setFriends(friendsList);
    } catch (err) {
      console.error("Failed to load friends:", err);
      setErrors({ general: "Failed to load your friends list." });
    } finally {
      setFriendsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  /* ── Toggle Friend Selection ─────────────────────── */

  function toggleFriend(friendId: string) {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );

    // Clear errors/success on change
    if (errors.friends) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.friends;
        return next;
      });
    }
  }

  function selectAllFriends() {
    setSelectedFriendIds(friends.map((f) => f.id));
  }

  function deselectAllFriends() {
    setSelectedFriendIds([]);
  }

  /* ── Validation ──────────────────────────────────── */

  function validate(): boolean {
    const newErrors: FormErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = "Group name is required.";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Group name must be at least 2 characters.";
    } else if (trimmedName.length > 100) {
      newErrors.name = "Group name must be under 100 characters.";
    }

    if (description.trim().length > 500) {
      newErrors.description = "Description must be under 500 characters.";
    }

    if (!currency) {
      newErrors.currency = "Please select a currency.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /* ── Submit ──────────────────────────────────────── */

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // ⛔ SUBMISSION GUARD — prevent duplicate submissions
    // Check ref first (synchronous, immune to React batching)
    if (isSubmittingRef.current) return;
    // Also check state as a fallback
    if (saving) return;

    if (!validate()) return;
    if (!userId) return;

    // Lock immediately — ref updates synchronously
    isSubmittingRef.current = true;
    setSaving(true);
    setErrors({});

    try {
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();

      // 1. Create the group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: trimmedName,
          description: trimmedDescription || null,
          currency,
          owner_id: userId,
        })
        .select("id")
        .single();

      if (groupError) throw groupError;

      if (!groupData) {
        throw new Error("Group was created but no ID was returned.");
      }

      const groupId = groupData.id;

      // 2 & 3. Insert owner and friends safely
      const uniqueFriends = selectedFriendIds.filter((id) => id !== userId);

      const memberInserts = [
        { group_id: groupId, user_id: userId, role: "owner" },
        ...uniqueFriends.map((friendId) => ({
          group_id: groupId,
          user_id: friendId,
          role: "member",
        })),
      ];

      const { error: membersError } = await supabase
        .from("group_members")
        .upsert(memberInserts, { onConflict: "group_id,user_id", ignoreDuplicates: true });

      if (membersError) {
        console.error("Members insert error:", membersError);
      }

      // 4. Redirect to the new group
      router.push(`/dashboard/${groupId}`);
    } catch (err: any) {
      console.error("Create group error:", err);
      setErrors({
        general: err.message || "Failed to create group. Please try again.",
      });
      // Only unlock on error — on success we redirect so it stays locked
      isSubmittingRef.current = false;
    } finally {
      setSaving(false);
    }
  }

  /* ── Cancel ──────────────────────────────────────── */

  function handleCancel() {
    router.push("/dashboard");
  }

  /* ── Return ──────────────────────────────────────── */

  return {
    // State
    loading: friendsLoading,
    saving,
    errors,
    name,
    description,
    currency,
    friends,
    filteredFriends,
    selectedFriendIds,
    friendSearch,
    selectedCurrency,
    currencies: CURRENCIES,

    // Actions
    setName,
    setDescription,
    setCurrency,
    setFriendSearch,
    toggleFriend,
    selectAllFriends,
    deselectAllFriends,
    handleSubmit,
    handleCancel,
  };
}