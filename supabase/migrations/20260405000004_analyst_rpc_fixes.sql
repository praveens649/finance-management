-- 20260405_analyst_rpc_fixes.sql

-- Recreate analyst RPC functions with explicit signatures and schema reload.

create or replace function public.get_monthly_stats()
returns table (
  month date,
  income numeric,
  expense numeric
)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc('month', created_at)::date as month,
    coalesce(sum(case when type = 'credit' then amount else 0 end), 0) as income,
    coalesce(sum(case when type = 'debit' then amount else 0 end), 0) as expense
  from public.transactions
  group by date_trunc('month', created_at)
  order by month;
$$;

create or replace function public.get_category_breakdown()
returns table (
  category_id uuid,
  total numeric
)
language sql
security definer
set search_path = public
as $$
  select
    category_id,
    coalesce(sum(amount), 0) as total
  from public.transactions
  where type = 'debit'
  group by category_id
  order by total desc;
$$;

create or replace function public.get_global_summary()
returns table (
  total_income numeric,
  total_expense numeric
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(sum(case when type = 'credit' then amount else 0 end), 0) as total_income,
    coalesce(sum(case when type = 'debit' then amount else 0 end), 0) as total_expense
  from public.transactions;
$$;

grant execute on function public.get_monthly_stats() to authenticated;
grant execute on function public.get_category_breakdown() to authenticated;
grant execute on function public.get_global_summary() to authenticated;

-- Ask PostgREST to refresh schema cache immediately.
notify pgrst, 'reload schema';
