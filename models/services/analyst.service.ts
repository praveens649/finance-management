import { SupabaseClient } from "@supabase/supabase-js";
import { requireActive, requireRole } from "./role.utils";
import { Profile } from "../schemas/profile.schema";

/**
 * Service Factory for Financial Analysis and Global Querying Ops.
 * 
 * @param userClient Standard authenticated Supabase client. Analyst RLS rules inherently authorize data reads.
 */
export function createAnalystService(userClient: SupabaseClient) {
  
  // Private helper to isolate this service rigidly to the designated roles
  const verifyAnalystSecurity = async () => {
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized security context.");

    const { data: profile } = await userClient.from("profiles").select("*").eq("id", user.id).single();
    if (!profile) throw new Error("Security Identity missing.");

    // Enforce that only Analysts or Admins can pull global reporting schemas
    requireActive(profile as Profile);
    requireRole(profile as Profile, 'analyst', 'admin'); 
    
    return user;
  };

  return {
    async getGlobalAnalytics() {
      try {
        await verifyAnalystSecurity();
        // Exploits the custom Postgres RPC `get_user_aggregations`
        const { data, error } = await userClient.rpc("get_user_aggregations");
        if (error) return { error: error.message };
        return { data };
      } catch (err: any) {
        return { error: err.message };
      }
    },

    async getMonthlyStats() {
      try {
        await verifyAnalystSecurity();
        // Exploits the custom Postgres RPC `get_monthly_stats` that truncates natively
        const { data, error } = await userClient.rpc("get_monthly_stats");
        if (error) return { error: error.message };
        return { data };
      } catch (err: any) {
        return { error: err.message };
      }
    },

    async getCategoryBreakdown() {
      try {
        await verifyAnalystSecurity();
        // Due to the RLS policies granting general `SELECT` visibility to analysts,
        // we can simply bulk-query dimensions natively and map the aggregation
        const { data: transactions, error } = await userClient
          .from("transactions")
          .select("category_id, amount")
          .eq('type', 'debit');
          
        if (error) return { error: error.message };
        
        const aggregation: Record<string, number> = {};
        for(let tx of (transactions || [])) {
            const catId = tx.category_id || "Uncategorized";
            aggregation[catId] = (aggregation[catId] || 0) + tx.amount;
        }

        // Returns { "category_id_A": 500, "category_id_B": 120, "Uncategorized": 50 }
        return { data: aggregation };
      } catch (err: any) {
        return { error: err.message };
      }
    }
  };
}
