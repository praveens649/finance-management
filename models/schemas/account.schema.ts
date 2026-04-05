import { z } from "zod";

export const AccountTypeEnum = z.enum(["cash", "bank", "wallet"]);


export const accountSchema = z.object({
  id: z.string().uuid("Invalid account ID format"),
  user_id: z.string().uuid("Invalid user ID format"),
  
  name: z.string().min(1, "Account name is required").max(100, "Account name is too long"),
  type: AccountTypeEnum,
  
  balance: z.coerce.number()
    .finite()
    .refine((val) => Number(val.toFixed(2)) === val, "Balance cannot have more than 2 decimal places"),
    
  currency: z.string()
    .length(3, "Currency must be a valid 3-letter ISO code")
    .toUpperCase()
    .default("INR"),
    
  created_at: z.coerce.date(),
});

export type Account = z.infer<typeof accountSchema>;



export const createAccountSchema = accountSchema.pick({
  name: true,
  type: true,
}).extend({
  currency: z.string().length(3).toUpperCase().default("INR").optional(),
});

export type CreateAccountPayload = z.infer<typeof createAccountSchema>;


export const onboardAccountSchema = createAccountSchema.extend({
  initial_balance: z.coerce.number()
    .finite()
    .min(0, "Initial balance cannot be negative")
    .refine((val) => Number(val.toFixed(2)) === val, "Max 2 decimal places")
    .optional()
    .default(0),
});

export type OnboardAccountPayload = z.infer<typeof onboardAccountSchema>;



export const updateAccountSchema = accountSchema.pick({
  name: true,
}).partial();

export type UpdateAccountPayload = z.infer<typeof updateAccountSchema>;


