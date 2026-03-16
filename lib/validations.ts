import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required."),
});

export const signUpSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be under 30 characters.")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores."),
  fullName: z
    .string()
    .max(100, "Full name must be under 100 characters.")
    .optional(),
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
});

// ── Profile ───────────────────────────────────────────────────
export const profileEditSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(50, "Display name must be under 50 characters."),
  username: z.preprocess(
    (val) => (typeof val === "string" ? val.toLowerCase().trim() : val),
    z
      .string()
      .min(3, "Username must be at least 3 characters.")
      .max(30, "Username must be under 30 characters.")
      .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores.")
  ),
  full_name: z
    .string()
    .max(100, "Full name must be under 100 characters.")
    .optional(),
  bio: z
    .string()
    .max(250, "Bio must be under 250 characters.")
    .optional(),
  avatar_url: z.string().optional(),
});

// ── Groups ────────────────────────────────────────────────────
export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required.")
    .max(100, "Group name must be under 100 characters."),
  description: z
    .string()
    .max(500, "Description must be under 500 characters.")
    .optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code (e.g. USD).")
    .default("USD"),
});

export const groupSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required.")
    .max(100, "Group name must be under 100 characters."),
  description: z
    .string()
    .max(500, "Description must be under 500 characters.")
    .optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code (e.g. USD)."),
});

// ── Expenses ──────────────────────────────────────────────────
export const expenseSplitSchema = z.object({
  user_id: z.string().uuid("Invalid user ID."),
  amount: z.number().positive("Each split amount must be positive."),
  percentage: z.number().positive("Each split percentage must be positive.").optional(),
  percent: z.number().positive("Each split percentage must be positive.").optional(),
});

export const expenseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Expense name is required.")
    .max(200, "Expense name must be under 200 characters."),
  amount: z
    .number("Amount must be a number.")
    .positive("Amount must be greater than zero.")
    .max(1_000_000, "Amount seems too large."),
  paid_by: z.string().uuid("Invalid payer."),
  split_type: z.enum(["equal", "custom", "percentage"]),
  category: z.string().optional(),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters.")
    .optional(),
  splits: z.array(expenseSplitSchema).min(1, "At least one split is required."),
}).refine(
  (data) => {
    if (data.split_type === "custom") {
      const total = data.splits.reduce((sum, s) => sum + s.amount, 0);
      return Math.abs(total - data.amount) <= 0.02;
    }

    if (data.split_type === "percentage") {
      const percentages = data.splits.map((s) =>
        typeof s.percentage === "number"
          ? s.percentage
          : typeof s.percent === "number"
            ? s.percent
            : null
      );

      const hasAllPercentages = percentages.every((p) => typeof p === "number");
      if (!hasAllPercentages) return false;

      const totalPercent = (percentages as number[]).reduce((sum, p) => sum + p, 0);
      if (Math.abs(totalPercent - 100) > 0.5) return false;

      const derivedTotal = (percentages as number[]).reduce(
        (sum, p) => sum + (p / 100) * data.amount,
        0
      );
      return Math.abs(derivedTotal - data.amount) <= 0.02;
    }

    return true;
  },
  {
    message:
      "Split values must match the expense total (for percentage splits, percentages must total 100%).",
    path: ["splits"],
  }
);

// ── Settlements ───────────────────────────────────────────────
export const settlementSchema = z.object({
  to_user: z.string().uuid("Please select who you are paying."),
  amount: z
    .number("Amount must be a number.")
    .positive("Amount must be greater than zero.")
    .max(1_000_000, "Amount seems too large."),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters.")
    .optional(),
});

// ── Friends ───────────────────────────────────────────────────
export const friendSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Please enter a username to search.")
    .max(30, "Search query too long.")
    .regex(/^[a-z0-9_]+$/, "Search by username only (lowercase letters, numbers, underscores)."),
});

// ── Inferred Types ────────────────────────────────────────────
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ProfileEditInput = z.infer<typeof profileEditSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type GroupSettingsInput = z.infer<typeof groupSettingsSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SettlementInput = z.infer<typeof settlementSchema>;
export type FriendSearchInput = z.infer<typeof friendSearchSchema>;
