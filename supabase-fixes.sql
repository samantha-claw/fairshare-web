-- =============================================================================
-- FAIRSHARE SUPABASE FULL REMEDIATION & BALANCE SYNCHRONIZATION SCRIPT
-- Run this entire script in your Supabase SQL Editor.
-- It is idempotent (safe to run multiple times).
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. DROP LEGACY INCREMENTAL BALANCE TRIGGERS & ENSURE UNIQUE CONSTRAINT
-- Replaces broken incremental triggers with an authoritative set-based engine
-- so public.balances ALWAYS contains the exact total_paid, total_owed, and
-- net_balance across all expense creations, edits, deletions, and settlements.
-- =============================================================================

DROP TRIGGER IF EXISTS trg_expense_balance ON public.expenses;
DROP TRIGGER IF EXISTS trg_split_balance ON public.expense_splits;
DROP TRIGGER IF EXISTS trg_settlement_balance ON public.settlements;

DROP FUNCTION IF EXISTS public.update_balances_on_expense() CASCADE;
DROP FUNCTION IF EXISTS public.update_balances_on_split() CASCADE;
DROP FUNCTION IF EXISTS public.update_balances_on_settlement() CASCADE;

-- Ensure unique constraint on (group_id, user_id) exists on public.balances
DO $$
BEGIN
  -- Remove any duplicate (group_id, user_id) rows first
  DELETE FROM public.balances a
  USING public.balances b
  WHERE a.ctid < b.ctid
    AND a.group_id = b.group_id
    AND a.user_id = b.user_id;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.balances'::regclass
      AND contype = 'u'
      AND conkey @> ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.balances'::regclass AND attname = 'group_id'),
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.balances'::regclass AND attname = 'user_id')
      ]
  ) THEN
    ALTER TABLE public.balances
      ADD CONSTRAINT balances_group_id_user_id_key UNIQUE (group_id, user_id);
  END IF;
END
$$;


