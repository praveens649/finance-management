-- 20260402_rls_policies.sql

-- Enable RLS
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

-- ========================
-- UTILITY FUNCTION
-- ========================
-- To prevent infinite recursion when querying `profiles` from within a `profiles` policy,
-- we use a security definer function to read the user role bypassing RLS.
create or replace function public.get_auth_role()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  user_role text;
begin
  select role into user_role from profiles where id = auth.uid();
  return user_role;
end;
$$;

-- ========================
-- PROFILES
-- ========================
create policy "Users can manage their profile"
on profiles for all using (auth.uid() = id);

create policy "Analysts can view all profiles"
on profiles for select using (public.get_auth_role() = 'analyst');

-- ========================
-- ACCOUNTS
-- ========================
drop policy if exists "Users can manage their accounts" on accounts;
drop policy if exists "Analysts can view all accounts" on accounts;

create policy "Accounts select for user and analyst"
on accounts
for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.role = 'analyst'
  )
);

create policy "Accounts insert only owner users"
on accounts
for insert
with check (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
);

create policy "Accounts update only owner users"
on accounts
for update
using (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
)
with check (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
);

create policy "Accounts delete only owner users"
on accounts
for delete
using (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
);

-- ========================
-- CATEGORIES
-- ========================
drop policy if exists "Users can manage their categories" on categories;
drop policy if exists "Analysts can view all categories" on categories;

create policy "Categories select for user and analyst"
on categories
for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.role = 'analyst'
  )
);

create policy "Categories insert only owner users"
on categories
for insert
with check (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
);

create policy "Categories update only owner users"
on categories
for update
using (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
)
with check (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
);

create policy "Categories delete only owner users"
on categories
for delete
using (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
);

-- ========================
-- TRANSACTIONS
-- ========================
drop policy if exists "Users can manage their transactions" on transactions;
drop policy if exists "Analysts can view all transactions" on transactions;

create policy "Transactions select for user and analyst"
on transactions
for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.role = 'analyst'
  )
);

create policy "Transactions insert only owner users"
on transactions
for insert
with check (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
);

create policy "Transactions update only owner users"
on transactions
for update
using (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
)
with check (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
);

create policy "Transactions delete only owner users"
on transactions
for delete
using (
  auth.uid() = user_id
  and public.get_auth_role() = 'user'
);