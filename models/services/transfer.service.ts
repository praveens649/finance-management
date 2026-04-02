import { SupabaseClient } from "@supabase/supabase-js";
import { transferPayloadSchema, TransferPayload } from "../schemas/transfer.schema";
import { requireActive, requireRole } from "./role.utils";
import { Profile } from "../schemas/profile.schema";

export function createTransferService(supabase: SupabaseClient) {
  return {
    async createTransfer(payload: TransferPayload) {
      try {
        // Run Amount & Schema validations
        const validPayload = transferPayloadSchema.parse(payload);

        // Rule 3: Prevent Self-Transfer
        if (validPayload.source_account_id === validPayload.destination_account_id) {
          return { success: false, error: "Cannot transfer money to the same account." };
        }

        // Fetch User Identity securely
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          return { success: false, error: "Unauthorized access: Please log in." };
        }

        // Profile State Validations
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (!profile) return { success: false, error: "Profile not found." };
        
        requireActive(profile as Profile);
        requireRole(profile as Profile, 'user');

        // Rule 1: Both Accounts Must Exist
        // Fetch both accounts simultaneously to optimize DB hits
        const { data: accounts, error: accountsError } = await supabase
          .from("accounts")
          .select("id, user_id, balance, currency")
          .in("id", [validPayload.source_account_id, validPayload.destination_account_id]);

        if (accountsError || !accounts || accounts.length !== 2) {
          return { success: false, error: "One or both accounts could not be found." };
        }

        // Map accounts explicitly to avoid ordering issues
        const sourceAccount = accounts.find(a => a.id === validPayload.source_account_id);
        const destAccount = accounts.find(a => a.id === validPayload.destination_account_id);

        if (!sourceAccount || !destAccount) {
          return { success: false, error: "Account lookup mismatch." };
        }

        // Rule 2: Ownership Validation (Prevent unregulated Bank transfers!)
        if (sourceAccount.user_id !== user.id || destAccount.user_id !== user.id) {
          return { success: false, error: "Security violation: Both accounts must belong to you to execute an internal transfer." };
        }

        // Rule 6: Currency Consistency Check
        if (sourceAccount.currency !== destAccount.currency) {
          return { success: false, error: `Currency mismatch: Cannot transfer directly between ${sourceAccount.currency} and ${destAccount.currency}.` };
        }

        // Rule 4: Sufficient Balance Check
        // Executed at service layer to catch intent failures cleanly
        if (sourceAccount.balance < validPayload.amount) {
          return { success: false, error: "Insufficient funds in the source account." };
        }

        // Rule 8: Tie Both Transactions Together
        // Without an explicit `transfer_id` column currently in the DB schema,
        // we utilize a UUID injected natively into the description reference.
        const transferRefId = crypto.randomUUID();
        const refTag = `[TRF-${transferRefId.substring(0,8)}]`;

        // Rule 7, 10, & 11: Atomicity, DB Triggers, and Failure Recovery
        // Supabase/PostgREST naturally executes array inserts within a SINGLE database-level transaction.
        // If the debit fails, the credit never happens. If the credit fails, the debit rolls back.
        // Your database trigger safely updates the balances atomically.
        
        // Rule 9: Category Handling -> category = null (Don't mix transfers with actual expenses)
        const { error: insertError } = await supabase
          .from("transactions")
          .insert([
            {
              user_id: user.id,
              account_id: validPayload.source_account_id,
              category_id: null, 
              type: "debit",
              amount: validPayload.amount,
              description: `Transfer out ${refTag}: ${validPayload.description || ''}`.trim()
            },
            {
              user_id: user.id,
              account_id: validPayload.destination_account_id,
              category_id: null,
              type: "credit",
              amount: validPayload.amount,
              description: `Transfer in ${refTag}: ${validPayload.description || ''}`.trim()
            }
          ]);

        if (insertError) {
          console.error("Transfer Bulk Insert Failed:", insertError);
          // If insert fails for constraints/RLS, both are rolled back by Postgres automatically.
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
