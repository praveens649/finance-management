import { z } from "zod";

export const TransactionTypeEnum = z.enum(["credit", "debit"]);


export const transactionSchema = z.object({
  id: z.string().uuid("Invalid transaction ID format"),
  
  user_id: z.string().uuid("Invalid user ID format"),
  account_id: z.string().uuid("Invalid account ID format"),
  category_id: z.string().uuid("Invalid category ID format").nullable(), 
  
  type: TransactionTypeEnum,
  
  amount: z.coerce.number().positive("Amount must be positive").multipleOf(0.01, "Amount cannot have more than 2 decimal places"),
  description: z.string().max(255).nullable().optional(),
  
  created_at: z.coerce.date(),
});

export type Transaction = z.infer<typeof transactionSchema>;


export const createTransactionSchema = transactionSchema.pick({
  account_id: true,
  category_id: true,
  type: true,
  amount: true,
  description: true,
});

export type CreateTransactionPayload = z.infer<typeof createTransactionSchema>;


export const updateTransactionSchema = transactionSchema.pick({
  category_id: true,
  description: true,
}).partial();

export type UpdateTransactionPayload = z.infer<typeof updateTransactionSchema>;



