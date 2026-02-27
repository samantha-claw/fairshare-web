"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Member, SearchResult, InvitableFriend } from "@/types/group";
import { useToast } from "@/hooks/use-toast";
/**
 * Manages the add-member modal, username search,
 * invitable-friends list, and member add/remove actions.
 */
export function useGroupMembers(
  groupId: string,
  members: Member[],
  refetch: () => void
) {
  const supabase = createClient();
  const toast = useToast();

  /* ── Modal state ─────────────────────────────────────── */
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [invitableFriends, setInvitableFriends] = useState<InvitableFriend[]>(
    []
  );
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

    const timer = setTimeout(async () => {
      setSearching(true);

      const { data, error: searchError } = await supabase
        .from("profiles")
        .select("id, username, full_name, display_name, avatar_url")
        .ilike("username", `%${searchTerm.trim()}%`)
        .limit(5);

      if (!searchError && data) {
        const existingIds = members.map((m) => m.id);
        setSearchResults(
          data.filter((u: any) => !existingIds.includes(u.id)) as SearchResult[]
        );
      }

      setSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, members, supabase]);

  /* ── Fetch invitable friends ─────────────────────────── */
  const fetchInvitableFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const { data, error: friendsError } = await supabase.rpc(
        "get_friends_to_invite",
        { _group_id: groupId }
      );
      if (friendsError) throw friendsError;
      setInvitableFriends((data as InvitableFriend[]) || []);
    } catch (err) {
      console.error("Failed to load invitable friends:", err);
    } finally {
      setLoadingFriends(false);
    }
  }, [supabase, groupId]);

  /* ── Open modal ──────────────────────────────────────── */
  const openMemberModal = useCallback(() => {
    setIsMemberModalOpen(true);
    setSearchTerm("");
    setSearchResults([]);
    fetchInvitableFriends();
  }, [fetchInvitableFriends]);

  /* ── Add member ──────────────────────────────────────── */
  const handleAddMember = useCallback(
    async (targetUserId: string) => {
      setAddingMember(targetUserId);
      try {
        const { error: addError } = await supabase.rpc("add_member_to_group", {
          _group_id: groupId,
          _user_id: targetUserId,
        });

        if (addError) {
          toast.error("Failed to add member: " + addError.message);
          return;
        }

        // Remove from local lists immediately
        setInvitableFriends((prev) =>
          prev.filter((f) => f.friend_id !== targetUserId)
        );
        setSearchResults((prev) =>
          prev.filter((u) => u.id !== targetUserId)
        );

        await refetch();
      } catch (err) {
        console.error(err);
        toast.error("Failed to refresh group members.");
      } finally {
        setAddingMember(null);
      }
    },
    [groupId, supabase, refetch]
  );

  /* ── Remove member ───────────────────────────────────── */
  const handleRemoveMember = useCallback(
    async (memberId: string, memberName: string) => {
      if (
        !confirm(
          `Are you sure you want to remove ${memberName} from the group?`
        )
      )
        return;

      const { error: removeError } = await supabase.rpc(
        "remove_member_from_group",
        { _group_id: groupId, _user_id: memberId }
      );

      if (removeError) {
        toast.error("Error removing member: " + removeError.message);
      } else {
        refetch();
      }
    },
    [groupId, supabase, refetch]
  );

  /* ── Public API ──────────────────────────────────────── */
  return {
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
    handleRemoveMember,
  };
}