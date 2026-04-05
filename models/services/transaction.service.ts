import { SupabaseClient } from "@supabase/supabase-js";
import { CreateTransactionPayload, createTransactionSchema, Transaction } from "../schemas/transaction.schema";
import { requireActive, requireRole } from "./role.utils";
import { Profile } from "../schemas/profile.schema";
import { Category } from "../schemas/categories.schema";

export function createTransactionService(supabase: SupabaseClient) {
  async function getAuthorizedUser() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized access: Please log in.");
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile) {
      throw new Error("Profile not found.");
    }

    requireActive(profile as Profile);
    requireRole(profile as Profile, "user");

    return user;
  }

  return {
    async getUserCategories(): Promise<{ data: Category[] | null; error: string | null }> {
      try {
        const user = await getAuthorizedUser();

        const { data: categories, error } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Fetch Categories Database Error:", error);
          return { data: null, error: "Failed to fetch categories." };
        }

        return { data: categories as Category[], error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred while fetching categories.";
        console.error("Service Layer Fetch Error:", err);
        return { data: null, error: message };
      }
    },

    async getRecentTransactions(limit = 10): Promise<{ data: Transaction[] | null; error: string | null }> {
      try {
        const user = await getAuthorizedUser();

        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          console.error("Fetch Transactions Database Error:", error);
          return { data: null, error: "Failed to fetch recent transactions." };
        }

        return { data: transactions as Transaction[], error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred while fetching transactions.";
        console.error("Service Layer Fetch Error:", err);
        return { data: null, error: message };
      }
    },

    
    async createTransaction(payload: CreateTransactionPayload): Promise<{ data: Transaction | null; error: string | null }> {
      try {
        const validPayload = createTransactionSchema.parse(payload);
        
        const user = await getAuthorizedUser();

        const { data: account, error: accountError } = await supabase
          .from("accounts")
          .select("id, user_id, balance")
          .eq("id", validPayload.account_id)
          .single();

        if (accountError || !account) {
          return { data: null, error: "The selected account could not be found." };
        }

        if (account.user_id !== user.id) {
          return { data: null, error: "Security violation: You do not have permission to interact with this account." }; // Early rejection
        }

        if (validPayload.type === "debit" && account.balance < validPayload.amount) {
          return { data: null, error: "Insufficient balance to execute this debit transaction." };
        }

        if (validPayload.category_id) {
          const { data: category, error: categoryError } = await supabase
            .from("categories")
            .select("id, user_id, type")
            .eq("id", validPayload.category_id)
            .single();

          if (categoryError || !category) {
            return { data: null, error: "The selected category is invalid or missing." };
          }

          if (category.user_id !== user.id) {
            return { data: null, error: "Security violation: Category access denied." };
          }

          if (validPayload.type === "credit" && category.type !== "income") {
            return { data: null, error: "Logic error: Credit transactions must be assigned to income categories." };
          }
          if (validPayload.type === "debit" && category.type !== "expense") {
            return { data: null, error: "Logic error: Debit transactions must be assigned to expense categories." };
          }
        }

        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
        const { data: duplicates } = await supabase
          .from("transactions")
          .select("id")
          .eq("account_id", validPayload.account_id)
          .eq("amount", validPayload.amount)
          .eq("type", validPayload.type)
          .gte("created_at", fiveSecondsAgo)
          .limit(1);

        if (duplicates && duplicates.length > 0) {
          return { data: null, error: "Duplicate transaction detected. Please wait a few seconds before submitting again." };
        }

        const { data: transaction, error: insertError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id, // Server-enforced, NOT from payload
            account_id: validPayload.account_id,
            category_id: validPayload.category_id,
            type: validPayload.type,
            amount: validPayload.amount,
            description: validPayload.description,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Transaction DB Insert Error:", insertError);
          return { data: null, error: "Database rejected the transaction. Please try again." };
        }

        return { data: transaction, error: null };
      } catch (err: any) {
        if (err.name === 'ZodError') {
          return { data: null, error: `Validation failed: ${err.errors[0].message}` };
        }
        console.error("Service Layer Fast-Fail Error:", err);
        return { data: null, error: "An unexpected integrity error occurred while processing your transaction." };
      }
    }
  };
}

