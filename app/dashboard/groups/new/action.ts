"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

export interface CreateGroupState {
  error: string | null;
  fieldErrors: {
    name?: string;
    currency?: string;
  };
}

/* ────────────────────────────────────────────────────────────
   Currencies (for server-side validation)
   ──────────────────────────────────────────────────────────── */

const VALID_CURRENCIES = new Set([
  "USD", "EUR", "GBP", "CAD", "AUD",
  "JPY", "INR", "BRL", "MXN", "CHF",
]);

/* ────────────────────────────────────────────────────────────
   Server Action: createGroup
   ──────────────────────────────────────────────────────────── */

export async function createGroup(
  _prevState: CreateGroupState,
  formData: FormData
): Promise<CreateGroupState> {
  const supabase = await createClient();

  // ── Auth check ──────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Extract form fields ─────────────────────────────────
  const rawName = formData.get("name");
  const rawCurrency = formData.get("currency");
  const rawDescription = formData.get("description");

  const name = typeof rawName === "string" ? rawName.trim() : "";
  const currency =
    typeof rawCurrency === "string" ? rawCurrency.trim().toUpperCase() : "USD";
  const description =
    typeof rawDescription === "string" ? rawDescription.trim() : "";

  // ── Validation ──────────────────────────────────────────
  const fieldErrors: CreateGroupState["fieldErrors"] = {};

  if (!name) {
    fieldErrors.name = "Group name is required.";
  } else if (name.length > 100) {
    fieldErrors.name = "Group name must be 100 characters or fewer.";
  }

  if (!VALID_CURRENCIES.has(currency)) {
    fieldErrors.currency = "Please select a valid currency.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  // ── Insert group ────────────────────────────────────────
  // The trg_group_auto_owner trigger automatically inserts
  // the creator into group_members with role = 'owner'.
  // We do NOT insert into group_members manually.

  const { data: group, error: insertError } = await supabase
    .from("groups")
    .insert({
      name,
      currency,
      description: description || null,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    return {
      error: insertError.message,
      fieldErrors: {},
    };
  }

  if (!group) {
    return {
      error: "Group was created but no ID was returned.",
      fieldErrors: {},
    };
  }

  // ── Redirect to the new group ───────────────────────────
  redirect(`/dashboard/groups/${group.id}`);
}