-- 20260405000000_align_analyst_admin_read_policies.sql
-- Align read policies with middleware/service behavior where analyst APIs can be accessed by analyst or admin.

-- ========================
-- PROFILES (read)
-- ========================
drop policy if exists "Analysts can view all profiles" on profiles;
create policy "Analyst and admin can view all profiles"
on profiles
for select
using (public.get_auth_role() in ('analyst', 'admin'));

-- ========================
-- ACCOUNTS (read)
-- ========================
drop policy if exists "Accounts select for user and analyst" on accounts;
create policy "Accounts select for user analyst admin"
on accounts
for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
      and profiles.role in ('analyst', 'admin')
  )
);

-- ========================
-- CATEGORIES (read)
-- ========================
drop policy if exists "Categories select for user and analyst" on categories;
create policy "Categories select for user analyst admin"
on categories
for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
      and profiles.role in ('analyst', 'admin')
  )
);

-- ========================
-- TRANSACTIONS (read)
-- ========================
drop policy if exists "Transactions select for user and analyst" on transactions;
create policy "Transactions select for user analyst admin"
on transactions
for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
      and profiles.role in ('analyst', 'admin')
  )
);
