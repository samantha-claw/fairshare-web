# FairShare Full-Stack Remediation & Balance Synchronization Plan

This plan resolves all runtime mismatches between the FairShare Next.js frontend and the Supabase PostgreSQL backend, restores the `balances` table as an accurate source of truth across all expense and settlement lifecycles, completes missing group invite and notification flows, and finalizes bilingual (English/Arabic) localization.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Direction from Review:**
> - **Database & Frontend Delivery**: We will update all Next.js frontend/hook code directly and generate a complete, idempotent **Supabase SQL Migration Script** that you can run in your Supabase SQL Editor.
> - **Authoritative `balances` Table**: Right now, the app computes group balances on the fly in the Group Detail view (which shows the right numbers), while the database `balances` table drifts out of sync whenever expenses are edited, deleted, or split unevenly. We will replace the broken incremental triggers with an authoritative, atomic **Group Balance Recalculation Engine** in PostgreSQL (`recalculate_group_balances`) that triggers automatically on any change to `expenses`, `expense_splits`, or `settlements`, and immediately backfills all existing groups so the `balances` table is 100% accurate everywhere (Dashboard, Profile, and Group views).
> - **Full Scope Included**: All 4 audit categories (Database/RPC/Balances, `/join` Invite Route & QR Scanner, Notification Navigation & Web Push, and Complete EN/AR i18n Translations) will be implemented.

---

### 1. Overview & Core Concept

- **What It Does**: FairShare is a bilingual (English/Arabic) social expense-splitting and debt-simplification platform where friends and groups track shared expenses, simplify multi-party debts into minimum payments, settle balances with recipient approval, and join groups via QR codes or invite links.
- **Target Audience / Persona**: Friends, roommates, and travel companions managing shared finances across desktop and mobile devices in both LTR (English) and RTL (Arabic) layouts.
- **Key Value**: Eliminates silent runtime failures (broken settlement requests, drifting balance tables, 404 invite links, dead notification clicks, and untranslated strings) so every financial ledger entry is mathematically consistent across the database and UI.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Expense & Balance Lifecycle**: When a user creates, edits, or deletes an expense (with equal, exact, percentage, or share splits) or approves a settlement, the database atomically recalculates every member's `total_paid`, `total_owed`, and `net_balance` (`total_paid - total_owed`) in the `balances` table. Dashboard widgets, Profile statistics, Group Bento cards, and the Group Overview/Settle tabs all display identical, accurate numbers.
  2. **QR & Link Group Invite Flow (`/join`)**: Scanning a group QR code or opening a shared `/join?id=<group_id>&token=<invite_token>` link routes the user to a dedicated invite verification screen (or opens the Join Group confirmation modal inside the dashboard), validates the token via `verify_group_invite_token`, and joins via `join_group_with_token`.
  3. **Actionable Notifications**: Clicking any notification in the Notification Bell popover or the Notifications page marks it as read and navigates directly to the relevant Group, Expense, Settlement tab, or Friends request view using the notification's `data` payload (`group_id`, `settlement_id`, `friendship_id`).
  4. **Seamless Bilingual Experience (EN / AR)**: Every toast message, error banner, password requirement checklist, and modal across Settings, Groups, Friends, and Profile respects the active locale (`en` or `ar`) with proper RTL alignment and tabular numerals.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-craft financial SaaS UI with clean bento cards, crisp 1px borders, and semantic financial status indicators.
  - *Color Palette & Mood*: Preserves the existing adaptive Light/Dark theme tokens (`--background`, `--card`, `--primary`, `--border`) with semantic Emerald (`emerald-500`) for positive/owed-to-you balances, Rose (`rose-500`) for negative/you-owe balances, and Amber (`amber-500`) for pending settlements.
  - *Typography & Hierarchy*: Tabular numerals (`tabular-nums`) enforced on all currency and balance figures so ledger columns align vertically in both English and Arabic.
  - *Component Styling & Layout*: Responsive Bento grid dashboard and tabbed group workspace with accessible modal dialogs and smooth `motion/react` transitions.

