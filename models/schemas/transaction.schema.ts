import { z } from "zod";

// Valid transaction types
export const TransactionTypeEnum = z.enum(["credit", "debit"]);

/**
 * Base Transaction Schema
 * Represents the complete transaction object as returned by the database.
 */
export const transactionSchema = z.object({
  id: z.string().uuid("Invalid transaction ID format"),
  
  user_id: z.string().uuid("Invalid user ID format"),
  account_id: z.string().uuid("Invalid account ID format"),
  // Some transactions like transfers or initial deposits might not have a category
  category_id: z.string().uuid("Invalid category ID format").nullable(), 
  
  type: TransactionTypeEnum,
  
  // We force amount to be positive here; the 'type' (credit/debit) dictates the math
  amount: z.coerce.number().positive("Amount must be positive").multipleOf(0.01, "Amount cannot have more than 2 decimal places"),
  description: z.string().max(255).nullable().optional(),
  
  created_at: z.coerce.date(),
});

export type Transaction = z.infer<typeof transactionSchema>;

/**
 * Schema for Creating a Transaction from the UI
 * Omits system-generated fields. user_id will be appended on the server side.
 */
export const createTransactionSchema = transactionSchema.pick({
  account_id: true,
  category_id: true,
  type: true,
  amount: true,
  description: true,
});

export type CreateTransactionPayload = z.infer<typeof createTransactionSchema>;

/**
 * Schema for Updating a Transaction
 * 
 * CRITICAL RULE: To maintain accounting integrity, modifying the `amount`, `account_id`, 
 * or `type` of a transaction after the fact is generally bad practice (it usually requires 
 * voiding and recreating).
 * Here, we only expose safe-to-update fields.
 */
export const updateTransactionSchema = transactionSchema.pick({
  category_id: true,
  description: true,
}).partial();

export type UpdateTransactionPayload = z.infer<typeof updateTransactionSchema>;

// ============================================================================
// CRITICAL DATABASE LOGIC: Atomic Balance Updates
// ============================================================================
// You mentioned: "If credit -> add, debit -> subtract. This must happen atomically"
// The safest way to guarantee this is NOT in your Next.js API, but using a Database Trigger.
// By running this SQL in Supabase, your database guarantees 100% consistency 
// between the transaction being saved and the balance updating.

/*
-- 1. Create the base table
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  account_id uuid references accounts(id) on delete cascade,
  category_id uuid references categories(id),
  type text not null, -- 'credit' / 'debit'
  amount numeric(12,2) not null check (amount > 0),
  description text,
  created_at timestamp default now()
);

-- 2. Create the Trigger Function to atomically update the accounts table
create or replace function handle_transaction_balance()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.type = 'credit' then
    update accounts 
    set balance = balance + NEW.amount
    where id = NEW.account_id;
  elsif NEW.type = 'debit' then
    update accounts 
    set balance = balance - NEW.amount
    where id = NEW.account_id;
  end if;

  return NEW;
end;
$$;

-- 3. Bind the trigger to the transactions table
create trigger on_transaction_created
  after insert on transactions
  for each row execute function handle_transaction_balance();
*/