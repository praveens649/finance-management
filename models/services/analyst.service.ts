import { SupabaseClient } from "@supabase/supabase-js";

type PeriodFilter = "weekly" | "monthly";

export type AnalystUserListItem = {
  user_id: string;
  full_name: string | null;
  total_income: number;
  total_expense: number;
  transaction_count: number;
};

export type AnalystUserAnalysis = {
  summary: {
    total_income: number;
    total_expense: number;
    net: number;
  };
  trend: Array<{
    bucket: string;
    income: number;
    expense: number;
  }>;
  breakdown: {
    income: Array<{
      category_id: string | null;
      category_name: string;
      total: number;
    }>;
    expense: Array<{
      category_id: string | null;
      category_name: string;
      total: number;
    }>;
  };
};

export type AnalystDashboardData = {
  summary: {
    total_income: number;
    total_expense: number;
    net: number;
    total_users: number;
  };
  monthly: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
  categories: Array<{
    category_id: string | null;
    category_name: string;
    total: number;
  }>;
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
 * Service Factory for Financial Analysis and Global Querying Ops.
 * 
 * @param userClient Standard authenticated Supabase client. Analyst RLS rules inherently authorize data reads.
 */
export function createAnalystService(userClient: SupabaseClient) {
  const verifyAnalystSecurity = async () => {
    return null;
  };

  return {
    async getGlobalSummary(): Promise<{ data: { total_income: number; total_expense: number } | null; error: string | null }> {
      try {
        await verifyAnalystSecurity();
        const { data, error } = await userClient.rpc("get_global_summary");

        if (error) {
          return { data: null, error: error.message };
        }

        const first = Array.isArray(data) ? data[0] : null;

        return {
          data: {
            total_income: Number(first?.total_income ?? 0),
            total_expense: Number(first?.total_expense ?? 0),
          },
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async getMonthlyStats(): Promise<{ data: Array<{ month: string; income: number; expense: number }> | null; error: string | null }> {
      try {
        await verifyAnalystSecurity();
        const { data, error } = await userClient.rpc("get_monthly_stats");

        if (error) {
          return { data: null, error: error.message };
        }

        return {
          data: (data ?? []).map((row: any) => ({
            month: row.month,
            income: Number(row.income ?? 0),
            expense: Number(row.expense ?? 0),
          })),
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async getCategoryBreakdown(): Promise<{ data: Array<{ category_id: string | null; total: number }> | null; error: string | null }> {
      try {
        await verifyAnalystSecurity();
        const { data, error } = await userClient.rpc("get_category_breakdown");

        if (error) {
          return { data: null, error: error.message };
        }

        return {
          data: (data ?? []).map((row: any) => ({
            category_id: row.category_id,
            total: Number(row.total ?? 0),
          })),
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async getDashboard(): Promise<{ data: AnalystDashboardData | null; error: string | null }> {
      try {
        await verifyAnalystSecurity();

        const [{ data: summaryData, error: summaryError }, { data: monthlyData, error: monthlyError }, { data: categoryData, error: categoryError }, { count: userCount, error: usersError }] = await Promise.all([
          userClient.rpc("get_global_summary"),
          userClient.rpc("get_monthly_stats"),
          userClient.rpc("get_category_breakdown"),
          userClient
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "user"),
        ]);

        if (summaryError) {
          return { data: null, error: summaryError.message };
        }
        if (monthlyError) {
          return { data: null, error: monthlyError.message };
        }
        if (categoryError) {
          return { data: null, error: categoryError.message };
        }
        if (usersError) {
          return { data: null, error: usersError.message };
        }

        const rawSummary = Array.isArray(summaryData) ? summaryData[0] : null;
        const monthly = (monthlyData ?? []).map((row: any) => ({
          month: row.month,
          income: Number(row.income ?? 0),
          expense: Number(row.expense ?? 0),
        }));

        const rawCategories: Array<{ category_id: string | null; total: number }> = (categoryData ?? []).map((row: any) => ({
          category_id: row.category_id as string | null,
          total: Number(row.total ?? 0),
        }));

        const categoryIds = rawCategories
          .map((row: { category_id: string | null }) => row.category_id)
          .filter((value: string | null): value is string => Boolean(value));

        const categoryNameMap = new Map<string, string>();
        if (categoryIds.length > 0) {
          const { data: categories, error: namesError } = await userClient
            .from("categories")
            .select("id, name")
            .in("id", categoryIds);

          if (namesError) {
            return { data: null, error: namesError.message };
          }

          for (const category of categories ?? []) {
            categoryNameMap.set(category.id, category.name);
          }
        }

        const categories = rawCategories.map((row: { category_id: string | null; total: number }) => ({
          category_id: row.category_id,
          category_name: row.category_id ? categoryNameMap.get(row.category_id) ?? "Unknown" : "Self Transfer",
          total: row.total,
        }));

        const totalIncome = Number(rawSummary?.total_income ?? 0);
        const totalExpense = Number(rawSummary?.total_expense ?? 0);

        return {
          data: {
            summary: {
              total_income: totalIncome,
              total_expense: totalExpense,
              net: totalIncome - totalExpense,
              total_users: userCount ?? 0,
            },
            monthly,
            categories,
          },
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async getUserList(): Promise<{ data: AnalystUserListItem[] | null; error: string | null }> {
      try {
        await verifyAnalystSecurity();

        const { data: aggregateRows, error: aggregateError } = await userClient.rpc("get_user_aggregations");
        if (aggregateError) {
          return { data: null, error: aggregateError.message };
        }

        const rows = (aggregateRows ?? []) as Array<{
          user_id: string;
          total_income: number | string | null;
          total_expense: number | string | null;
          transaction_count: number | string | null;
        }>;

        if (rows.length === 0) {
          return { data: [], error: null };
        }

        const userIds = rows.map((row) => row.user_id);
        const { data: profiles, error: profilesError } = await userClient
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        if (profilesError) {
          return { data: null, error: profilesError.message };
        }

        const profileMap = new Map<string, string | null>();
        for (const profile of profiles ?? []) {
          profileMap.set(profile.id, profile.full_name ?? null);
        }

        const data: AnalystUserListItem[] = rows.map((row) => ({
          user_id: row.user_id,
          full_name: profileMap.get(row.user_id) ?? null,
          total_income: Number(row.total_income ?? 0),
          total_expense: Number(row.total_expense ?? 0),
          transaction_count: Number(row.transaction_count ?? 0),
        }));

        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },

    async getUserAnalysis(userId: string, period: PeriodFilter): Promise<{ data: AnalystUserAnalysis | null; error: string | null }> {
      try {
        await verifyAnalystSecurity();

        const { data: transactions, error: txError } = await userClient
          .from("transactions")
          .select("type, amount, created_at, category_id")
          .eq("user_id", userId)
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

        const categoryNameMap = new Map<string, string>();
        if (categoryIds.length > 0) {
          const { data: categories, error: categoriesError } = await userClient
            .from("categories")
            .select("id, name")
            .in("id", categoryIds);

          if (categoriesError) {
            return { data: null, error: categoriesError.message };
          }

          for (const category of categories ?? []) {
            categoryNameMap.set(category.id, category.name);
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
              category_name: tx.category_id ? categoryNameMap.get(tx.category_id) ?? "Unknown" : "Uncategorized",
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
              category_name: tx.category_id ? categoryNameMap.get(tx.category_id) ?? "Unknown" : "Uncategorized",
              total: 0,
            };
            existing.total += amount;
            expenseCategoryMap.set(key, existing);
          }

          trendMap.set(bucket, trendRow);
        }

        const trend = Array.from(trendMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([bucket, value]) => ({ bucket, income: value.income, expense: value.expense }));

        const data: AnalystUserAnalysis = {
          summary: {
            total_income: totalIncome,
            total_expense: totalExpense,
            net: totalIncome - totalExpense,
          },
          trend,
          breakdown: {
            income: Array.from(incomeCategoryMap.values()).sort((a, b) => b.total - a.total),
            expense: Array.from(expenseCategoryMap.values()).sort((a, b) => b.total - a.total),
          },
        };

        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: err.message };
      }
    },
  };
}
