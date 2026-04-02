import { SupabaseClient } from "@supabase/supabase-js";
import { requireActive, requireRole } from "./role.utils";
import { Profile } from "../schemas/profile.schema";

/**
 * Service Factory for Administrative Operations.
 * 
 * @param userClient A Supabase client authenticated as the current user (for identity verification).
 * @param serviceRoleClient A Supabase client instantiated with the `service_role` key to seamlessly safely bypass RLS.
 */
export function createAdminService(userClient: SupabaseClient, serviceRoleClient: SupabaseClient) {
  
  // Private helper to aggressively gatekeep every admin action
  const verifyRootAdminSecurity = async () => {
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized security context.");

    const { data: profile } = await userClient.from("profiles").select("*").eq("id", user.id).single();
    if (!profile) throw new Error("Security Identity missing.");

    // Throws errors if they are deactivated or non-admin
    requireActive(profile as Profile);
    requireRole(profile as Profile, 'admin');
    
    return user;
  };

  return {
    async getAllUsers() {
      try {
        await verifyRootAdminSecurity();
        // Uses the service_role_client to completely circumvent Postgres RLS rules for this precise query
        const { data, error } = await serviceRoleClient.from("profiles").select("*").order("created_at", { ascending: false });
        if (error) return { error: error.message };
        return { data };
      } catch (err: any) {
        return { error: err.message };
      }
    },

    async toggleUserActive(targetUserId: string) {
      try {
        await verifyRootAdminSecurity();
        
        // Fetch current state
        const { data: currentProfile, error: fetchError } = await serviceRoleClient
          .from("profiles")
          .select("is_active")
          .eq("id", targetUserId)
          .single();
          
        if (fetchError || !currentProfile) return { error: "User not found." };

        // Toggle state
        const { data, error } = await serviceRoleClient
          .from("profiles")
          .update({ is_active: !currentProfile.is_active })
          .eq("id", targetUserId)
          .select()
          .single();

        if (error) return { error: error.message };
        return { data };
      } catch (err: any) {
        return { error: err.message };
      }
    },

    async updateUserRole(targetUserId: string, newRole: string) {
        try {
          await verifyRootAdminSecurity();

          const { data, error } = await serviceRoleClient
            .from("profiles")
            .update({ role: newRole })
            .eq("id", targetUserId)
            .select()
            .single();
  
          if (error) return { error: error.message };
          return { data };
        } catch (err: any) {
          return { error: err.message };
        }
    },

    async getAllTransactions() {
        try {
          await verifyRootAdminSecurity();
          // Pulling entirely unmitigated transaction history for audit logs
          const { data, error } = await serviceRoleClient.from("transactions").select("*").order("created_at", { ascending: false });
          if (error) return { error: error.message };
          return { data };
        } catch (err: any) {
          return { error: err.message };
        }
    },

    async getUserAnalytics(targetUserId: string) {
        try {
            await verifyRootAdminSecurity();
            // Fetch the aggregated view of all users from Postgres
            const { data, error } = await serviceRoleClient.rpc("get_user_aggregations");
            if (error) return { error: error.message };
            
            // Pluck the exact target from the returned subset
            const targetMetrics = (data || []).find((u: any) => u.user_id === targetUserId);
            
            // Return shape safely handles users without transactions
            return { 
                data: targetMetrics || { 
                    user_id: targetUserId, 
                    total_income: 0, 
                    total_expense: 0, 
                    transaction_count: 0 
                } 
            };
        } catch (err: any) {
          return { error: err.message };
        }
    }
  };
}