-- =============================================================================
-- 2. AUTHORITATIVE GROUP BALANCES ENGINE: public.recalculate_group_balances
-- Formula (matches app ledger & debt simplifier):
--   total_paid  = sum(expenses paid by user) + sum(approved/completed settlements sent)
--   total_owed  = sum(expense splits owed by user) + sum(approved/completed settlements received)
--   net_balance = ROUND(total_paid - total_owed, 2)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_group_balances(_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _has_amount_col boolean;
  _has_owed_amount_col boolean;
  _split_expr text;
BEGIN
  IF _group_id IS NULL THEN
    RETURN;
  END IF;

  -- Skip if the group no longer exists
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE id = _group_id) THEN
    RETURN;
  END IF;

  -- Detect whether public.expense_splits uses `amount`, `owed_amount`, or both
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expense_splits' AND column_name = 'amount'
  ) INTO _has_amount_col;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expense_splits' AND column_name = 'owed_amount'
  ) INTO _has_owed_amount_col;

  IF _has_amount_col AND _has_owed_amount_col THEN
    _split_expr := 'COALESCE(es.amount, es.owed_amount, 0)';
  ELSIF _has_amount_col THEN
    _split_expr := 'COALESCE(es.amount, 0)';
  ELSIF _has_owed_amount_col THEN
    _split_expr := 'COALESCE(es.owed_amount, 0)';
  ELSE
    _split_expr := '0';
  END IF;

  EXECUTE format($sql$
    WITH participants AS (
      SELECT user_id FROM public.group_members WHERE group_id = $1 AND user_id IS NOT NULL
      UNION
      SELECT paid_by AS user_id FROM public.expenses WHERE group_id = $1 AND paid_by IS NOT NULL
      UNION
      SELECT es.user_id
      FROM public.expense_splits es
      JOIN public.expenses e ON e.id = es.expense_id
      WHERE e.group_id = $1 AND es.user_id IS NOT NULL
      UNION
      SELECT from_user AS user_id FROM public.settlements WHERE group_id = $1 AND from_user IS NOT NULL
      UNION
      SELECT to_user AS user_id FROM public.settlements WHERE group_id = $1 AND to_user IS NOT NULL
    ),
    paid_agg AS (
      SELECT paid_by AS user_id, COALESCE(SUM(amount), 0)::numeric(12,2) AS expense_paid
      FROM public.expenses
      WHERE group_id = $1 AND paid_by IS NOT NULL
      GROUP BY paid_by
    ),
    owed_agg AS (
      SELECT es.user_id, COALESCE(SUM(%s), 0)::numeric(12,2) AS expense_owed
      FROM public.expense_splits es
      JOIN public.expenses e ON e.id = es.expense_id
      WHERE e.group_id = $1 AND es.user_id IS NOT NULL
      GROUP BY es.user_id
    ),
    settled_from AS (
      SELECT from_user AS user_id, COALESCE(SUM(amount), 0)::numeric(12,2) AS settled_out
      FROM public.settlements
      WHERE group_id = $1 AND status IN ('approved', 'completed') AND from_user IS NOT NULL
      GROUP BY from_user
    ),
    settled_to AS (
      SELECT to_user AS user_id, COALESCE(SUM(amount), 0)::numeric(12,2) AS settled_in
      FROM public.settlements
      WHERE group_id = $1 AND status IN ('approved', 'completed') AND to_user IS NOT NULL
      GROUP BY to_user
    ),
    computed AS (
      SELECT
        p.user_id,
        ROUND((COALESCE(pa.expense_paid, 0) + COALESCE(sf.settled_out, 0))::numeric, 2) AS calc_total_paid,
        ROUND((COALESCE(oa.expense_owed, 0) + COALESCE(st.settled_in, 0))::numeric, 2) AS calc_total_owed,
        ROUND(
          (
            (COALESCE(pa.expense_paid, 0) + COALESCE(sf.settled_out, 0))
            - (COALESCE(oa.expense_owed, 0) + COALESCE(st.settled_in, 0))
          )::numeric,
          2
        ) AS calc_net_balance
      FROM participants p
      LEFT JOIN paid_agg pa ON pa.user_id = p.user_id
      LEFT JOIN owed_agg oa ON oa.user_id = p.user_id
      LEFT JOIN settled_from sf ON sf.user_id = p.user_id
      LEFT JOIN settled_to st ON st.user_id = p.user_id
    )
    INSERT INTO public.balances (group_id, user_id, total_paid, total_owed, net_balance, updated_at)
    SELECT
      $1,
      c.user_id,
      c.calc_total_paid,
      c.calc_total_owed,
      c.calc_net_balance,
      now()
    FROM computed c
    ON CONFLICT (group_id, user_id)
    DO UPDATE SET
      total_paid  = EXCLUDED.total_paid,
      total_owed  = EXCLUDED.total_owed,
      net_balance = EXCLUDED.net_balance,
      updated_at  = now();
  $sql$, _split_expr) USING _group_id;

  -- Remove stale zero-balance rows for users who are no longer members of the group
  DELETE FROM public.balances b
  WHERE b.group_id = _group_id
    AND ABS(b.net_balance) < 0.01
    AND b.total_paid = 0
    AND b.total_owed = 0
    AND NOT EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = _group_id AND gm.user_id = b.user_id
    );
END;
$$;

