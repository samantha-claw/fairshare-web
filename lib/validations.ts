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
    .optional()
    .or(z.literal("")),
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
    .min(2, "Display name must be at least 2 characters.")
    .max(50, "Display name must be under 50 characters."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be under 30 characters.")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores.")
    .transform((val) => val.toLowerCase().trim()),
  full_name: z
    .string()
    .max(100, "Full name must be under 100 characters.")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(250, "Bio must be under 250 characters.")
    .optional()
    .or(z.literal("")),
  avatar_url: z.string().optional().or(z.literal("")),
});

// ── Groups ────────────────────────────────────────────────────
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required.")
    .max(100, "Group name must be under 100 characters."),
  description: z
    .string()
    .max(500, "Description must be under 500 characters.")
    .optional()
    .or(z.literal("")),
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
    .min(1, "Group name is required.")
    .max(100, "Group name must be under 100 characters."),
  description: z
    .string()
    .max(500, "Description must be under 500 characters.")
    .optional()
    .or(z.literal("")),
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
});

export const expenseSchema = z.object({
  name: z
    .string()
    .min(1, "Expense name is required.")
    .max(200, "Expense name must be under 200 characters."),
  amount: z
    .number({ message: "Amount must be a number." })
    .positive("Amount must be greater than zero.")
    .max(1_000_000, "Amount seems too large."),
  paid_by: z.string().uuid("Invalid payer."),
  split_type: z.enum(["equal", "custom", "percentage"]),
  category: z.string().optional(),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters.")
    .optional()
    .or(z.literal("")),
  splits: z.array(expenseSplitSchema).min(1, "At least one split is required."),
}).refine(
  (data) => {
    if (data.split_type === "custom") {
      const total = data.splits.reduce((sum, s) => sum + s.amount, 0);
      return Math.abs(total - data.amount) <= 0.02;
    }
    return true;
  },
  {
    message: "Split amounts must add up to the total expense amount.",
    path: ["splits"],
  }
);

// ── Settlements ───────────────────────────────────────────────
export const settlementSchema = z.object({
  to_user: z.string().uuid("Please select who you are paying."),
  amount: z
    .number({ message: "Amount must be a number." })
    .positive("Amount must be greater than zero.")
    .max(1_000_000, "Amount seems too large."),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters.")
    .optional()
    .or(z.literal("")),
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
