"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"

type Snapshot = {
  user: {
    id: string
    full_name: string | null
    email: string | null
    role: "user" | "analyst" | "admin"
    is_active: boolean
  }
  summary: {
    income: number
    expense: number
    net: number
    balance: number
  }
  trend: Array<{ bucket: string; income: number; expense: number }>
  categories: Array<{ category_id: string | null; category_name: string; total: number }>
  accounts: Array<{ id: string; name: string; type: string; balance: number; currency: string }>
  transactions: Array<{
    id: string
    created_at: string
    type: "credit" | "debit"
    amount: number
    description: string | null
    account_id: string
    account_name: string
    category_id: string | null
    category_name: string
  }>
  anomaly_flags: string[]
}

function formatCurrency(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatBucketLabel(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date)
}

export function AdminUserDrilldown({ userId }: { userId: string }) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [txTypeFilter, setTxTypeFilter] = useState<"all" | "credit" | "debit">("all")
  const [txSearch, setTxSearch] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadSnapshot() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/users/${userId}/snapshot?period=${period}`, { cache: "no-store" })
        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.error || "Failed to load user snapshot")
        }

        if (!cancelled) {
          setSnapshot(json.data ?? null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load user snapshot")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSnapshot()
    return () => {
      cancelled = true
    }
  }, [period, userId])

  const maxTrend = useMemo(() => {
    return Math.max(1, ...(snapshot?.trend ?? []).map((row) => Math.max(row.income, row.expense)))
  }, [snapshot?.trend])

  const totalCategoryExpense = useMemo(() => {
    return (snapshot?.categories ?? []).reduce((acc, row) => acc + row.total, 0)
  }, [snapshot?.categories])

  const maxAccountBalance = useMemo(() => {
    return Math.max(1, ...(snapshot?.accounts ?? []).map((account) => Math.abs(account.balance)))
  }, [snapshot?.accounts])

  const filteredTransactions = useMemo(() => {
    const rows = snapshot?.transactions ?? []

    return rows.filter((tx) => {
      const matchesType = txTypeFilter === "all" ? true : tx.type === txTypeFilter
      const query = txSearch.trim().toLowerCase()
      const matchesSearch = query
        ? [tx.description ?? "", tx.category_name, tx.account_name].join(" ").toLowerCase().includes(query)
        : true
      return matchesType && matchesSearch
    })
  }, [snapshot?.transactions, txSearch, txTypeFilter])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        <p className="font-semibold">Unable to load user analytics</p>
        <p className="mt-1 text-sm text-foreground/90">{error}</p>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground shadow-sm">
        No financial activity yet.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </Link>

          <div className="inline-flex rounded-lg border border-input bg-background p-1">
            <button
              type="button"
              onClick={() => setPeriod("monthly")}
              className={`rounded-md px-3 py-1.5 text-xs ${period === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setPeriod("weekly")}
              className={`rounded-md px-3 py-1.5 text-xs ${period === "weekly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Weekly
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground">{snapshot.user.full_name || `User ${snapshot.user.id.slice(0, 8)}`}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{snapshot.user.email || snapshot.user.id}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-2 py-1">{snapshot.user.role}</span>
          <span className={`rounded-full border px-2 py-1 ${snapshot.user.is_active ? "border-emerald-600/40 text-emerald-700 dark:text-emerald-400" : "border-rose-600/40 text-rose-700 dark:text-rose-400"}`}>
            {snapshot.user.is_active ? "Active" : "Inactive"}
          </span>
          <span className="rounded-full border border-border px-2 py-1">{snapshot.accounts.length} accounts</span>
        </div>
      </div>

      {snapshot.anomaly_flags.length > 0 ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <p className="font-semibold">Anomaly Indicators</p>
          </div>
          <ul className="space-y-1 text-sm text-amber-100">
            {snapshot.anomaly_flags.map((flag) => (
              <li key={flag}>• {flag}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Income</p>
          <p className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(snapshot.summary.income)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Expense</p>
          <p className="mt-2 text-xl font-bold text-rose-700 dark:text-rose-400">{formatCurrency(snapshot.summary.expense)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Net Balance Flow</p>
          <p className={`mt-2 text-xl font-bold ${snapshot.summary.net >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
            {formatCurrency(snapshot.summary.net)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Balance</p>
          <p className="mt-2 text-xl font-bold text-foreground">{formatCurrency(snapshot.summary.balance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Trend ({period})</h2>
          {!snapshot.trend.length ? (
            <p className="text-sm text-muted-foreground">No financial activity yet.</p>
          ) : (
            <div className="space-y-2">
              {snapshot.trend.map((row) => (
                <div key={row.bucket} className="rounded-lg border border-border bg-background px-2 py-2">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{formatBucketLabel(row.bucket)}</span>
                    <span>{formatCurrency(row.income)} / {formatCurrency(row.expense)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-emerald-600 dark:bg-emerald-400" style={{ width: `${Math.max(4, (row.income / maxTrend) * 100)}%` }} /></div>
                    <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-rose-600 dark:bg-rose-400" style={{ width: `${Math.max(4, (row.expense / maxTrend) * 100)}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Expense Categories</h2>
          {!snapshot.categories.length ? (
            <p className="text-sm text-muted-foreground">No expense categories yet.</p>
          ) : (
            <div className="space-y-2">
              {snapshot.categories.map((row) => {
                const percent = totalCategoryExpense > 0 ? (row.total / totalCategoryExpense) * 100 : 0

                return (
                  <div key={`${row.category_id ?? "uncategorized"}-exp`} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{row.category_name}</span>
                      <span>{formatCurrency(row.total)}</span>
                    </div>
                    <div className="h-2 w-full rounded bg-muted">
                      <div className="h-2 rounded bg-rose-600 dark:bg-rose-400" style={{ width: `${Math.max(4, percent)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm xl:col-span-1">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Account Distribution</h2>
          {!snapshot.accounts.length ? (
            <p className="text-sm text-muted-foreground">No accounts found.</p>
          ) : (
            <div className="space-y-2">
              {snapshot.accounts.map((account) => {
                const width = Math.max(4, (Math.abs(account.balance) / maxAccountBalance) * 100)
                return (
                  <div key={account.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{account.name}</span>
                      <span>{formatCurrency(account.balance, account.currency)}</span>
                    </div>
                    <div className="h-2 rounded bg-muted">
                      <div className="h-2 rounded bg-emerald-600 dark:bg-emerald-400" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm xl:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Transactions</h2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={txTypeFilter}
              onChange={(event) => setTxTypeFilter(event.target.value as "all" | "credit" | "debit")}
              className="h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground"
            >
              <option value="all">All</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>

            <input
              value={txSearch}
              onChange={(event) => setTxSearch(event.target.value)}
              placeholder="Search by description/category/account"
              className="h-9 min-w-[220px] rounded-lg border border-input bg-background px-2 text-xs text-foreground"
            />
          </div>

          {!filteredTransactions.length ? (
            <p className="text-sm text-muted-foreground">No transactions match filters.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-background">
              <table className="w-full min-w-[760px] text-xs">
                <thead>
                  <tr className="border-b border-border text-left uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Account</th>
                    <th className="px-3 py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 50).map((tx) => (
                    <tr key={tx.id} className="border-b border-border/70 text-foreground">
                      <td className="px-3 py-2">{new Date(tx.created_at).toLocaleDateString("en-GB", { timeZone: "UTC" })}</td>
                      <td className={`px-3 py-2 font-medium ${tx.type === "credit" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>{tx.type}</td>
                      <td className="px-3 py-2">{formatCurrency(tx.amount)}</td>
                      <td className="px-3 py-2">{tx.category_name}</td>
                      <td className="px-3 py-2">{tx.account_name}</td>
                      <td className="px-3 py-2">{tx.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}