-- Trigger dispatcher for expenses, expense_splits, settlements, and group_members
CREATE OR REPLACE FUNCTION public.trg_fn_sync_group_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _gid uuid;
BEGIN
  IF TG_TABLE_NAME = 'expense_splits' THEN
    IF TG_OP = 'DELETE' THEN
      SELECT group_id INTO _gid FROM public.expenses WHERE id = OLD.expense_id;
    ELSE
      SELECT group_id INTO _gid FROM public.expenses WHERE id = NEW.expense_id;
    END IF;
    PERFORM public.recalculate_group_balances(_gid);
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_group_balances(OLD.group_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.group_id IS DISTINCT FROM NEW.group_id THEN
      PERFORM public.recalculate_group_balances(OLD.group_id);
    END IF;
    PERFORM public.recalculate_group_balances(NEW.group_id);
    RETURN NEW;
  ELSE
    PERFORM public.recalculate_group_balances(NEW.group_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_balances_on_expenses ON public.expenses;
CREATE TRIGGER trg_sync_balances_on_expenses
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_sync_group_balances();

DROP TRIGGER IF EXISTS trg_sync_balances_on_expense_splits ON public.expense_splits;
CREATE TRIGGER trg_sync_balances_on_expense_splits
AFTER INSERT OR UPDATE OR DELETE ON public.expense_splits
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_sync_group_balances();

DROP TRIGGER IF EXISTS trg_sync_balances_on_settlements ON public.settlements;
CREATE TRIGGER trg_sync_balances_on_settlements
AFTER INSERT OR UPDATE OR DELETE ON public.settlements
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_sync_group_balances();

DROP TRIGGER IF EXISTS trg_sync_balances_on_group_members ON public.group_members;
CREATE TRIGGER trg_sync_balances_on_group_members
AFTER INSERT OR UPDATE OR DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_sync_group_balances();

-- Backfill all existing groups immediately so public.balances is 100% accurate
DO $$
DECLARE
  _g record;
BEGIN
  FOR _g IN SELECT id FROM public.groups LOOP
    PERFORM public.recalculate_group_balances(_g.id);
  END LOOP;
END;
$$;


-- =============================================================================
-- 3. EXPENSE & SETTLEMENT RPCs (SYNCHRONIZED WITH public.balances)
-- =============================================================================

-- 3A. add_expense_custom_split
CREATE OR REPLACE FUNCTION public.add_expense_custom_split(
  _group_id uuid,
  _name text,
  _amount numeric,
  _paid_by uuid,
  _splits jsonb,
  _split_type text DEFAULT 'equal',
  _category text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _expense_id uuid;
  _split jsonb;
  _has_amount_col boolean;
  _has_owed_amount_col boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _uid
  ) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  INSERT INTO public.expenses (group_id, name, amount, paid_by, split_type, category)
  VALUES (_group_id, TRIM(_name), ROUND(_amount::numeric, 2), _paid_by, COALESCE(_split_type, 'equal'), _category)
  RETURNING id INTO _expense_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expense_splits' AND column_name = 'amount'
  ) INTO _has_amount_col;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expense_splits' AND column_name = 'owed_amount'
  ) INTO _has_owed_amount_col;

  FOR _split IN SELECT * FROM jsonb_array_elements(_splits)
  LOOP
    IF _has_amount_col AND _has_owed_amount_col THEN
      EXECUTE 'INSERT INTO public.expense_splits (expense_id, user_id, amount, owed_amount) VALUES ($1, $2, $3, $3)'
      USING _expense_id, (_split->>'user_id')::uuid, ROUND((_split->>'amount')::numeric, 2);
    ELSIF _has_amount_col THEN
      EXECUTE 'INSERT INTO public.expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)'
      USING _expense_id, (_split->>'user_id')::uuid, ROUND((_split->>'amount')::numeric, 2);
    ELSE
      EXECUTE 'INSERT INTO public.expense_splits (expense_id, user_id, owed_amount) VALUES ($1, $2, $3)'
      USING _expense_id, (_split->>'user_id')::uuid, ROUND((_split->>'amount')::numeric, 2);
    END IF;
  END LOOP;

  -- Recalculate group balances authoritatively
  PERFORM public.recalculate_group_balances(_group_id);

  RETURN _expense_id;
END;
$$;

-- 3B. edit_expense_custom_split
CREATE OR REPLACE FUNCTION public.edit_expense_custom_split(
  _expense_id uuid,
  _name text,
  _amount numeric,
  _paid_by uuid,
  _splits jsonb,
  _split_type text DEFAULT 'equal',
  _category text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _group_id uuid;
  _split jsonb;
  _has_amount_col boolean;
  _has_owed_amount_col boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT group_id INTO _group_id FROM public.expenses WHERE id = _expense_id;
  IF _group_id IS NULL THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _uid
  ) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  UPDATE public.expenses
  SET
    name = TRIM(_name),
    amount = ROUND(_amount::numeric, 2),
    paid_by = _paid_by,
    split_type = COALESCE(_split_type, 'equal'),
    category = _category
  WHERE id = _expense_id;

  DELETE FROM public.expense_splits WHERE expense_id = _expense_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expense_splits' AND column_name = 'amount'
  ) INTO _has_amount_col;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expense_splits' AND column_name = 'owed_amount'
  ) INTO _has_owed_amount_col;

  FOR _split IN SELECT * FROM jsonb_array_elements(_splits)
  LOOP
    IF _has_amount_col AND _has_owed_amount_col THEN
      EXECUTE 'INSERT INTO public.expense_splits (expense_id, user_id, amount, owed_amount) VALUES ($1, $2, $3, $3)'
      USING _expense_id, (_split->>'user_id')::uuid, ROUND((_split->>'amount')::numeric, 2);
    ELSIF _has_amount_col THEN
      EXECUTE 'INSERT INTO public.expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)'
      USING _expense_id, (_split->>'user_id')::uuid, ROUND((_split->>'amount')::numeric, 2);
    ELSE
      EXECUTE 'INSERT INTO public.expense_splits (expense_id, user_id, owed_amount) VALUES ($1, $2, $3)'
      USING _expense_id, (_split->>'user_id')::uuid, ROUND((_split->>'amount')::numeric, 2);
    END IF;
  END LOOP;

  -- Recalculate group balances authoritatively
  PERFORM public.recalculate_group_balances(_group_id);
