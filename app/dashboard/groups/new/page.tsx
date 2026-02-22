"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useCreateGroup } from "@/hooks/use-create-group";
import { Spinner } from "@/components/ui/spinner";
import {
  Users,
  Type,
  FileText,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  UserPlus,
  Coins,
  ChevronDown,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ==========================================
// 🔧 HELPERS
// ==========================================

function getFallbackAvatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=e0e7ff&color=4338ca&bold=true&size=128`;
}

// ==========================================
// 🎨 SKELETON
// ==========================================

function CreateGroupSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="mx-auto max-w-2xl animate-pulse px-4 py-8 sm:px-6">
        <div className="mb-8 h-6 w-48 rounded-lg bg-gray-200" />
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="space-y-6">
            <div className="h-12 rounded-2xl bg-gray-100" />
            <div className="h-12 rounded-2xl bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
            <div className="h-40 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🎨 CURRENCY DROPDOWN
// ==========================================

interface CurrencyDropdownProps {
  currencies: { code: string; label: string; symbol: string; flag: string }[];
  selected: string;
  selectedCurrency: { code: string; label: string; symbol: string; flag: string };
  onSelect: (code: string) => void;
  error?: string;
}

function CurrencyDropdown({
  currencies,
  selected,
  selectedCurrency,
  onSelect,
  error,
}: CurrencyDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = currencies.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.label.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="mb-2 flex items-center gap-1.5">
        <span className="text-sm font-semibold text-gray-700">
          Group Currency
        </span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setSearch("");
        }}
        className={`flex w-full items-center gap-3 rounded-2xl border bg-gray-50/50 px-4 py-3 text-left text-sm transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 ${
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : open
              ? "border-indigo-300 bg-white ring-2 ring-indigo-100"
              : "border-gray-200 hover:border-gray-300 focus:border-indigo-300 focus:ring-indigo-100"
        }`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-lg">
          {selectedCurrency.flag}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{selectedCurrency.code}</p>
          <p className="text-xs text-gray-500">{selectedCurrency.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {selectedCurrency.symbol}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
          {/* Search inside dropdown */}
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(ev) => setSearch(ev.target.value)}
                placeholder="Search currencies…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-gray-400">
                No currencies found
              </p>
            ) : (
              filtered.map((c) => {
                const isSelected = c.code === selected;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onSelect(c.code);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isSelected ? "text-indigo-700" : "text-gray-900"
                        }`}
                      >
                        {c.code}
                      </p>
                      <p
                        className={`text-xs ${
                          isSelected ? "text-indigo-500" : "text-gray-400"
                        }`}
                      >
                        {c.label}
                      </p>
                    </div>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${
                        isSelected
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.symbol}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ==========================================
// 🎨 FRIEND CARD
// ==========================================

interface FriendCardProps {
  friend: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string;
  };
  isSelected: boolean;
  onToggle: () => void;
}

