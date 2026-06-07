-- ═══════════════════════════════════════════════════
-- Dashboard Enrichment Migration
-- ═══════════════════════════════════════════════════
-- Adds category, split_type, and currency to the
-- get_dashboard_data RPC's recent_expenses payload.
-- Safe to re-run (idempotent via DROP + CREATE).
-- ═══════════════════════════════════════════════════

-- Drop old function (return type changed)
DROP FUNCTION IF EXISTS public.get_dashboard_data();

-- ═══════════════════════════════════════════════════
-- Updated RPC: get_dashboard_data
-- ═══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile JSON;
  v_groups JSON;
  v_recent_expenses JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ── Profile ────────────────────────────────────────
  SELECT json_build_object(
    'display_name', COALESCE(p.display_name, p.full_name, p.username, 'User'),
    'avatar_url', COALESCE(p.avatar_url, '')
  )
  INTO v_profile
  FROM profiles p
  WHERE p.id = v_user_id;

  -- ── Groups (with net_balance) ──────────────────────
  SELECT COALESCE(json_agg(
    json_build_object(
      'group_id', g.id,
      'group_name', g.name,
      'currency', g.currency,
      'net_balance', COALESCE(bal.net_balance, 0),
      'owner_id', g.owner_id,
      'created_at', g.created_at
    ) ORDER BY g.created_at DESC
  ), '[]'::json)
  INTO v_groups
  FROM groups g
  INNER JOIN group_members gm ON gm.group_id = g.id
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(
        CASE
          WHEN e.paid_by = v_user_id THEN e.amount - COALESCE(es_split.owed, 0)
          WHEN es_split.user_id = v_user_id THEN -es_split.owed
          ELSE 0
        END
      ), 0) AS net_balance
    FROM expenses e
    LEFT JOIN LATERAL (
      SELECT es.user_id, es.amount AS owed
      FROM expense_splits es
      WHERE es.expense_id = e.id AND es.user_id = v_user_id
      LIMIT 1
    ) es_split ON true
    WHERE e.group_id = g.id
      AND e.paid_by = v_user_id OR es_split.user_id IS NOT NULL
  ) bal ON true
  WHERE gm.user_id = v_user_id;

  -- ── Recent expenses (enriched with category + currency) ──
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', e.id,
      'name', e.name,
      'amount', e.amount,
      'created_at', e.created_at,
      'group_id', e.group_id,
      'category', e.category,
      'split_type', e.split_type,
      'currency', g.currency,
      'paid_by_profile', json_build_object(
        'display_name', COALESCE(p.display_name, p.full_name, p.username, 'User'),
        'avatar_url', COALESCE(p.avatar_url, '')
      ),
      'expense_group', json_build_object(
        'name', g.name,
        'currency', g.currency
      )
    ) ORDER BY e.created_at DESC
  ), '[]'::json)
  INTO v_recent_expenses
  FROM expenses e
  INNER JOIN groups g ON g.id = e.group_id
  LEFT JOIN profiles p ON p.id = e.paid_by
  INNER JOIN group_members gm ON gm.group_id = e.group_id AND gm.user_id = v_user_id
  ORDER BY e.created_at DESC
  LIMIT 20;

  -- ── Return combined payload ───────────────────────
  RETURN json_build_object(
    'profile', v_profile,
    'groups', v_groups,
    'recent_expenses', v_recent_expenses
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_data() TO authenticated;

-- ═══════════════════════════════════════════════════
-- Notes:
-- • Uses SECURITY DEFINER so users can see their own data
--   without explicit RLS on every join
-- • Recent expenses limited to 20 to keep payload small
-- • If your schema has expense_splits with different column
--   names, adjust the es_split subquery accordingly
-- ═══════════════════════════════════════════════════
