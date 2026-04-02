-- 20260402_analytics_rpc.sql

-- ========================
-- MONTHLY STATS AGGREGATION
-- ========================
create or replace function get_monthly_stats()
returns table (
  month date,
  income numeric,
  expense numeric
)
language sql
security definer set search_path = public
as $$
  select 
    date_trunc('month', created_at)::date as month,
    sum(case when type='credit' then amount else 0 end) as income,
    sum(case when type='debit' then amount else 0 end) as expense
  from transactions
  group by date_trunc('month', created_at)
  order by month desc;
$$;

-- ========================
-- USER-WISE AGGREGATION (For Analysts)
-- ========================
create or replace function get_user_aggregations()
returns table (
  user_id uuid,
  total_income numeric,
  total_expense numeric,
  transaction_count bigint
)
language sql
security definer set search_path = public
as $$
  select 
    user_id,
    sum(case when type='credit' then amount else 0 end) as total_income,
    sum(case when type='debit' then amount else 0 end) as total_expense,
    count(*) as transaction_count
  from transactions
  group by user_id
  order by total_income desc;
$$;
