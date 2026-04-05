import { SupabaseClient } from "@supabase/supabase-js";
import { transferPayloadSchema, TransferPayload } from "../schemas/transfer.schema";
import { requireActive, requireRole } from "./role.utils";
import { Profile } from "../schemas/profile.schema";

export function createTransferService(supabase: SupabaseClient) {
  return {
    async createTransfer(payload: TransferPayload) {
      try {
        const validPayload = transferPayloadSchema.parse(payload);

        if (validPayload.source_account_id === validPayload.destination_account_id) {
          return { success: false, error: "Cannot transfer to the same account." };
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          return { success: false, error: "Unauthorized access: Please log in." };
        }

        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (!profile) return { success: false, error: "Profile not found." };
        
        requireActive(profile as Profile);
        requireRole(profile as Profile, 'user');

        const { data: accounts, error: accountsError } = await supabase
          .from("accounts")
          .select("id, user_id, balance, currency, name")
          .in("id", [validPayload.source_account_id, validPayload.destination_account_id]);

        if (accountsError || !accounts || accounts.length !== 2) {
          return { success: false, error: "One or both accounts could not be found." };
        }

        const sourceAccount = accounts.find(a => a.id === validPayload.source_account_id);
        const destAccount = accounts.find(a => a.id === validPayload.destination_account_id);

        if (!sourceAccount || !destAccount) {
          return { success: false, error: "Account lookup mismatch." };
        }

        if (sourceAccount.user_id !== user.id || destAccount.user_id !== user.id) {
          return { success: false, error: "Security violation: Both accounts must belong to you to execute an internal transfer." };
        }

        if (sourceAccount.currency !== destAccount.currency) {
          return { success: false, error: `Currency mismatch: Cannot transfer directly between ${sourceAccount.currency} and ${destAccount.currency}.` };
        }

        if (sourceAccount.balance < validPayload.amount) {
          return { success: false, error: "Insufficient funds in the source account." };
        }

        const transferRefId = crypto.randomUUID();
        const refTag = `[TRF-${transferRefId.substring(0,8)}]`;

        const isSelfTransfer = sourceAccount.user_id === user.id && destAccount.user_id === user.id
          && sourceAccount.user_id === destAccount.user_id;

        
        const outDescription = isSelfTransfer
          ? `Self Transfer to ${destAccount.name} ${refTag}: ${validPayload.description || ''}`.trim()
          : `Transfer out ${refTag}: ${validPayload.description || ''}`.trim();

        const inDescription = isSelfTransfer
          ? `Self Transfer from ${sourceAccount.name} ${refTag}: ${validPayload.description || ''}`.trim()
          : `Transfer in ${refTag}: ${validPayload.description || ''}`.trim();

        const { error: insertError } = await supabase
          .from("transactions")
          .insert([
            {
              user_id: user.id,
              account_id: validPayload.source_account_id,
              category_id: null, 
              type: "debit",
              amount: validPayload.amount,
              description: outDescription
            },
            {
              user_id: user.id,
              account_id: validPayload.destination_account_id,
              category_id: null,
              type: "credit",
              amount: validPayload.amount,
              description: inDescription
            }
          ]);

        if (insertError) {
          console.error("Transfer Bulk Insert Failed:", insertError);
          return { success: false, error: "Database rejected the transfer. Changes rolled back." };
        }

        return { success: true, transferReference: transferRefId };

      } catch (err: any) {
        if (err.name === 'ZodError') {
          return { success: false, error: `Validation failed: ${err.errors[0].message}` };
        }
        console.error("Transfer Service Integrity Error:", err);
        return { success: false, error: "An unexpected integrity error occurred while executing the transfer." };
      }
    }
  };
}

