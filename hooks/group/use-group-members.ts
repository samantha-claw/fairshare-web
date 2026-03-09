"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Member, SearchResult, InvitableFriend } from "@/types/group";

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

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [invitableFriends, setInvitableFriends] = useState<
    InvitableFriend[]
  >([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

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
          data.filter(
            (u: any) => !existingIds.includes(u.id)
          ) as SearchResult[]
        );
      }

      setSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, members, supabase]);

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

  const openMemberModal = useCallback(() => {
    setIsMemberModalOpen(true);
    setSearchTerm("");
    setSearchResults([]);
    fetchInvitableFriends();
  }, [fetchInvitableFriends]);

  const handleAddMember = useCallback(
    async (targetUserId: string) => {
      setAddingMember(targetUserId);
      try {
        const { error: addError } = await supabase.rpc(
          "add_member_to_group",
          { _group_id: groupId, _user_id: targetUserId }
        );

        if (addError) {
          toast.error(addError.message);
          return;
        }

        setInvitableFriends((prev) =>
          prev.filter((f) => f.friend_id !== targetUserId)
        );
        setSearchResults((prev) =>
          prev.filter((u) => u.id !== targetUserId)
        );

        await refetch();
      } catch (err) {
        console.error(err);
      } finally {
        setAddingMember(null);
      }
    },
    [groupId, supabase, refetch]
  );

  const handleRemoveMember = useCallback(
    async (memberId: string, memberName: string) => {
      const confirmed = await toast.confirm(
        `Remove ${memberName} from the group?`,
        {
          confirmLabel: "Remove",
          cancelLabel: "Cancel"
        }
      );
      if (!confirmed) return;

      const { error: removeError } = await supabase.rpc(
        "remove_member_from_group",
        { _group_id: groupId, _user_id: memberId }
      );

      if (removeError) {
        toast.error(removeError.message);
      } else {
        refetch();
      }
    },
    [groupId, supabase, refetch]
  );

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