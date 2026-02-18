"use client";

import React, { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

/* ────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

const CURRENCIES = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "BRL", label: "Brazilian Real (BRL)" },
  { code: "MXN", label: "Mexican Peso (MXN)" },
  { code: "CHF", label: "Swiss Franc (CHF)" },
] as const;

/* ────────────────────────────────────────────────────────────
   Reusable field components
   ──────────────────────────────────────────────────────────── */

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
}

function InputField({
  id,
  label,
  value,
  placeholder,
  required,
  maxLength,
  onChange,
}: InputFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        required={required}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="
          block w-full rounded-md border border-gray-300 bg-white
          px-3 py-2 text-sm text-gray-900 placeholder-gray-400
          shadow-sm transition-colors
          focus:border-blue-500 focus:outline-none focus:ring-1
          focus:ring-blue-500
        "
      />
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: ReadonlyArray<{ code: string; label: string }>;
  onChange: (value: string) => void;
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
        <span className="ml-0.5 text-red-500">*</span>
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          block w-full rounded-md border border-gray-300 bg-white
          px-3 py-2 text-sm text-gray-900
          shadow-sm transition-colors
          focus:border-blue-500 focus:outline-none focus:ring-1
          focus:ring-blue-500
        "
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  onChange: (value: string) => void;
}

function TextAreaField({
  id,
  label,
  value,
  placeholder,
  maxLength,
  onChange,
}: TextAreaFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
        <span className="ml-1 text-xs font-normal text-gray-400">
          (optional)
        </span>
      </label>
      <textarea
        id={id}
        name={id}
        rows={3}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="
          block w-full resize-none rounded-md border border-gray-300
          bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400
          shadow-sm transition-colors
          focus:border-blue-500 focus:outline-none focus:ring-1
          focus:ring-blue-500
        "
      />
      {maxLength && (
        <p className="mt-1 text-right text-xs text-gray-400">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Skeleton loader
   ──────────────────────────────────────────────────────────── */

function FormSkeleton() {
  return (
    <div className="w-full max-w-md">
      <div className="animate-pulse space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-40 rounded bg-gray-200" />
        <div className="space-y-4">
          <div className="h-10 w-full rounded bg-gray-200" />
          <div className="h-10 w-full rounded bg-gray-200" />
          <div className="h-24 w-full rounded bg-gray-200" />
          <div className="h-10 w-full rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main form component
   ──────────────────────────────────────────────────────────── */

export function CreateGroupForm() {
  // ── Auth state ──────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  // ── Form state ──────────────────────────────────────────
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  /* ── Session check ───────────────────────────────────── */

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setUser(session.user);
      setChecking(false);
    }

    checkSession();
  }, [router, supabase.auth]);

  /* ── Submit handler ──────────────────────────────────── */

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // ── Client-side validation ────────────────────────
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Group name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Group name must be 100 characters or fewer.");
      return;
    }

    if (!user) {
      setError("You must be signed in to create a group.");
      return;
    }

    setLoading(true);

    try {
      // ── Insert the group ────────────────────────────
      // The trg_group_auto_owner trigger automatically
      // inserts the creator into group_members with
      // role = 'owner'.
      const { data, error: insertError } = await supabase
        .from("groups")
        .insert({
          name: trimmedName,
          currency,
          description: description.trim() || null,
          owner_id: user.id,
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      if (!data) {
        setError("Group was created but no ID was returned.");
        return;
      }

      // ── Redirect to the new group's dashboard ──────
      router.push(`/dashboard/groups/${data.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ── Loading state ───────────────────────────────────── */

  if (checking) return <FormSkeleton />;

  /* ── Authenticated view ──────────────────────────────── */

  return (
    <div className="w-full max-w-md">
      {/* ── Header ────────────────────────────────────── */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="
            mb-4 inline-flex items-center gap-1 text-sm
            text-gray-500 transition-colors hover:text-gray-900
          "
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479
                   3 3 0 00-4.682-2.72m.94
                   3.198l.001.031c0 .225-.012.447-.037.666A11.944
                   11.944 0 0112 21c-2.17
                   0-4.207-.576-5.963-1.584A6.062 6.062
                   0 016 18.719m12 0a5.971 5.971 0
                   00-.941-3.197m0 0A5.995 5.995 0 0012
                   12.75a5.995 5.995 0
                   00-5.058 2.772m0 0a3 3 0 00-4.681
                   2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971
                   5.971 0 00-.94 3.197M15 6.75a3 3 0
                   11-6 0 3 3 0 016 0zm6
                   3a2.25 2.25 0 11-4.5 0 2.25 2.25
                   0 014.5 0zm-13.5 0a2.25 2.25 0
                   11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              Create a new group
            </h1>
            <p className="text-sm text-gray-500">
              Set up a shared space to track expenses together.
            </p>
          </div>
        </div>
      </div>

      {/* ── Form card ─────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Fields */}
        <InputField
          id="group-name"
          label="Group name"
          value={name}
          placeholder='e.g. "Europe Trip 2025"'
          required
          maxLength={100}
          onChange={setName}
        />

        <SelectField
          id="currency"
          label="Currency"
          value={currency}
          options={CURRENCIES}
          onChange={setCurrency}
        />

        <TextAreaField
          id="description"
          label="Description"
          value={description}
          placeholder="What is this group for?"
          maxLength={500}
          onChange={setDescription}
        />

        {/* Info callout */}
        <div className="flex gap-2.5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0
                 011.063.852l-.708 2.836a.75.75
                 0 001.063.853l.041-.021M21
                 12a9 9 0 11-18 0 9 9 0 0118
                 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          <p className="text-xs leading-relaxed text-blue-700">
            You'll be added as the <strong>owner</strong> automatically.
            You can invite members and assign admins after creation.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="
            flex w-full items-center justify-center rounded-md
            bg-blue-600 px-4 py-2.5 text-sm font-medium text-white
            shadow-sm transition-colors
            hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {loading ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Creating group…
            </>
          ) : (
            "Create group"
          )}
        </button>
      </form>
    </div>
  );
}