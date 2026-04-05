"use client"

import { useEffect, useMemo, useState } from "react"

type AdminUser = {
  id: string
  full_name: string | null
  role: "user" | "analyst" | "admin"
  is_active: boolean
}

type UserAnalytics = {
  total_income: number
  total_expense: number
  net: number
  trend: Array<{ bucket: string; income: number; expense: number }>
  category_breakdown: {
    income: Array<{ category_id: string | null; category_name: string; total: number }>
    expense: Array<{ category_id: string | null; category_name: string; total: number }>
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value)
}

export function AdminAnalyticsPanel() {
  const [loading, setLoading] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly")
  const [analysis, setAnalysis] = useState<UserAnalytics | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/admin/users", { cache: "no-store" })
        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.error || "Failed to load users")
        }

        if (!cancelled) {
          const nextUsers = json.data ?? []
          setUsers(nextUsers)
          setSelectedUserId((prev) => prev ?? nextUsers[0]?.id ?? null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load analytics users")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadUsers()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadAnalytics() {
      if (!selectedUserId) {
        setAnalysis(null)
        return
      }

      setAnalysisLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/users/${selectedUserId}/analytics?period=${period}`, { cache: "no-store" })
        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.error || "Failed to load analytics")
        }

        if (!cancelled) {
          setAnalysis(json.data ?? null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load analytics")
        }
      } finally {
        if (!cancelled) {
          setAnalysisLoading(false)
        }
      }
    }

    loadAnalytics()
    return () => {
      cancelled = true
    }
  }, [selectedUserId, period])

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [users, selectedUserId])

  const maxTrend = useMemo(() => Math.max(1, ...(analysis?.trend ?? []).map((row) => Math.max(row.income, row.expense))), [analysis?.trend])

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-foreground shadow-sm">Loading analytics...</div>
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedUserId ?? ""}
          onChange={(event) => setSelectedUserId(event.target.value || null)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name || `User ${user.id.slice(0, 8)}`}
            </option>
          ))}
        </select>

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">User</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{selectedUser?.full_name || "-"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(analysis?.total_income ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Expense</p>
          <p className="mt-1 text-lg font-bold text-rose-700 dark:text-rose-400">{formatCurrency(analysis?.total_expense ?? 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Trend</h2>
          {analysisLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : !analysis?.trend.length ? (
            <p className="text-xs text-muted-foreground">No trend data.</p>
          ) : (
            <div className="space-y-2">
              {analysis.trend.map((row) => (
                <div key={row.bucket} className="rounded-lg border border-border bg-background px-2 py-2">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{row.bucket}</span>
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
          <h2 className="mb-3 text-sm font-semibold text-foreground">Expense Breakdown</h2>
          {analysisLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : !analysis?.category_breakdown.expense.length ? (
            <p className="text-xs text-muted-foreground">No expense data.</p>
          ) : (
            <div className="space-y-2">
              {analysis.category_breakdown.expense.slice(0, 10).map((row) => (
                <div key={`${row.category_id ?? "uncategorized"}-exp`} className="rounded-lg border border-border bg-background px-2 py-2 text-xs">
                  <p className="text-foreground">{row.category_name}</p>
                  <p className="text-muted-foreground">{formatCurrency(row.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}