END;
$$;

-- 3C. delete_expense
CREATE OR REPLACE FUNCTION public.delete_expense(_expense_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _group_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT group_id INTO _group_id FROM public.expenses WHERE id = _expense_id;
  IF _group_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _uid
  ) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  DELETE FROM public.expense_splits WHERE expense_id = _expense_id;
  DELETE FROM public.expenses WHERE id = _expense_id;

  -- Recalculate group balances authoritatively
  PERFORM public.recalculate_group_balances(_group_id);
END;
$$;

-- 3D. create_settlement
CREATE OR REPLACE FUNCTION public.create_settlement(
  _group_id uuid,
  _to_user uuid,
  _amount numeric,
  _notes text DEFAULT 'Settle up'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _from_user uuid := auth.uid();
  _settlement_id uuid;
  _payer_name text;
  _group_name text;
  _currency text;
  _has_notes_col boolean;
BEGIN
  IF _from_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _from_user = _to_user THEN
    RAISE EXCEPTION 'Cannot settle with yourself';
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Settlement amount must be greater than zero';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _from_user
  ) THEN
    RAISE EXCEPTION 'You are not a member of this group';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _to_user
  ) THEN
    RAISE EXCEPTION 'Recipient is not a member of this group';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'settlements' AND column_name = 'notes'
  ) INTO _has_notes_col;

  IF _has_notes_col THEN
    EXECUTE 'INSERT INTO public.settlements (group_id, from_user, to_user, amount, status, notes) VALUES ($1, $2, $3, $4, ''pending'', $5) RETURNING id'
    INTO _settlement_id
    USING _group_id, _from_user, _to_user, ROUND(_amount::numeric, 2), COALESCE(NULLIF(TRIM(_notes), ''), 'Settle up');
  ELSE
    INSERT INTO public.settlements (group_id, from_user, to_user, amount, status)
    VALUES (_group_id, _from_user, _to_user, ROUND(_amount::numeric, 2), 'pending')
    RETURNING id INTO _settlement_id;
  END IF;

  -- Send notification to recipient
  SELECT COALESCE(display_name, username, full_name, 'Someone')
  INTO _payer_name
  FROM public.profiles
  WHERE id = _from_user;

  SELECT name, currency
  INTO _group_name, _currency
  FROM public.groups
  WHERE id = _group_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    _to_user,
    'settlement_request',
    'Settlement Request',
    _payer_name || ' recorded a payment of ' || COALESCE(_currency, 'USD') || ' ' || ROUND(_amount::numeric, 2) || ' in ' || COALESCE(_group_name, 'your group'),
    jsonb_build_object(
      'group_id', _group_id,
      'settlement_id', _settlement_id,
      'from_user', _from_user,
      'amount', ROUND(_amount::numeric, 2)
    )
  );

  RETURN _settlement_id;
END;
$$;

