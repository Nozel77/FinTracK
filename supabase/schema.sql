-- Supabase schema + seed for dashboard-financial-tracking
-- This script is idempotent and can be re-run safely.

begin;

create extension if not exists pgcrypto;

-- =========================
-- Enums
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_direction') then
    create type public.transaction_direction as enum ('income', 'expense', 'transfer');
  end if;

  if not exists (select 1 from pg_type where typname = 'action_shortcut_id') then
    create type public.action_shortcut_id as enum ('deposit', 'transfer');
  end if;

  if not exists (select 1 from pg_type where typname = 'start_of_week') then
    create type public.start_of_week as enum ('Monday', 'Sunday');
  end if;
end $$;

-- =========================
-- Shared trigger
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- Tables
-- =========================

create table if not exists public.balance_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  period_from date not null,
  period_to date not null,
  currency text not null default 'IDR' check (currency = 'IDR'),
  total_balance numeric(14,2) not null default 0 check (total_balance >= 0),
  monthly_income numeric(14,2) not null default 0 check (monthly_income >= 0),
  monthly_expense numeric(14,2) not null default 0 check (monthly_expense >= 0),
  available_to_spend numeric(14,2) not null default 0 check (available_to_spend >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint balance_summaries_period_check check (period_from <= period_to),
  constraint balance_summaries_user_period_unique unique (user_id, period_from, period_to)
);

create table if not exists public.action_shortcuts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  shortcut_id public.action_shortcut_id not null,
  label text not null check (length(trim(label)) > 0),
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint action_shortcuts_user_shortcut_unique unique (user_id, shortcut_id)
);

create table if not exists public.weekly_trend_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  period_from date not null,
  period_to date not null,
  label text not null check (length(trim(label)) > 0),
  income numeric(14,2) not null default 0 check (income >= 0),
  expense numeric(14,2) not null default 0 check (expense >= 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_trend_points_period_check check (period_from <= period_to),
  constraint weekly_trend_points_unique unique (user_id, period_from, period_to, label)
);

