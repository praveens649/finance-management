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
create policy "Users can manage their accounts"
on accounts for all using (auth.uid() = user_id);

create policy "Analysts can view all accounts"
on accounts for select using (public.get_auth_role() = 'analyst');

-- ========================
-- CATEGORIES
-- ========================
create policy "Users can manage their categories"
on categories for all using (auth.uid() = user_id);

create policy "Analysts can view all categories"
on categories for select using (public.get_auth_role() = 'analyst');

-- ========================
-- TRANSACTIONS
-- ========================
create policy "Users can manage their transactions"
on transactions for all using (auth.uid() = user_id);

create policy "Analysts can view all transactions"
on transactions for select using (public.get_auth_role() = 'analyst');