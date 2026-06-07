-- ═══════════════════════════════════════════════════
-- Push Notifications Subscriptions Table
-- ═══════════════════════════════════════════════════
-- Stores per-device push subscriptions for each user
-- so we can send them notifications on events.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions(user_id);

-- RLS: users can only manage their own subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert their own push subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for sending pushes)
-- Note: backend functions run as SECURITY DEFINER; they don't need explicit policy

-- ═══════════════════════════════════════════════════
-- Optional: push_log table for debugging sent pushes
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.push_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'failed', 'invalid_endpoint'
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_log_user_id
  ON public.push_log(user_id);

CREATE INDEX IF NOT EXISTS idx_push_log_created_at
  ON public.push_log(created_at DESC);

-- RLS: users can read their own log
ALTER TABLE public.push_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own push log" ON public.push_log;
CREATE POLICY "Users can read their own push log"
  ON public.push_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════
-- VAPID configuration (server-side)
-- ═══════════════════════════════════════════════════
-- After running this migration, you need to:
-- 1. Generate VAPID keys (if you haven't yet):
--    node -e "const wp = require('web-push'); console.log(JSON.stringify(wp.generateVAPIDKeys()))"
-- 2. Store VAPID_PRIVATE_KEY and VAPID_SUBJECT in Supabase Edge Function secrets
-- 3. Update the public key in lib/push-notifications.ts (VAPID_PUBLIC_KEY constant)
-- 4. Deploy a Supabase Edge Function that:
--    - Listens to expenses/settlements/friend_requests inserts
--    - Looks up push_subscriptions for affected users
--    - Sends web-push with the payload
--    - Logs to push_log table

-- ═══════════════════════════════════════════════════
-- Sample trigger function (auto-notify on new expense)
-- ═══════════════════════════════════════════════════
-- This is a stub. Real implementation needs an Edge Function with
-- web-push library. Trigger below just creates a notification log entry.

CREATE OR REPLACE FUNCTION public.notify_expense_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark expense as "needs notification" — Edge Function will pick it up
  -- via Supabase Realtime or scheduled cron
  PERFORM 1; -- placeholder, real impl uses pg_net or similar
  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════
-- Migration complete
-- ═══════════════════════════════════════════════════
