import { SupabaseClient } from "@supabase/supabase-js";
import { requireActive, requireRole } from "./role.utils";
import { Profile } from "../schemas/profile.schema";

type RoleValue = "user" | "analyst" | "admin";
type PeriodFilter = "weekly" | "monthly";

type AdminUserSummary = {
  id: string;
  full_name: string | null;
  role: RoleValue;
  is_active: boolean;
  created_at?: string;
};

type AdminUserSnapshot = {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: RoleValue;
    is_active: boolean;
  };
  summary: {
    income: number;
    expense: number;
    net: number;
    balance: number;
  };
  trend: Array<{ bucket: string; income: number; expense: number }>;
  categories: Array<{ category_id: string | null; category_name: string; total: number }>;
  accounts: Array<{ id: string; name: string; type: string; balance: number; currency: string }>;
  transactions: Array<{
    id: string;
    created_at: string;
    type: "credit" | "debit";
    amount: number;
    description: string | null;
    account_id: string;
    account_name: string;
    category_id: string | null;
    category_name: string;
  }>;
  anomaly_flags: string[];
};

type AdminUserDetails = {
  profile: AdminUserSummary;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    created_at: string;
  }>;
  transactions: Array<{
    id: string;
    account_id: string;
    category_id: string | null;
    type: "credit" | "debit";
    amount: number;
    description: string | null;
    created_at: string;
  }>;
};

type AdminUserAnalytics = {
  total_income: number;
  total_expense: number;
  net: number;
  trend: Array<{ bucket: string; income: number; expense: number }>;
  category_breakdown: {
    income: Array<{ category_id: string | null; category_name: string; total: number }>;
    expense: Array<{ category_id: string | null; category_name: string; total: number }>;
  };
};

