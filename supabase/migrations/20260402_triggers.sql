-- 20260402_triggers.sql

-- ========================
-- FUNCTION
-- ========================
create or replace function handle_transaction_balance()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.type = 'credit' then
      update accounts
      set balance = balance + NEW.amount
      where id = NEW.account_id;
    elsif NEW.type = 'debit' then
      update accounts
      set balance = balance - NEW.amount
      where id = NEW.account_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.type = 'credit' then
      update accounts
      set balance = balance - OLD.amount
      where id = OLD.account_id;
    elsif OLD.type = 'debit' then
      update accounts
      set balance = balance + OLD.amount
      where id = OLD.account_id;
    end if;
  end if;

  return null;
end;
$$;

-- ========================
-- TRIGGERS
-- ========================
create trigger transaction_insert_trigger
after insert on transactions
for each row execute function handle_transaction_balance();

create trigger transaction_delete_trigger
after delete on transactions
for each row execute function handle_transaction_balance();

-- ========================
-- AUTOMATIC PROFILE CREATION
-- ========================
-- Listens to Supabase Auth API signups and automatically creates the profile row!
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();