function FriendCard({ friend, isSelected, onToggle }: FriendCardProps) {
  const avatarSrc =
    friend.avatar_url.trim().length > 0
      ? friend.avatar_url
      : getFallbackAvatar(friend.display_name);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200 ${
        isSelected
          ? "border-emerald-400 bg-emerald-50/50 shadow-md shadow-emerald-100/50"
          : "border-transparent bg-gray-50/50 hover:border-gray-200 hover:bg-white hover:shadow-sm"
      }`}
    >
      {/* Selection indicator */}
      <div
        className={`absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
          isSelected
            ? "scale-100 bg-emerald-500 shadow-lg shadow-emerald-200"
            : "scale-0 bg-gray-300"
        }`}
      >
        <Check className="h-3.5 w-3.5 text-white" />
      </div>

      {/* Avatar */}
      <div
        className={`relative rounded-full p-0.5 transition-all duration-200 ${
          isSelected
            ? "ring-2 ring-emerald-400 ring-offset-2"
            : "ring-2 ring-transparent group-hover:ring-gray-200 group-hover:ring-offset-1"
        }`}
      >
        <img
          src={avatarSrc}
          alt={friend.display_name}
          className="h-14 w-14 rounded-full object-cover"
          onError={(ev) => {
            (ev.target as HTMLImageElement).src = getFallbackAvatar(
              friend.display_name
            );
          }}
        />
      </div>

      {/* Name */}
      <div className="w-full text-center">
        <p
          className={`truncate text-xs font-semibold transition-colors ${
            isSelected ? "text-emerald-700" : "text-gray-700"
          }`}
        >
          {friend.display_name}
        </p>
        <p
          className={`truncate text-[10px] transition-colors ${
            isSelected ? "text-emerald-500" : "text-gray-400"
          }`}
        >
          @{friend.username}
        </p>
      </div>
    </button>
  );
}

// ==========================================
// 🎨 MAIN PAGE
// ==========================================

export default function CreateGroupPage() {
  const g = useCreateGroup();

  if (g.loading) return <CreateGroupSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {/* ── Back Button ──────────────────────────── */}
        <button
          onClick={g.handleCancel}
          className="mb-6 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 transition-all hover:bg-white hover:text-gray-900 hover:shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </button>

        {/* ── Main Form Card ───────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {/* Decorative Background */}
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-100/50 to-purple-100/30 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-gradient-to-tr from-blue-100/30 to-cyan-100/20 blur-2xl" />

          {/* Header Banner */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 px-8 pb-8 pt-8">
            {/* Decorative */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-4 left-1/4 h-16 w-16 rounded-full bg-purple-400/15 blur-lg" />

            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Create New Group
                </h1>
                <p className="text-sm text-indigo-200">
                  Split expenses with your friends
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={g.handleSubmit}
            className="relative space-y-0 px-6 pb-8 pt-6 sm:px-8"
          >
            {/* General Error */}
            {g.errors.general && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
                <p className="text-sm font-medium text-rose-700">
                  {g.errors.general}
                </p>
              </div>
            )}

            <div className="space-y-5">
              {/* ── Group Name ────────────────────── */}
              <div>
                <label className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    Group Name
                    <span className="text-rose-400">*</span>
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      g.name.length > 100
                        ? "text-rose-500"
                        : "text-gray-400"
                    }`}
                  >
                    {g.name.length}/100
                  </span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                    <Type
                      className={`h-4 w-4 ${
                        g.errors.name ? "text-rose-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="text"
                    value={g.name}
                    onChange={(ev) => g.setName(ev.target.value)}
                    placeholder='e.g. "Europe Trip 2025"'
                    maxLength={100}
                    className={`block w-full rounded-2xl border bg-gray-50/50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 ${
                      g.errors.name
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
                    }`}
                  />
                </div>
                {g.errors.name && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
                    <AlertCircle className="h-3 w-3" />
                    {g.errors.name}
                  </p>
                )}
                {!g.errors.name && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Give your group a memorable name.
                  </p>
                )}
              </div>

              {/* ── Description ───────────────────── */}
              <div>
                <label className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    Description
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      g.description.length > 500
                        ? "text-rose-500"
                        : "text-gray-400"
                    }`}
                  >
                    {g.description.length}/500
                  </span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-3.5">
                    <FileText
                      className={`h-4 w-4 ${
                        g.errors.description
                          ? "text-rose-400"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <textarea
                    value={g.description}
                    onChange={(ev) => g.setDescription(ev.target.value)}
                    placeholder="What is this group for?"
                    rows={3}
                    maxLength={500}
                    className={`block w-full resize-none rounded-2xl border bg-gray-50/50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 ${
                      g.errors.description
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
                    }`}
                  />
                </div>
                {g.errors.description && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
                    <AlertCircle className="h-3 w-3" />
                    {g.errors.description}
                  </p>
                )}
                {!g.errors.description && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Optional. Describe what this group is about.
                  </p>
                )}
              </div>

              {/* ── Currency Selector ─────────────── */}
              <CurrencyDropdown
                currencies={g.currencies}
                selected={g.currency}
                selectedCurrency={g.selectedCurrency}
                onSelect={g.setCurrency}
                error={g.errors.currency}
              />

              {/* ── Divider ──────────────────────── */}
              <div className="border-t border-gray-100" />

              {/* ── Friend Selection ─────────────── */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                      <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Add Friends
                      </h3>
                      <p className="text-xs text-gray-400">
                        {g.selectedFriendIds.length > 0
                          ? `${g.selectedFriendIds.length} selected`
                          : "Optional — you can add members later"}
                      </p>
                    </div>
                  </div>

                  {/* Select / Deselect All */}
                  {g.friends.length > 0 && (
                    <div className="flex gap-1">
                      {g.selectedFriendIds.length < g.friends.length ? (
                        <button
                          type="button"
                          onClick={g.selectAllFriends}
                          className="rounded-lg px-2 py-1 text-[10px] font-semibold text-indigo-600 transition-all hover:bg-indigo-50"
                        >
                          Select All
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={g.deselectAllFriends}
                          className="rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-500 transition-all hover:bg-gray-100"
                        >
                          Deselect All
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected pills */}
                {g.selectedFriendIds.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {g.selectedFriendIds.map((id) => {
                      const friend = g.friends.find((f) => f.id === id);
                      if (!friend) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => g.toggleFriend(id)}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 py-1 pl-1 pr-2.5 text-xs font-medium text-emerald-700 transition-all hover:bg-emerald-100"
                        >
                          <img
                            src={
                              friend.avatar_url.trim().length > 0
                                ? friend.avatar_url
                                : getFallbackAvatar(friend.display_name)
                            }
                            alt=""
                            className="h-5 w-5 rounded-full object-cover"
                            onError={(ev) => {
                              (ev.target as HTMLImageElement).src =
                                getFallbackAvatar(friend.display_name);
                            }}
                          />
                          {friend.display_name}
                          <X className="h-3 w-3 text-emerald-500" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Search friends */}
                {g.friends.length > 4 && (
                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={g.friendSearch}
                      onChange={(ev) => g.setFriendSearch(ev.target.value)}
                      placeholder="Search friends…"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                )}

                {/* Friends Grid */}
                {g.friends.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-8 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">
                      No friends yet
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Add friends first, then invite them to groups.
                    </p>
                  </div>
                ) : g.filteredFriends.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-6 text-center">
                    <Search className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      No friends match &quot;{g.friendSearch}&quot;
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {g.filteredFriends.map((friend) => (
                      <FriendCard
                        key={friend.id}
                        friend={friend}
                        isSelected={g.selectedFriendIds.includes(friend.id)}
                        onToggle={() => g.toggleFriend(friend.id)}
                      />
                    ))}
                  </div>
                )}

                {g.errors.friends && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-600">
                    <AlertCircle className="h-3 w-3" />
                    {g.errors.friends}
                  </p>
                )}
              </div>
            </div>

            {/* ── Divider ────────────────────────── */}
            <div className="my-6 border-t border-gray-100" />

            {/* ── Summary Note ───────────────────── */}
            <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
              <Coins className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
              <p className="text-xs leading-relaxed text-indigo-700">
                All expenses in this group will be tracked in{" "}
                <strong>
                  {g.selectedCurrency.code} ({g.selectedCurrency.symbol})
                </strong>
                . You can change the currency later in group settings.
                {g.selectedFriendIds.length > 0 && (
                  <>
                    {" "}
                    <strong>{g.selectedFriendIds.length}</strong>{" "}
                    {g.selectedFriendIds.length === 1 ? "friend" : "friends"}{" "}
                    will be added automatically.
                  </>
                )}
              </p>
            </div>

            {/* ── Action Buttons ─────────────────── */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              {/* Left: Cancel */}
              <button
                type="button"
                onClick={g.handleCancel}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all duration-200 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </button>

              {/* Right: Create */}
              <button
                type="submit"
                disabled={g.saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {g.saving ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    Create Group
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}