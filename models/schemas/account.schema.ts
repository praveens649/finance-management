import { z } from "zod";

// Define the valid enum for account types based on your DB schema comments
export const AccountTypeEnum = z.enum(["cash", "bank", "wallet"]);

/**
 * Base Account Schema
 * Represents the complete account object as returned by the database.
 */
export const accountSchema = z.object({
  id: z.string().uuid("Invalid account ID format"),
  user_id: z.string().uuid("Invalid user ID format"),
  
  // Account details
  name: z.string().min(1, "Account name is required").max(100, "Account name is too long"),
  type: AccountTypeEnum,
  
  // Financial data
  // Using a custom refine with .toFixed(2) prevents JS floating point math errors
  // (e.g. 1.14 * 100 evaluates to 113.99999999999999 in JS, which breaks Number.isInteger)
  balance: z.coerce.number()
    .finite()
    .refine((val) => Number(val.toFixed(2)) === val, "Balance cannot have more than 2 decimal places"),
    
  currency: z.string()
    .length(3, "Currency must be a valid 3-letter ISO code")
    .toUpperCase()
    .default("INR"),
    
  // Dates coming from Supabase are often returned as ISO strings
  created_at: z.coerce.date(),
});

// Auto-infer the TypeScript type for the full representation
export type Account = z.infer<typeof accountSchema>;


/**
 * Schema for Creating an Account from the UI
 * We omit system-generated fields.
 */
export const createAccountSchema = accountSchema.pick({
  name: true,
  type: true,
}).extend({
  currency: z.string().length(3).toUpperCase().default("INR").optional(),
});

export type CreateAccountPayload = z.infer<typeof createAccountSchema>;

/**
 * Schema for Onboarding Account Creation
 * Same as createAccountSchema but with an OPTIONAL initial_balance.
 *
 * CRITICAL RULE:
 * `initial_balance` is NOT directly written to accounts.balance.
 * If > 0, it becomes a separate `credit` transaction ("Initial balance").
 * The DB trigger then atomically updates the balance.
 */
export const onboardAccountSchema = createAccountSchema.extend({
  initial_balance: z.coerce.number()
    .finite()
    .min(0, "Initial balance cannot be negative")
    .refine((val) => Number(val.toFixed(2)) === val, "Max 2 decimal places")
    .optional()
    .default(0),
});

export type OnboardAccountPayload = z.infer<typeof onboardAccountSchema>;


/**
 * Schema for Updating an Account
 * 
 * CRITICAL RULE EXECUTED: 
 * We explicitly omit `balance` because updating a balance MUST be transactional. 
 * A UI update request should NEVER be allowed to simply PATCH a balance.
 */
export const updateAccountSchema = accountSchema.pick({
  name: true,
  // Type usually shouldn't change after creation without serious implications, 
  // but if you want to allow changing cash -> wallet, you can uncomment it.
  // type: true, 
}).partial();

export type UpdateAccountPayload = z.infer<typeof updateAccountSchema>;

// Your SQL schema block for reference (you should ideally move this to a Supabase migration file):
/*
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  name text not null,             -- "Savings", "Cash", "Bank"
  type text not null,             -- cash / bank / wallet

  balance numeric(12,2) default 0, -- careful with this
  currency text default 'INR',

  created_at timestamp default now()
);

-- Essential RLS setup
alter table accounts enable row level security;

create policy "Users can access their accounts"
on accounts
for all
using (auth.uid() = user_id);
*/