-- ==========================================
-- 🏷️ Add category column to expenses table
-- ==========================================
-- This migration adds a `category` column to the `expenses` table
-- to enable expense categorization and analysis features.
--
-- Categories are stored as text with a CHECK constraint
-- to ensure only valid categories are inserted.
-- Default is 'other' for existing and new rows.

-- 1. Add category column (nullable first for safe migration)
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- 2. Add CHECK constraint for valid categories
ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE expenses
ADD CONSTRAINT expenses_category_check
CHECK (category IN (
  'food',
  'transport',
  'housing',
  'entertainment',
  'shopping',
  'health',
  'education',
  'travel',
  'utilities',
  'other'
));

-- 3. Create index for faster category-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_category
ON expenses (category);

-- See POST-MIGRATION STEPS below for the full function definitions.

-- ==========================================
-- 📝 POST-MIGRATION STEPS
-- ==========================================
-- Run the following 3 CREATE OR REPLACE FUNCTION statements
-- in Supabase Dashboard → SQL Editor:

-- ── 1. add_expense_custom_split ──────────────────────────────
-- Add _category TEXT DEFAULT 'other' parameter
-- Add category to INSERT: VALUES (..., _category)

-- ── 2. edit_expense_custom_split ─────────────────────────────
-- Add _category TEXT DEFAULT 'other' parameter
-- Add category = _category to UPDATE SET clause

-- ── 3. get_group_details ─────────────────────────────────────
-- Add e.category to the explicit column SELECT for expenses
-- (change: e.id, e.name, e.amount, e.created_at, e.paid_by, e.split_type
--  to:      e.id, e.name, e.amount, e.created_at, e.paid_by, e.split_type, e.category)