create table if not exists public.spending_breakdown_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  period_from date not null,
  period_to date not null,
  category text not null check (length(trim(category)) > 0),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  percentage numeric(5,2) not null default 0 check (percentage >= 0 and percentage <= 100),
  color_hex text not null check (color_hex ~* '^#([0-9a-f]{6})$'),
  currency text not null default 'IDR' check (currency = 'IDR'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spending_breakdown_period_check check (period_from <= period_to),
  constraint spending_breakdown_unique unique (user_id, period_from, period_to, category)
);

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  deadline date not null,
  saved numeric(14,2) not null default 0 check (saved >= 0),
  target numeric(14,2) not null check (target > 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null check (length(trim(title)) > 0),
  category text not null check (length(trim(category)) > 0),
  direction public.transaction_direction not null,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_transaction_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  used numeric(14,2) not null default 0 check (used >= 0),
  "limit" numeric(14,2) not null check ("limit" > 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_transaction_limits_unique unique (user_id, date)
);

create table if not exists public.linked_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  masked_number text not null check (length(trim(masked_number)) > 0),
  balance numeric(14,2) not null default 0 check (balance >= 0),
  currency text not null default 'IDR' check (currency = 'IDR'),
  accent_color text null check (accent_color is null or accent_color ~* '^#([0-9a-f]{6})$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint linked_accounts_unique_mask unique (user_id, masked_number)
);

create table if not exists public.user_settings (
  user_id uuid primary key,
  full_name text not null check (length(trim(full_name)) > 0),
  email text not null check (position('@' in email) > 1),
  phone text not null default '-',
  role text not null default 'Owner',
  currency text not null default 'IDR',
  timezone text not null default 'UTC+07:00 (Jakarta)',
  language text not null default 'English (US)',
  start_of_week public.start_of_week not null default 'Monday',
  email_alerts boolean not null default true,
  push_notifications boolean not null default true,
  monthly_report boolean not null default false,
  compact_mode boolean not null default false,
  daily_transaction_limit numeric(14,2) not null default 10000000 check (daily_transaction_limit > 0),
  monthly_debt_installment numeric(14,2) not null default 0 check (monthly_debt_installment >= 0),
  emergency_fund_balance numeric(14,2) not null default 0 check (emergency_fund_balance >= 0),
  updated_at timestamptz not null default now()
);

-- =========================
-- User settings backfill (safe for existing databases)
-- =========================
alter table public.user_settings
  add column if not exists daily_transaction_limit numeric(14,2);

alter table public.user_settings
  add column if not exists monthly_debt_installment numeric(14,2);

alter table public.user_settings
  add column if not exists emergency_fund_balance numeric(14,2);

update public.user_settings
set
  daily_transaction_limit = case
    when daily_transaction_limit is null or daily_transaction_limit <= 0 then 10000000
    else daily_transaction_limit
  end,
  monthly_debt_installment = case
    when monthly_debt_installment is null or monthly_debt_installment < 0 then 0
    else monthly_debt_installment
  end,
  emergency_fund_balance = case
    when emergency_fund_balance is null or emergency_fund_balance < 0 then 0
    else emergency_fund_balance
  end
where
  daily_transaction_limit is null or daily_transaction_limit <= 0
  or monthly_debt_installment is null or monthly_debt_installment < 0
  or emergency_fund_balance is null or emergency_fund_balance < 0;

alter table public.user_settings
  alter column daily_transaction_limit set default 10000000;

alter table public.user_settings
  alter column monthly_debt_installment set default 0;

alter table public.user_settings
  alter column emergency_fund_balance set default 0;

alter table public.user_settings
  alter column daily_transaction_limit set not null;

alter table public.user_settings
  alter column monthly_debt_installment set not null;

alter table public.user_settings
  alter column emergency_fund_balance set not null;

alter table public.user_settings
  drop constraint if exists user_settings_daily_transaction_limit_check;

alter table public.user_settings
  drop constraint if exists user_settings_monthly_debt_installment_check;

alter table public.user_settings
  drop constraint if exists user_settings_emergency_fund_balance_check;

alter table public.user_settings
  add constraint user_settings_daily_transaction_limit_check
  check (daily_transaction_limit > 0);

alter table public.user_settings
  add constraint user_settings_monthly_debt_installment_check
  check (monthly_debt_installment >= 0);

alter table public.user_settings
  add constraint user_settings_emergency_fund_balance_check
  check (emergency_fund_balance >= 0);

-- =========================
-- Indexes
-- =========================
create index if not exists idx_balance_summaries_user_period on public.balance_summaries(user_id, period_from, period_to);
create index if not exists idx_action_shortcuts_user_sort on public.action_shortcuts(user_id, sort_order);
create index if not exists idx_weekly_trend_user_period_sort on public.weekly_trend_points(user_id, period_from, period_to, sort_order);
create index if not exists idx_spending_breakdown_user_period_sort on public.spending_breakdown_items(user_id, period_from, period_to, sort_order);
create index if not exists idx_financial_goals_user_deadline on public.financial_goals(user_id, deadline);
create index if not exists idx_transactions_user_occurred_at on public.transactions(user_id, occurred_at desc);
create index if not exists idx_transactions_user_direction_occurred_at on public.transactions(user_id, direction, occurred_at desc);
create index if not exists idx_daily_limits_user_date on public.daily_transaction_limits(user_id, date desc);
create index if not exists idx_linked_accounts_user_sort on public.linked_accounts(user_id, sort_order);

-- =========================
-- Triggers
-- =========================
drop trigger if exists trg_balance_summaries_updated_at on public.balance_summaries;
create trigger trg_balance_summaries_updated_at
before update on public.balance_summaries
for each row execute function public.set_updated_at();

drop trigger if exists trg_action_shortcuts_updated_at on public.action_shortcuts;
create trigger trg_action_shortcuts_updated_at
before update on public.action_shortcuts
for each row execute function public.set_updated_at();

drop trigger if exists trg_weekly_trend_points_updated_at on public.weekly_trend_points;
create trigger trg_weekly_trend_points_updated_at
before update on public.weekly_trend_points
for each row execute function public.set_updated_at();

drop trigger if exists trg_spending_breakdown_items_updated_at on public.spending_breakdown_items;
create trigger trg_spending_breakdown_items_updated_at
before update on public.spending_breakdown_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_financial_goals_updated_at on public.financial_goals;
create trigger trg_financial_goals_updated_at
before update on public.financial_goals
for each row execute function public.set_updated_at();

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists trg_daily_transaction_limits_updated_at on public.daily_transaction_limits;
create trigger trg_daily_transaction_limits_updated_at
before update on public.daily_transaction_limits
for each row execute function public.set_updated_at();

drop trigger if exists trg_linked_accounts_updated_at on public.linked_accounts;
create trigger trg_linked_accounts_updated_at
before update on public.linked_accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

-- =========================
-- RLS
-- =========================
alter table public.balance_summaries enable row level security;
alter table public.action_shortcuts enable row level security;
alter table public.weekly_trend_points enable row level security;
alter table public.spending_breakdown_items enable row level security;
alter table public.financial_goals enable row level security;
alter table public.transactions enable row level security;
alter table public.daily_transaction_limits enable row level security;
alter table public.linked_accounts enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "balance_summaries_owner_all" on public.balance_summaries;
create policy "balance_summaries_owner_all" on public.balance_summaries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "action_shortcuts_owner_all" on public.action_shortcuts;
create policy "action_shortcuts_owner_all" on public.action_shortcuts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "weekly_trend_points_owner_all" on public.weekly_trend_points;
create policy "weekly_trend_points_owner_all" on public.weekly_trend_points
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "spending_breakdown_items_owner_all" on public.spending_breakdown_items;
create policy "spending_breakdown_items_owner_all" on public.spending_breakdown_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "financial_goals_owner_all" on public.financial_goals;
create policy "financial_goals_owner_all" on public.financial_goals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions_owner_all" on public.transactions;
create policy "transactions_owner_all" on public.transactions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily_transaction_limits_owner_all" on public.daily_transaction_limits;
create policy "daily_transaction_limits_owner_all" on public.daily_transaction_limits
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "linked_accounts_owner_all" on public.linked_accounts;
create policy "linked_accounts_owner_all" on public.linked_accounts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_settings_owner_all" on public.user_settings;
create policy "user_settings_owner_all" on public.user_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- Grants
-- =========================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;

-- =========================
-- Seed data (demo)
-- =========================
do $$
declare
  v_user_id uuid := '11111111-1111-1111-1111-111111111111';
  v_from date := date_trunc('month', now())::date;
  v_to date := (date_trunc('month', now()) + interval '1 month - 1 day')::date;
begin
  -- user settings
  insert into public.user_settings (
    user_id, full_name, email, phone, role, currency, timezone, language, start_of_week,
    email_alerts, push_notifications, monthly_report, compact_mode, daily_transaction_limit,
    monthly_debt_installment, emergency_fund_balance, updated_at
  ) values (
    v_user_id, 'Alex Morgan', 'alex.morgan@fintrack.app', '+62 812-0000-0000', 'Owner',
    'IDR', 'UTC+07:00 (Jakarta)', 'English (US)', 'Monday',
    true, true, false, false, 10000000, 12500000, 120000000, now()
  )
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    role = excluded.role,
    currency = excluded.currency,
    timezone = excluded.timezone,
    language = excluded.language,
    start_of_week = excluded.start_of_week,
    email_alerts = excluded.email_alerts,
    push_notifications = excluded.push_notifications,
    monthly_report = excluded.monthly_report,
    compact_mode = excluded.compact_mode,
    daily_transaction_limit = excluded.daily_transaction_limit,
    monthly_debt_installment = excluded.monthly_debt_installment,
    emergency_fund_balance = excluded.emergency_fund_balance,
    updated_at = now();

  -- shortcuts
  insert into public.action_shortcuts (user_id, shortcut_id, label, is_primary, sort_order)
  values
    (v_user_id, 'deposit', 'Deposit', false, 1),
    (v_user_id, 'transfer', 'Transfer', true, 2)
  on conflict (user_id, shortcut_id) do update set
    label = excluded.label,
    is_primary = excluded.is_primary,
    sort_order = excluded.sort_order,
    updated_at = now();

  -- linked accounts
  insert into public.linked_accounts (user_id, name, masked_number, balance, currency, accent_color, sort_order)
  values
    (v_user_id, 'Primary checking', '**** 3412', 245600000, 'IDR', '#0f9f6e', 1),
    (v_user_id, 'Savings vault',    '**** 8890',  52600000, 'IDR', '#14b87a', 2),
    (v_user_id, 'Bills account',    '**** 2201',  31600000, 'IDR', '#86efac', 3)
  on conflict (user_id, masked_number) do update set
    name = excluded.name,
    balance = excluded.balance,
    currency = excluded.currency,
    accent_color = excluded.accent_color,
    sort_order = excluded.sort_order,
    updated_at = now();

  -- goals
  insert into public.financial_goals (id, user_id, name, deadline, saved, target, currency)
  values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', v_user_id, 'Buy iPhone 15', current_date + interval '30 day',  3600000,   12000000, 'IDR'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', v_user_id, 'Trip to Spain', current_date + interval '120 day', 32600000,  36000000, 'IDR'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', v_user_id, 'For a new house', current_date + interval '365 day', 1203000000, 1800000000, 'IDR')
  on conflict (id) do update set
    user_id = excluded.user_id,
    name = excluded.name,
    deadline = excluded.deadline,
    saved = excluded.saved,
    target = excluded.target,
    currency = excluded.currency,
    updated_at = now();

  -- transactions
  insert into public.transactions (id, user_id, title, category, direction, amount, currency, occurred_at)
  values
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', v_user_id, 'Salary',              'Income',    'income',   32000000, 'IDR', now() - interval '1 day'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', v_user_id, 'Grocery Store',       'Food',      'expense',   1320000, 'IDR', now() - interval '18 hours'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', v_user_id, 'Internet Bill',       'Utilities', 'expense',    580000, 'IDR', now() - interval '2 days'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', v_user_id, 'Transfer to Savings', 'Savings',   'transfer',  5000000, 'IDR', now() - interval '3 days')
  on conflict (id) do update set
    user_id = excluded.user_id,
    title = excluded.title,
    category = excluded.category,
    direction = excluded.direction,
    amount = excluded.amount,
    currency = excluded.currency,
    occurred_at = excluded.occurred_at,
    updated_at = now();

  -- daily limit
  insert into public.daily_transaction_limits (user_id, date, used, "limit", currency)
  values (v_user_id, current_date, 4200000, 10000000, 'IDR')
  on conflict (user_id, date) do update set
    used = excluded.used,
    "limit" = excluded."limit",
    currency = excluded.currency,
    updated_at = now();

  -- weekly trend
  insert into public.weekly_trend_points (user_id, period_from, period_to, label, income, expense, currency, sort_order)
  values
    (v_user_id, v_from, v_to, 'Mon',  8500000, 3000000, 'IDR', 1),
    (v_user_id, v_from, v_to, 'Tue', 12000000, 5400000, 'IDR', 2),
    (v_user_id, v_from, v_to, 'Wed',  9400000, 4200000, 'IDR', 3),
    (v_user_id, v_from, v_to, 'Thu', 15100000, 6800000, 'IDR', 4),
    (v_user_id, v_from, v_to, 'Fri',  9900000, 3500000, 'IDR', 5),
    (v_user_id, v_from, v_to, 'Sat',  7000000, 2800000, 'IDR', 6),
    (v_user_id, v_from, v_to, 'Sun', 12300000, 5900000, 'IDR', 7)
  on conflict (user_id, period_from, period_to, label) do update set
    income = excluded.income,
    expense = excluded.expense,
    currency = excluded.currency,
    sort_order = excluded.sort_order,
    updated_at = now();

  -- spending breakdown
  insert into public.spending_breakdown_items (user_id, period_from, period_to, category, amount, percentage, color_hex, currency, sort_order)
  values
    (v_user_id, v_from, v_to, 'Housing',   14500000, 46, '#FFF27A', 'IDR', 1),
    (v_user_id, v_from, v_to, 'Food',       7200000, 23, '#FB5D5D', 'IDR', 2),
    (v_user_id, v_from, v_to, 'Transport',  4300000, 14, '#5BC4FF', 'IDR', 3),
    (v_user_id, v_from, v_to, 'Utilities',  3200000, 10, '#8F7CFF', 'IDR', 4),
    (v_user_id, v_from, v_to, 'Other',      2400000,  7, '#7ED7A6', 'IDR', 5)
  on conflict (user_id, period_from, period_to, category) do update set
    amount = excluded.amount,
    percentage = excluded.percentage,
    color_hex = excluded.color_hex,
    currency = excluded.currency,
    sort_order = excluded.sort_order,
    updated_at = now();

  -- balance summary
  insert into public.balance_summaries (
    user_id, period_from, period_to, currency, total_balance, monthly_income, monthly_expense, available_to_spend
  ) values (
    v_user_id, v_from, v_to, 'IDR', 245600000, 84200000, 31600000, 52600000
  )
  on conflict (user_id, period_from, period_to) do update set
    total_balance = excluded.total_balance,
    monthly_income = excluded.monthly_income,
    monthly_expense = excluded.monthly_expense,
    available_to_spend = excluded.available_to_spend,
    currency = excluded.currency,
    updated_at = now();
end $$;

commit;
