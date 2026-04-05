import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreateAccountPayload,
  createAccountSchema,
  OnboardAccountPayload,
  onboardAccountSchema,
  Account,
} from "../schemas/account.schema";
import { requireActive, requireRole } from "./role.utils";
import { Profile } from "../schemas/profile.schema";

export function createAccountService(supabase: SupabaseClient) {
  
  async function getAuthorizedUser() {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized access: Please log in.");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) throw new Error("Profile not found.");

    requireActive(profile as Profile);
    requireRole(profile as Profile, "user");

    return user;
  }

  return {
    
    async getUserAccounts(): Promise<{
      data: Account[] | null;
      error: string | null;
    }> {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return { data: null, error: "Unauthorized access: Please log in." };
        }

        const { data: accounts, error } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Fetch Accounts Database Error:", error);
          return { data: null, error: "Failed to fetch accounts." };
        }

        return { data: accounts as Account[], error: null };
      } catch (err: unknown) {
        console.error("Service Layer Fetch Error:", err);
        return {
          data: null,
          error: "An unexpected error occurred while fetching accounts.",
        };
      }
    },

    
    async createAccount(payload: CreateAccountPayload): Promise<{
      data: Account | null;
      error: string | null;
    }> {
      try {
        const validPayload = createAccountSchema.parse(payload);
        const user = await getAuthorizedUser();

        const { data: newAccount, error: insertError } = await supabase
          .from("accounts")
          .insert({
            user_id: user.id,
            name: validPayload.name,
            type: validPayload.type,
            balance: 0, // Always 0 on insert — transactions update balance
            currency: validPayload.currency ?? "INR",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Account DB Insert Error:", insertError);
          return {
            data: null,
            error: "Database rejected the account creation. Please try again.",
          };
        }

        return { data: newAccount as Account, error: null };
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "ZodError") {
          return { data: null, error: `Validation failed: ${(err as any).issues?.[0]?.message ?? err.message}` };
        }
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        return { data: null, error: message };
      }
    },

    
    async createAccountWithInitialBalance(payload: OnboardAccountPayload): Promise<{
      data: Account | null;
      error: string | null;
    }> {
      try {
        const validPayload = onboardAccountSchema.parse(payload);
        const user = await getAuthorizedUser();

        const { data: newAccount, error: insertError } = await supabase
          .from("accounts")
          .insert({
            user_id: user.id,
            name: validPayload.name,
            type: validPayload.type,
            balance: 0,
            currency: validPayload.currency ?? "INR",
          })
          .select()
          .single();

        if (insertError || !newAccount) {
          console.error("Onboard Account Insert Error:", insertError);
          return {
            data: null,
            error: "Failed to create account. Please try again.",
          };
        }

        const initialBalance = validPayload.initial_balance ?? 0;

        if (initialBalance > 0) {
          const { error: txError } = await supabase
            .from("transactions")
            .insert({
              user_id: user.id,
              account_id: newAccount.id,
              category_id: null,       // Opening balance has no category
              type: "credit",
              amount: initialBalance,
              description: "Initial balance",
            });

          if (txError) {
            console.error("Initial Balance Transaction Error:", txError);
            return {
              data: newAccount as Account,
              error: `Account created but initial balance transaction failed: ${txError.message}`,
            };
          }

          const { data: updatedAccount } = await supabase
            .from("accounts")
            .select("*")
            .eq("id", newAccount.id)
            .single();

          return { data: (updatedAccount ?? newAccount) as Account, error: null };
        }

        return { data: newAccount as Account, error: null };
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "ZodError") {
          return { data: null, error: `Validation failed: ${(err as any).issues?.[0]?.message ?? err.message}` };
        }
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        console.error("createAccountWithInitialBalance Error:", err);
        return { data: null, error: message };
      }
    },
  };
}

