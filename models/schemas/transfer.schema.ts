import { z } from "zod";

export const transferPayloadSchema = z.object({
  source_account_id: z.string().uuid("Invalid source account ID"),
  destination_account_id: z.string().uuid("Invalid destination account ID"),
  amount: z.coerce.number().positive("Amount must be positive").multipleOf(0.01, "Amount cannot have more than 2 decimal places"),
  description: z.string().optional(),
});

export type TransferPayload = z.infer<typeof transferPayloadSchema>;