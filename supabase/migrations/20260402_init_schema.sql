-- 20260402_init_schema.sql

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ========================
-- PROFILES
-- ========================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'user' check (role in ('user','analyst','admin')),
  is_active boolean default true,
  created_at timestamp default now()
);

-- ========================
-- ACCOUNTS
-- ========================
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  name text not null,
  type text not null check (type in ('cash','bank','wallet')),

  balance numeric(12,2) default 0,
  currency text default 'INR',

  created_at timestamp default now(),

  unique(user_id, name)
);

-- ========================
-- CATEGORIES
-- ========================
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  name text not null,
  type text not null check (type in ('income','expense')),

  created_at timestamp default now(),

  unique(user_id, name)
);

-- ========================
-- TRANSACTIONS
-- ========================
create table transactions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete cascade,
  account_id uuid references accounts(id) on delete cascade,
  category_id uuid references categories(id),

  type text not null check (type in ('credit','debit')),
  amount numeric(12,2) not null check (amount > 0),

  description text,
  created_at timestamp default now()
);