function getMonthBucket(iso: string) {
  const date = new Date(iso);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function getWeekBucket(iso: string) {
  const date = new Date(iso);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diffToMonday);

  const year = monday.getUTCFullYear();
  const month = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(monday.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

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

  const getUserAnalyticsPayload = async (targetUserId: string, period: PeriodFilter): Promise<{ data: AdminUserAnalytics | null; error: string | null }> => {
    const { data: transactions, error: txError } = await serviceRoleClient
      .from("transactions")
      .select("type, amount, created_at, category_id")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: true });

    if (txError) {
      return { data: null, error: txError.message };
    }

    const txRows = (transactions ?? []) as Array<{
      type: "credit" | "debit";
      amount: number;
      created_at: string;
      category_id: string | null;
    }>;

    const categoryIds = Array.from(
      new Set(
        txRows
          .map((tx) => tx.category_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    const categoryMap = new Map<string, string>();
    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } = await serviceRoleClient
        .from("categories")
        .select("id, name")
        .in("id", categoryIds);

      if (categoriesError) {
        return { data: null, error: categoriesError.message };
      }

      for (const category of categories ?? []) {
        categoryMap.set(category.id, category.name);
      }
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const trendMap = new Map<string, { income: number; expense: number }>();
    const incomeCategoryMap = new Map<string, { category_id: string | null; category_name: string; total: number }>();
    const expenseCategoryMap = new Map<string, { category_id: string | null; category_name: string; total: number }>();

    for (const tx of txRows) {
      const amount = Number(tx.amount ?? 0);
      const bucket = period === "weekly" ? getWeekBucket(tx.created_at) : getMonthBucket(tx.created_at);
      const trendRow = trendMap.get(bucket) ?? { income: 0, expense: 0 };

      if (tx.type === "credit") {
        totalIncome += amount;
        trendRow.income += amount;

        const key = tx.category_id ?? "uncategorized";
        const existing = incomeCategoryMap.get(key) ?? {
          category_id: tx.category_id,
          category_name: tx.category_id ? categoryMap.get(tx.category_id) ?? "Unknown" : "Self Transfer",
          total: 0,
        };
        existing.total += amount;
        incomeCategoryMap.set(key, existing);
      } else {
        totalExpense += amount;
        trendRow.expense += amount;

        const key = tx.category_id ?? "uncategorized";
        const existing = expenseCategoryMap.get(key) ?? {
          category_id: tx.category_id,
          category_name: tx.category_id ? categoryMap.get(tx.category_id) ?? "Unknown" : "Self Transfer",
          total: 0,
        };
        existing.total += amount;
        expenseCategoryMap.set(key, existing);
      }

      trendMap.set(bucket, trendRow);
    }

    const data: AdminUserAnalytics = {
      total_income: totalIncome,
      total_expense: totalExpense,
      net: totalIncome - totalExpense,
      trend: Array.from(trendMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([bucket, values]) => ({ bucket, income: values.income, expense: values.expense })),
      category_breakdown: {
        income: Array.from(incomeCategoryMap.values()).sort((a, b) => b.total - a.total),
        expense: Array.from(expenseCategoryMap.values()).sort((a, b) => b.total - a.total),
      },
    };

    return { data, error: null };
  };

  return {
    async getAllUsers(): Promise<{ data: AdminUserSummary[] | null; error: string | null }> {
      try {
        await verifyRootAdminSecurity();

        const { data, error } = await serviceRoleClient
          .from("profiles")
          .select("id, full_name, role, is_active, created_at")
          .order("created_at", { ascending: false });

        if (error) return { data: null, error: error.message };

        return {
          data: (data ?? []).map((row: any) => ({
            id: row.id,
            full_name: row.full_name,
            role: row.role,
            is_active: row.is_active,
            created_at: row.created_at,
          })),
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async updateUser(targetUserId: string, payload: { full_name?: string; role?: RoleValue }): Promise<{ data: AdminUserSummary | null; error: string | null }> {
      try {
        const currentAdmin = await verifyRootAdminSecurity();

        if (currentAdmin.id === targetUserId && payload.role && payload.role !== "admin") {
          return { data: null, error: "You cannot remove your own admin role." };
        }

        const updates: Record<string, unknown> = {};

        if (typeof payload.full_name !== "undefined") {
          updates.full_name = payload.full_name?.trim() ? payload.full_name.trim() : null;
        }

        if (typeof payload.role !== "undefined") {
          if (!["user", "analyst", "admin"].includes(payload.role)) {
            return { data: null, error: "Invalid role value." };
          }
          updates.role = payload.role;
        }

        if (Object.keys(updates).length === 0) {
          return { data: null, error: "No valid fields to update." };
        }

        const { data, error } = await serviceRoleClient
          .from("profiles")
          .update(updates)
          .eq("id", targetUserId)
          .select("id, full_name, role, is_active, created_at")
          .single();

        if (error || !data) {
          return { data: null, error: error?.message ?? "User not found." };
        }

        return {
          data: {
            id: data.id,
            full_name: data.full_name,
            role: data.role,
            is_active: data.is_active,
            created_at: data.created_at,
          },
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async toggleUserActive(targetUserId: string): Promise<{ data: AdminUserSummary | null; error: string | null }> {
      try {
        const currentAdmin = await verifyRootAdminSecurity();

        if (currentAdmin.id === targetUserId) {
          return { data: null, error: "You cannot deactivate your own admin account." };
        }

        const { data: currentProfile, error: fetchError } = await serviceRoleClient
          .from("profiles")
          .select("is_active")
          .eq("id", targetUserId)
          .single();

        if (fetchError || !currentProfile) {
          return { data: null, error: "User not found." };
        }

        const { data, error } = await serviceRoleClient
          .from("profiles")
          .update({ is_active: !currentProfile.is_active })
          .eq("id", targetUserId)
          .select("id, full_name, role, is_active, created_at")
          .single();

        if (error || !data) {
          return { data: null, error: error?.message ?? "Failed to update user status." };
        }

        return {
          data: {
            id: data.id,
            full_name: data.full_name,
            role: data.role,
            is_active: data.is_active,
            created_at: data.created_at,
          },
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async deleteUser(targetUserId: string): Promise<{ success: boolean; error: string | null }> {
      try {
        const currentAdmin = await verifyRootAdminSecurity();

        if (currentAdmin.id === targetUserId) {
          return { success: false, error: "You cannot delete your own admin account." };
        }

        await serviceRoleClient.from("transactions").delete().eq("user_id", targetUserId);
        await serviceRoleClient.from("accounts").delete().eq("user_id", targetUserId);
        await serviceRoleClient.from("categories").delete().eq("user_id", targetUserId);
        const { error: profileDeleteError } = await serviceRoleClient
          .from("profiles")
          .delete()
          .eq("id", targetUserId);

        if (profileDeleteError) {
          return { success: false, error: profileDeleteError.message };
        }

        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    async getAllTransactions(): Promise<{ data: any[] | null; error: string | null }> {
      try {
        await verifyRootAdminSecurity();

        const { data, error } = await serviceRoleClient
          .from("transactions")
          .select("id, user_id, account_id, category_id, type, amount, description, created_at")
          .order("created_at", { ascending: false });

        if (error) {
          return { data: null, error: error.message };
        }

        const usersResult = await this.getAllUsers();
        if (usersResult.error || !usersResult.data) {
          return { data: null, error: usersResult.error ?? "Unable to load users for transaction mapping." };
        }

        const userNameMap = new Map<string, string | null>();
        for (const user of usersResult.data) {
          userNameMap.set(user.id, user.full_name);
        }

        const enrichedRows = (data ?? []).map((row: any) => ({
          ...row,
          user_full_name: userNameMap.get(row.user_id) ?? null,
        }));

        return { data: enrichedRows, error: null };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async getUserDetails(targetUserId: string): Promise<{ data: AdminUserDetails | null; error: string | null }> {
      try {
        await verifyRootAdminSecurity();

        const [{ data: profile, error: profileError }, { data: accounts, error: accountsError }, { data: transactions, error: txError }] = await Promise.all([
          serviceRoleClient
            .from("profiles")
            .select("id, full_name, role, is_active, created_at")
            .eq("id", targetUserId)
            .single(),
          serviceRoleClient
            .from("accounts")
            .select("id, name, type, balance, currency, created_at")
            .eq("user_id", targetUserId)
            .order("created_at", { ascending: false }),
          serviceRoleClient
            .from("transactions")
            .select("id, account_id, category_id, type, amount, description, created_at")
            .eq("user_id", targetUserId)
            .order("created_at", { ascending: false }),
        ]);

        if (profileError || !profile) {
          return { data: null, error: profileError?.message ?? "User not found." };
        }

        if (accountsError) {
          return { data: null, error: accountsError.message };
        }

        if (txError) {
          return { data: null, error: txError.message };
        }

        return {
          data: {
            profile: {
              id: profile.id,
              full_name: profile.full_name,
              role: profile.role,
              is_active: profile.is_active,
              created_at: profile.created_at,
            },
            accounts: (accounts ?? []).map((account: any) => ({
              id: account.id,
              name: account.name,
              type: account.type,
              balance: Number(account.balance ?? 0),
              currency: account.currency,
              created_at: account.created_at,
            })),
            transactions: (transactions ?? []).map((tx: any) => ({
              id: tx.id,
              account_id: tx.account_id,
              category_id: tx.category_id,
              type: tx.type,
              amount: Number(tx.amount ?? 0),
              description: tx.description,
              created_at: tx.created_at,
            })),
          },
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async getUserAnalytics(targetUserId: string, period: PeriodFilter = "monthly"): Promise<{ data: AdminUserAnalytics | null; error: string | null }> {
      try {
        await verifyRootAdminSecurity();
        return await getUserAnalyticsPayload(targetUserId, period);
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async softDeactivateUser(targetUserId: string): Promise<{ data: AdminUserSummary | null; error: string | null }> {
      try {
        const currentAdmin = await verifyRootAdminSecurity();

        if (currentAdmin.id === targetUserId) {
          return { data: null, error: "You cannot deactivate your own admin account." };
        }

        const { data, error } = await serviceRoleClient
          .from("profiles")
          .update({ is_active: false })
          .eq("id", targetUserId)
          .select("id, full_name, role, is_active, created_at")
          .single();

        if (error || !data) {
          return { data: null, error: error?.message ?? "Failed to deactivate user." };
        }

        return {
          data: {
            id: data.id,
            full_name: data.full_name,
            role: data.role,
            is_active: data.is_active,
            created_at: data.created_at,
          },
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async getUserSnapshot(targetUserId: string, period: PeriodFilter = "monthly"): Promise<{ data: AdminUserSnapshot | null; error: string | null }> {
      try {
        await verifyRootAdminSecurity();

        const [detailsResult, analyticsResult, authUserResult] = await Promise.all([
          this.getUserDetails(targetUserId),
          this.getUserAnalytics(targetUserId, period),
          serviceRoleClient.auth.admin.getUserById(targetUserId),
        ]);

        if (detailsResult.error || !detailsResult.data) {
          return { data: null, error: detailsResult.error ?? "User details unavailable." };
        }

        if (analyticsResult.error || !analyticsResult.data) {
          return { data: null, error: analyticsResult.error ?? "User analytics unavailable." };
        }

        const details = detailsResult.data;
        const analytics = analyticsResult.data;

        const accountMap = new Map<string, string>();
        for (const account of details.accounts) {
          accountMap.set(account.id, account.name);
        }

        const categoryMap = new Map<string, string>();
        for (const category of analytics.category_breakdown.expense) {
          if (category.category_id) {
            categoryMap.set(category.category_id, category.category_name);
          }
        }
        for (const category of analytics.category_breakdown.income) {
          if (category.category_id) {
            categoryMap.set(category.category_id, category.category_name);
          }
        }

        const transactions = details.transactions.map((tx) => ({
          id: tx.id,
          created_at: tx.created_at,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          account_id: tx.account_id,
          account_name: accountMap.get(tx.account_id) ?? "Unknown account",
          category_id: tx.category_id,
          category_name: tx.category_id ? categoryMap.get(tx.category_id) ?? "Unknown" : "Self Transfer",
        }));

        const totalBalance = details.accounts.reduce((acc, account) => acc + Number(account.balance ?? 0), 0);

        const monthlyTrend = analytics.trend;
        const avgExpense = monthlyTrend.length > 0
          ? monthlyTrend.reduce((acc, row) => acc + row.expense, 0) / monthlyTrend.length
          : 0;
        const latestExpense = monthlyTrend.length > 0 ? monthlyTrend[monthlyTrend.length - 1].expense : 0;

        const anomalyFlags: string[] = [];
        if (avgExpense > 0 && latestExpense > avgExpense * 1.5) {
          anomalyFlags.push("High expense in latest period compared to historical average.");
        }
        if (analytics.net < 0) {
          anomalyFlags.push("Net flow is negative for the selected period.");
        }

        const data: AdminUserSnapshot = {
          user: {
            id: details.profile.id,
            full_name: details.profile.full_name,
            email: authUserResult.data.user?.email ?? null,
            role: details.profile.role,
            is_active: details.profile.is_active,
          },
          summary: {
            income: analytics.total_income,
            expense: analytics.total_expense,
            net: analytics.net,
            balance: totalBalance,
          },
          trend: analytics.trend,
          categories: analytics.category_breakdown.expense,
          accounts: details.accounts.map((account) => ({
            id: account.id,
            name: account.name,
            type: account.type,
            balance: account.balance,
            currency: account.currency,
          })),
          transactions,
          anomaly_flags: anomalyFlags,
        };

        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },
  };
}
