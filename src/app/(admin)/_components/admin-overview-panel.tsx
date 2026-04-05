"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Users, ArrowLeftRight, Activity, ShieldAlert, UserRoundSearch } from "lucide-react"

type AdminUser = {
  id: string
  full_name: string | null
  role: "user" | "analyst" | "admin"
  is_active: boolean
}

type AdminTransaction = {
  id: string
  user_id: string
  type: "credit" | "debit"
  amount: number
  description: string | null
  created_at: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function getDisplayTransactionType(type: "credit" | "debit", description: string | null) {
  const normalizedDescription = description?.trim() ?? ""

  if (/^Self Transfer to .+? \[TRF-/.test(normalizedDescription)) {
    return "credit"
  }

  if (/^Self Transfer from .+? \[TRF-/.test(normalizedDescription)) {
    return "debit"
  }

  return type
}

export function AdminOverviewPanel() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [usersRes, txRes] = await Promise.all([
          fetch("/api/admin/users", { cache: "no-store" }),
          fetch("/api/admin/transactions", { cache: "no-store" }),
        ])

        const [usersJson, txJson] = await Promise.all([usersRes.json(), txRes.json()])

        if (!usersRes.ok || !txRes.ok) {
          throw new Error(usersJson.error || txJson.error || "Failed to load dashboard")
        }

        if (!cancelled) {
          setUsers(usersJson.data ?? [])
          setTransactions((txJson.data ?? []).map((tx: any) => ({ ...tx, amount: Number(tx.amount ?? 0) })))
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load admin dashboard")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const activeUsers = useMemo(() => users.filter((user) => user.is_active).length, [users])
  const recentTransactions = useMemo(() => transactions.slice(0, 8), [transactions])
  const totalIncome = useMemo(
    () => transactions.filter((tx) => tx.type === "credit").reduce((acc, tx) => acc + tx.amount, 0),
    [transactions]
  )
  const totalExpense = useMemo(
    () => transactions.filter((tx) => tx.type === "debit").reduce((acc, tx) => acc + tx.amount, 0),
    [transactions]
  )

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-foreground shadow-sm">Loading admin dashboard...</div>
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-4 w-4" />
          Unable to load dashboard
        </div>
        <p className="text-sm text-foreground/90">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{users.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">{activeUsers} active</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Transactions</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{transactions.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">System-wide activity</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Income</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalIncome)}</p>
          <p className="mt-1 text-xs text-muted-foreground">All users</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Expense</p>
          <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-400">{formatCurrency(totalExpense)}</p>
          <p className="mt-1 text-xs text-muted-foreground">All users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions found.</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const displayType = getDisplayTransactionType(tx.type, tx.description)

                return (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description || "No description"}</p>
                      <p className="text-xs text-muted-foreground">User {tx.user_id.slice(0, 8)}...</p>
                    </div>
                    <p className={`text-sm font-semibold ${displayType === "credit" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                      {displayType === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/admin/users" className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground">
              <Users className="h-4 w-4" />
              Manage Users
            </Link>
            <Link href="/admin/transactions" className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground">
              <ArrowLeftRight className="h-4 w-4" />
              View Transactions
            </Link>
            <Link href="/admin/analytics" className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground">
              <Activity className="h-4 w-4" />
              Drilldown Analytics
            </Link>
            {users.length > 0 ? (
              <Link
                href={`/admin/users/${users[0].id}`}
                className="flex items-center gap-2 rounded-xl border border-primary bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                <UserRoundSearch className="h-4 w-4" />
                Open User Drilldown
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}