-- 3E. respond_to_settlement
CREATE OR REPLACE FUNCTION public.respond_to_settlement(
  p_settlement_id uuid,
  p_action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _settlement record;
  _new_status text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO _settlement
  FROM public.settlements
  WHERE id = p_settlement_id;

  IF _settlement IS NULL THEN
    RAISE EXCEPTION 'Settlement not found';
  END IF;

  IF _settlement.to_user <> _uid THEN
    RAISE EXCEPTION 'Only the recipient can respond to this settlement';
  END IF;

  IF _settlement.status <> 'pending' THEN
    RAISE EXCEPTION 'This settlement has already been processed';
  END IF;

  IF p_action = 'approve' THEN
    _new_status := 'completed';
  ELSIF p_action = 'reject' THEN
    _new_status := 'rejected';
  ELSE
    RAISE EXCEPTION 'Invalid action. Use approve or reject.';
  END IF;

  UPDATE public.settlements
  SET status = _new_status
  WHERE id = p_settlement_id;

  -- Recalculate group balances authoritatively
  PERFORM public.recalculate_group_balances(_settlement.group_id);
END;
$$;

-- 3F. Update get_group_details so `balances` comes directly from `public.balances`
CREATE OR REPLACE FUNCTION public.get_group_details(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _group jsonb;
  _members jsonb;
  _expenses jsonb;
  _balances jsonb;
  _pending_settlements jsonb;
  _completed_settlements jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = _uid
  ) THEN
    RAISE EXCEPTION 'Access denied: not a member of this group';
  END IF;

  -- Ensure public.balances is 100% up-to-date for this group
  PERFORM public.recalculate_group_balances(p_group_id);

  -- 1. Group metadata
  SELECT to_jsonb(g.*) INTO _group
  FROM public.groups g
  WHERE g.id = p_group_id;

  -- 2. Group members with profile details
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', gm.user_id,
        'user_id', gm.user_id,
        'role', gm.role,
        'username', p.username,
        'full_name', p.full_name,
        'display_name', COALESCE(p.display_name, p.full_name, p.username, 'User'),
        'avatar_url', COALESCE(p.avatar_url, ''),
        'profiles', jsonb_build_object(
          'username', p.username,
          'full_name', p.full_name,
          'display_name', COALESCE(p.display_name, p.full_name, p.username, 'User'),
          'avatar_url', COALESCE(p.avatar_url, '')
        )
      )
    ),
    '[]'::jsonb
  ) INTO _members
  FROM public.group_members gm
  LEFT JOIN public.profiles p ON p.id = gm.user_id
  WHERE gm.group_id = p_group_id;

  -- 3. Group expenses with payer profile and splits
  SELECT COALESCE(
    jsonb_agg(exp_row ORDER BY exp_row->>'created_at' DESC),
    '[]'::jsonb
  ) INTO _expenses
  FROM (
    SELECT jsonb_build_object(
      'id', e.id,
      'group_id', e.group_id,
      'name', e.name,
      'amount', e.amount,
      'paid_by', e.paid_by,
      'split_type', e.split_type,
      'category', e.category,
      'created_at', e.created_at,
      'profiles', jsonb_build_object(
        'username', payer.username,
        'full_name', payer.full_name,
        'display_name', COALESCE(payer.display_name, payer.full_name, payer.username, 'User'),
        'avatar_url', COALESCE(payer.avatar_url, '')
      ),
      'expense_splits', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', es.id,
              'expense_id', es.expense_id,
              'user_id', es.user_id,
              'amount', COALESCE(to_jsonb(es)->>'amount', to_jsonb(es)->>'owed_amount', '0')::numeric,
              'profiles', jsonb_build_object(
                'username', sp.username,
                'full_name', sp.full_name,
                'display_name', COALESCE(sp.display_name, sp.full_name, sp.username, 'User'),
                'avatar_url', COALESCE(sp.avatar_url, '')
              )
            )
          )
          FROM public.expense_splits es
          LEFT JOIN public.profiles sp ON sp.id = es.user_id
          WHERE es.expense_id = e.id
        ),
        '[]'::jsonb
      )
    ) AS exp_row
    FROM public.expenses e
    LEFT JOIN public.profiles payer ON payer.id = e.paid_by
    WHERE e.group_id = p_group_id
  ) sub;

  -- 4. Authoritative Balances directly from public.balances table
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'user_id', b.user_id,
        'display_name', COALESCE(p.display_name, p.full_name, p.username, 'User'),
        'avatar_url', COALESCE(p.avatar_url, ''),
        'total_paid', b.total_paid,
        'total_owed', b.total_owed,
        'net_balance', b.net_balance
      )
    ),
    '[]'::jsonb
  ) INTO _balances
  FROM public.balances b
  LEFT JOIN public.profiles p ON p.id = b.user_id
  WHERE b.group_id = p_group_id;

  -- 5. Pending settlements
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'group_id', s.group_id,
        'from_user', s.from_user,
        'to_user', s.to_user,
        'amount', s.amount,
        'status', s.status,
        'created_at', s.created_at,
        'from_profile', jsonb_build_object(
          'display_name', COALESCE(fp.display_name, fp.full_name, fp.username, 'User'),
          'username', fp.username,
          'avatar_url', COALESCE(fp.avatar_url, '')
        ),
        'to_profile', jsonb_build_object(
          'display_name', COALESCE(tp.display_name, tp.full_name, tp.username, 'User'),
          'username', tp.username,
          'avatar_url', COALESCE(tp.avatar_url, '')
        )
      ) ORDER BY s.created_at DESC
    ),
    '[]'::jsonb
  ) INTO _pending_settlements
  FROM public.settlements s
  LEFT JOIN public.profiles fp ON fp.id = s.from_user
  LEFT JOIN public.profiles tp ON tp.id = s.to_user
  WHERE s.group_id = p_group_id AND s.status = 'pending';

  -- 6. Completed/Approved settlements
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'group_id', s.group_id,
        'from_user', s.from_user,
        'to_user', s.to_user,
        'amount', s.amount,
        'status', 'completed',
        'created_at', s.created_at,
        'from_profile', jsonb_build_object(
          'display_name', COALESCE(fp.display_name, fp.full_name, fp.username, 'User'),
          'username', fp.username,
          'avatar_url', COALESCE(fp.avatar_url, '')
        ),
        'to_profile', jsonb_build_object(
          'display_name', COALESCE(tp.display_name, tp.full_name, tp.username, 'User'),
          'username', tp.username,
          'avatar_url', COALESCE(tp.avatar_url, '')
        )
      ) ORDER BY s.created_at DESC
    ),
    '[]'::jsonb
  ) INTO _completed_settlements
  FROM public.settlements s
  LEFT JOIN public.profiles fp ON fp.id = s.from_user
  LEFT JOIN public.profiles tp ON tp.id = s.to_user
  WHERE s.group_id = p_group_id AND s.status IN ('completed', 'approved');

  RETURN jsonb_build_object(
    'group', _group,
    'members', _members,
    'expenses', _expenses,
    'balances', _balances,
    'pending_settlements', _pending_settlements,
    'completed_settlements', _completed_settlements
  );