- **Interactive Feedback & Motion**:
  - Optimistic UI updates paired with Supabase Realtime channel listeners on `expenses`, `expense_splits`, `settlements`, and `balances`.
  - Localized toast notifications on every mutation (create/edit/delete expense, send/approve/reject/cancel settlement, profile & settings updates).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Authoritative Set-Based Balance Recalculation vs. Incremental Delta Triggers**
  - *Chosen Approach*: Replace incremental `+ / -` trigger math with a deterministic set-based PostgreSQL function `recalculate_group_balances(_group_id uuid)` invoked by triggers on `expenses`, `expense_splits`, and `settlements`, plus a one-time backfill across all existing groups.
  - *Why*: Incremental triggers drift whenever an expense amount changes, a payer is reassigned, splits are edited, or an expense is deleted. A set-based recalculation sums actual `expenses.amount` (plus approved `settlements` paid) and `expense_splits.owed_amount` (plus approved `settlements` received) for every member in the group, guaranteeing that the `balances` table always matches the exact numbers shown in the Group view and `debt-simplifier`.
  - *Alternatives Considered*: Calculating balances purely in the browser on every page load was rejected because the Dashboard and Profile pages need fast, pre-aggregated queries across all of a user's groups without downloading thousands of historical expense splits, and `delete_my_account` relies on the `balances` table to block account deletion when debts exist.

- **Decision 2: Atomic Settlement RPC (`create_settlement`) & Expenses Pagination**
  - *Chosen Approach*: Provide the missing `create_settlement` RPC function in SQL while also hardening the frontend hook with clear error handling, and fix the `AllExpensesModal` query to fetch all group expenses with their `expense_splits` and `profiles!expenses_paid_by_fkey` join.
  - *Why*: The `expenses` table does not have a `deleted_at` column (deletions are hard deletes in this schema), so removing `.is("deleted_at", null)` from `AllExpensesModal` immediately fixes the broken "View All Expenses" modal without altering the table structure.

- **Decision 3: Dedicated `/join` Invite Route + QR Scanner Normalization**
  - *Chosen Approach*: Create the missing localized `/join` page that reads `id` and `token` query parameters, checks authentication (redirecting unauthenticated users to login while preserving the invite return URL), and renders the `JoinGroupConfirmModal` experience. Update the QR scanner to handle both `/join?id=...&token=...` and `/dashboard/groups?...` URLs seamlessly.
  - *Why*: Shared links and QR codes generated by `QrShareModal` point to `/join?id=...&token=...`. Supporting this route directly ensures external links and in-app QR scans work identically.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

#### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        FairShare Next.js Client (EN / AR)                  │
├──────────────────────┬─────────────────────────┬───────────────────────────┤
│  Invite & QR Flows   │   Group & Ledger Views  │  Dashboard & Profile      │
│  ┌────────────────┐  │  ┌───────────────────┐  │  ┌─────────────────────┐  │
│  │ /[locale]/join │  │  │ Group Detail Tabs │  │  │ Dashboard Overview  │  │
│  │ QrShareModal   │  │  │ AllExpensesModal  │  │  │ GroupsBentoGrid     │  │
│  │ QrScannerModal │  │  │ Settle / Activity │  │  │ Notifications / Bell│  │
│  └───────┬────────┘  │  └─────────┬─────────┘  │  └──────────┬──────────┘  │
└──────────┼───────────┴────────────┼──────────────────────────┼─────────────┘
           │                        │                          │
           ▼                        ▼                          ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     Custom React Data & Mutation Hooks                     │
