# FinTracK Dashboard (Supabase-Connected)

This project is a finance dashboard built with Next.js App Router and connected to Supabase for data, actions, and report export flows.

## What is connected to Supabase

The dashboard now uses Supabase-backed flows for:

- Dashboard snapshot loading
- Wallet actions (add funds, transfer)
- Transactions actions (add transaction)
- Goals actions (create goal, adjust plan)
- Settings actions (save settings, reset sessions/logout)
- Analytics export (JSON/CSV)

If Supabase env vars are missing, the app can fall back to static in-memory data for read-only dashboard rendering.

---

## 1) Install dependencies

Install project dependencies:

    npm install

---

## 2) Configure environment variables

Create `.env.local` in the project root with:

    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    DASHBOARD_DEFAULT_USER_ID=11111111-1111-1111-1111-111111111111

Optional (server/admin operations if you extend server-side privileged tasks):

    SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for current Supabase integration.
- `DASHBOARD_DEFAULT_USER_ID` is required by the dashboard repository/action flows unless you pass user ID via request header/query.
- Do not expose service role key in client-side code.

---

## 3) Create database schema and seed data in Supabase

Run the SQL script in your Supabase SQL Editor:

- `supabase/schema.sql`

This script creates:

- Enums:
  - `transaction_direction`
  - `action_shortcut_id`
  - `start_of_week`
- Tables:
  - `balance_summaries`
  - `action_shortcuts`
  - `weekly_trend_points`
  - `spending_breakdown_items`
  - `financial_goals`
  - `transactions`
  - `daily_transaction_limits`
  - `linked_accounts`
  - `user_settings`
- Updated-at trigger function + per-table triggers
- RLS policies and grants
- Demo seed data for user:
  - `11111111-1111-1111-1111-111111111111`

---

## 4) Run the app

Start development server:

    npm run dev

Open:

    http://localhost:3000

Pages connected to Supabase-backed flows:

- `/` (Dashboard)
- `/wallet`
- `/transactions`
- `/goals`
- `/analytics`
- `/settings`

---

## 5) API endpoints (connected flows)

### Snapshot / Read

- `GET /api/dashboard/snapshot`
  - Query params:
    - `from` (optional, YYYY-MM-DD)
    - `to` (optional, YYYY-MM-DD)
    - `userId` (optional if default env/user header is provided)

### Wallet actions

- `POST /api/dashboard/actions/add-funds`
  - Body:
    - `amount` (required)
    - `accountId`, `category`, `title`, `occurredAt`, `userId` (optional)

- `POST /api/dashboard/actions/transfer`
  - Body:
    - `amount` (required)
    - `fromAccountId`, `toAccountId`, `title`, `category`, `occurredAt`, `userId` (optional)

### Transactions actions

- `POST /api/dashboard/actions/add-transaction`
  - Body:
    - `title` (required)
    - `category` (required)
    - `direction` (required: `income | expense | transfer`)
    - `amount` (required)
    - `accountId`, `occurredAt`, `userId` (optional)

### Goals actions

- `POST /api/dashboard/actions/create-goal`
  - Body:
    - `name` (required)
    - `target` (required)
    - `deadline` (required)
    - `saved`, `userId` (optional)

- `POST /api/dashboard/actions/adjust-plan`
  - Body:
    - `goalId` (required)
    - At least one of:
      - `addSavedAmount`
      - `monthlyContribution`
      - `newTarget`
      - `newDeadline`
    - `userId` (optional)

### Settings / Session actions

- `POST /api/dashboard/actions/save-settings`
  - Body sections (at least one required):
    - `profile`
    - `preferences`
    - `toggles`
    - plus optional `userId`

- `POST /api/dashboard/actions/reset-sessions`
  - Body:
    - optional `userId`

### Export

- `GET /api/dashboard/export`
  - Query params:
    - `format` (`json` or `csv`)
    - `from`, `to`, `userId` (optional)

---

## 6) User ID resolution behavior

The app resolves dashboard user ID in this order:

1. `requestedUserId` from payload/query usage
2. Request header: `x-dashboard-user-id`
3. Query param: `userId`
4. Env fallback: `DASHBOARD_DEFAULT_USER_ID`

If no valid user ID can be resolved, request/action handlers return an error.

---

## 7) Supabase client structure

Shared helpers are in:

- `src/shared/supabase/env.ts`
- `src/shared/supabase/server-client.ts`
- `src/shared/supabase/browser-client.ts`
- `src/shared/supabase/database.types.ts`

Dashboard Supabase repository/services:

- `src/features/dashboard/infrastructure/supabase/supabase-dashboard-repository.ts`
- `src/features/dashboard/infrastructure/supabase/services/dashboard-action-service.ts`
- `src/features/dashboard/infrastructure/supabase/dashboard-user.ts`

---

## 8) Troubleshooting

- Missing env vars:
  - Verify `.env.local` values and restart dev server.
- 400 errors on actions:
  - Confirm required body fields and valid date formats.
- No data visible:
  - Ensure `supabase/schema.sql` was executed successfully.
  - Ensure `DASHBOARD_DEFAULT_USER_ID` matches seeded/default user.
- Session reset behavior:
  - Current flow signs out current session and redirects to `/`.

---

## 9) Security note

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose it in client-rendered code or public runtime variables.