END;
$$;


-- =============================================================================
-- 4. FIX RPC: public.delete_my_account()
-- Fixes NOT NULL violation on group_members.user_id and ensures balances are
-- recalculated before checking outstanding debts.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _has_debt boolean;
  _g record;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Recalculate balances for all groups the user is part of first
  FOR _g IN
    SELECT DISTINCT group_id FROM public.group_members WHERE user_id = _uid
  LOOP
    PERFORM public.recalculate_group_balances(_g.group_id);
  END LOOP;

  -- 1. Check if user has any unsettled balances (threshold 0.01 for rounding)
  SELECT EXISTS (
    SELECT 1 FROM public.balances
    WHERE user_id = _uid
      AND ABS(net_balance) > 0.01
  ) INTO _has_debt;

  IF _has_debt THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'HAS_OUTSTANDING_DEBT',
      'message', 'You have unsettled balances. Please settle all debts before deleting your account.'
    );
  END IF;

  -- 2. Anonymize profile (keep the row so FKs in historical expenses stay valid)
  UPDATE public.profiles
  SET
    full_name    = '[Deleted User]',
    display_name = '[Deleted User]',
    username     = NULL,
    email        = NULL,
    avatar_url   = NULL,
    bio          = NULL,
    updated_at   = now()
  WHERE id = _uid;

  -- 3. Delete non-owner group memberships (fixes user_id NOT NULL constraint bug)
  DELETE FROM public.group_members
  WHERE user_id = _uid
    AND role <> 'owner';

  -- 4. Delete zero-balance records for the user
  DELETE FROM public.balances
  WHERE user_id = _uid;

  -- 5. Cancel any pending settlements involving this user
  UPDATE public.settlements
  SET status = 'rejected'
  WHERE (from_user = _uid OR to_user = _uid)
    AND status = 'pending';

  -- 6. Delete friendships
  DELETE FROM public.friendships
  WHERE requester_id = _uid OR receiver_id = _uid;

  -- 7. Delete notifications
  DELETE FROM public.notifications
  WHERE user_id = _uid;

  -- 8. Delete push subscriptions if table exists
  DELETE FROM public.push_subscriptions
  WHERE user_id = _uid;

  -- 9. Delete the auth.users entry
  DELETE FROM auth.users WHERE id = _uid;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- =============================================================================
-- 5. CREATE MISSING TABLE: public.push_subscriptions
-- Required by lib/push-notifications.ts
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS user_agent text;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_owner_all" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_owner_all"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- =============================================================================
-- 6. CONSOLIDATE DUPLICATE RLS POLICIES
-- Removes redundant overlapping policies while keeping clean member/owner rules
-- =============================================================================

DROP POLICY IF EXISTS "Group members can view balances" ON public.balances;
DROP POLICY IF EXISTS "Group members can update balances" ON public.balances;

DROP POLICY IF EXISTS "Group members can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Group members can create expenses" ON public.expenses;

DROP POLICY IF EXISTS "Expense splits follow expense access" ON public.expense_splits;
DROP POLICY IF EXISTS "Group members can create splits" ON public.expense_splits;

DROP POLICY IF EXISTS "Group members can view settlements" ON public.settlements;
DROP POLICY IF EXISTS "Group members can create settlements" ON public.settlements;

COMMIT;
