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

-- 4. Update the `add_expense_custom_split` RPC to accept category
-- We need to recreate the function with the new parameter.
-- First, get the current function definition and add the category param.
-- Since we can't easily ALTER a function signature, we CREATE OR REPLACE.

-- Note: You will need to manually update the RPC functions
-- (add_expense_custom_split and edit_expense_custom_split)
-- to accept and store the _category parameter.
-- The front-end code will pass category in the RPC call.
-- Example modification:
--
-- CREATE OR REPLACE FUNCTION add_expense_custom_split(
--   _group_id UUID,
--   _name TEXT,
--   _amount NUMERIC,
--   _paid_by UUID,
--   _splits JSONB,
--   _split_type TEXT,
--   _category TEXT DEFAULT 'other'   -- ← NEW PARAMETER
-- )
-- RETURNS UUID
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--   v_expense_id UUID;
-- BEGIN
--   INSERT INTO expenses (group_id, name, amount, paid_by, split_type, category)
--   VALUES (_group_id, _name, _amount, _paid_by, _split_type, _category)
--   RETURNING id INTO v_expense_id;
--   -- ... rest of function unchanged
-- END;
-- $$;
--
-- Similarly for edit_expense_custom_split:
--
-- CREATE OR REPLACE FUNCTION edit_expense_custom_split(
--   _expense_id UUID,
--   _name TEXT,
--   _amount NUMERIC,
--   _paid_by UUID,
--   _splits JSONB,
--   _split_type TEXT,
--   _category TEXT DEFAULT 'other'   -- ← NEW PARAMETER
-- )
-- ...

-- 5. Update the get_group_details RPC to include category in expenses
-- The expenses returned by get_group_details will automatically
-- include the new column since it uses SELECT * or explicit columns.
-- If the function uses explicit columns, add `e.category` to the SELECT.

-- ==========================================
-- 📝 POST-MIGRATION STEPS (manual)
-- ==========================================
-- 1. Update add_expense_custom_split function to accept _category param
-- 2. Update edit_expense_custom_split function to accept _category param
-- 3. Update get_group_details function to return e.category
-- 4. Run this SQL in Supabase Dashboard → SQL Editor
-- 5. Then update the function definitions