│  • useGroupSettlements (calls create_settlement RPC & status updates)      │
│  • useGroupExpenses (atomic expense + splits insert/update/delete)         │
│  • useGroupData & useDashboard (reads authoritative balances & activity)   │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │ Supabase JS / SSR Client
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL Database & RPC Layer                 │
├───────────────────────────────────┬────────────────────────────────────────┤
│  Authoritative RPC Functions      │  Automated Balance & Activity Triggers │
│  • create_settlement(...)         │  • trg_sync_balances_on_expense        │
│  • recalculate_group_balances(id) │  • trg_sync_balances_on_splits         │
│  • join_group_with_token(...)     │  • trg_sync_balances_on_settlement     │
│  • verify_group_invite_token(...) │    └─► Updates public.balances table   │
│  • delete_my_account() (fixed)    │        (total_paid, total_owed,        │
│  • push_subscriptions table + RLS │         net_balance) + backfill all    │
└───────────────────────────────────┴────────────────────────────────────────┘
```

#### Data Model & State Synchronization

1. **Authoritative `public.balances` Calculation Formula**:
   For each member `u` in group `g`:
   - `expense_paid` = `COALESCE(SUM(expenses.amount) WHERE group_id = g AND paid_by = u, 0)`
   - `expense_owed` = `COALESCE(SUM(expense_splits.owed_amount) JOIN expenses WHERE group_id = g AND user_id = u, 0)`
   - `settlement_paid` = `COALESCE(SUM(settlements.amount) WHERE group_id = g AND from_user = u AND status = 'approved', 0)`
   - `settlement_received` = `COALESCE(SUM(settlements.amount) WHERE group_id = g AND to_user = u AND status = 'approved', 0)`
   - **`total_paid`** = `expense_paid + settlement_paid`
   - **`total_owed`** = `expense_owed + settlement_received`
   - **`net_balance`** = `ROUND((expense_paid - expense_owed + settlement_paid - settlement_received)::numeric, 2)`
   - Whenever any expense, expense split, or settlement is inserted, updated, or deleted, `recalculate_group_balances(group_id)` upserts the exact rows in `public.balances` for all members of that group.

2. **Database Migration Script Deliverables**:
   - **Fix `public.balances` Triggers & Backfill**: Drop the broken `update_balances_on_expense`, `update_balances_on_split`, and `update_balances_on_settlement` functions/triggers, replace them with `recalculate_group_balances(_group_id uuid)` and unified `AFTER INSERT OR UPDATE OR DELETE` triggers on `expenses`, `expense_splits`, and `settlements`, and execute a full backfill across all existing groups.
   - **Add `create_settlement` RPC**: Validates group membership, positive amount, and self-payment prevention, inserts the pending settlement, logs to `activity_log`, and creates a notification for the recipient.
   - **Fix `delete_my_account()` RPC**: Replace invalid `SET user_id = NULL` on `group_members` with `DELETE FROM public.group_members WHERE user_id = _uid AND role <> 'owner'` so account deletion succeeds without NOT NULL constraint violations.
   - **Create `push_subscriptions` Table & RLS**: Add the missing table (`id`, `user_id`, `endpoint`, `p256dh`, `auth`, `created_at`, `updated_at` with unique `(user_id, endpoint)`) and owner RLS policy so Web Push opt-in works without errors.
   - **Consolidate Duplicate RLS Policies**: Clean up redundant policies on `balances`, `expenses`, `expense_splits`, `groups`, `group_members`, `profiles`, `settlements`, and `notifications`.

#### Interactive Component & State Mapping

- **`AllExpensesModal`**: Remove the non-existent `.is("deleted_at", null)` filter so opening "View All Expenses" loads paginated group expenses and splits cleanly.
- **Group Invite Route (`/[locale]/join`)**: New page component that extracts `id` and `token` from URL search params, verifies authentication, and displays the `JoinGroupConfirmModal` flow with automatic redirect to the group upon joining.
- **`NotificationBell` & `NotificationsPage`**: Add click routing handler that reads `notification.type` and `notification.data` (`group_id`, `settlement_id`, `friendship_id`) to navigate the user to `/dashboard/groups/[group_id]` (or `/dashboard/friends` for friend requests) and marks the notification as read.
- **Realtime & Balance Consistency (`use-group-realtime.ts` & `use-dashboard.ts`)**: Subscribe to `expense_splits` and `balances` changes in addition to `expenses` and `settlements`, and ensure `useDashboard` reads the freshly synchronized `balances` table.
- **Full Localization Pass (`messages/en.json`, `messages/ar.json`, Settings, and Hooks)**: Add missing translation keys for Settings email/password/danger-zone statuses, toast messages in hooks, and aria labels, ensuring 100% parity between English and Arabic.
