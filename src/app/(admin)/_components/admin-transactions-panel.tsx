"use client"

import { useEffect, useMemo, useState } from "react"

type TransactionRow = {
  id: string
  user_id: string
  user_full_name: string | null
  type: "credit" | "debit"
  amount: number
  description: string | null
  created_at: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value)
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

export function AdminTransactionsPanel() {
  const pageSize = 7
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<TransactionRow[]>([])
  const [userFilter, setUserFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/admin/transactions", { cache: "no-store" })
        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.error || "Failed to load transactions")
        }

        if (!cancelled) {
          setRows((json.data ?? []).map((row: any) => ({ ...row, amount: Number(row.amount ?? 0) })))
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load transactions")
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

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesUser = userFilter.trim() ? row.user_id.toLowerCase().includes(userFilter.trim().toLowerCase()) : true
      const matchesDate = dateFilter ? row.created_at.startsWith(dateFilter) : true
      return matchesUser && matchesDate
    })
  }, [rows, userFilter, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))

  useEffect(() => {
    setCurrentPage(1)
  }, [userFilter, dateFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, currentPage, pageSize])

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-foreground shadow-sm">Loading transactions...</div>
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={userFilter}
          onChange={(event) => setUserFilter(event.target.value)}
          placeholder="Filter by user id"
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Transaction ID</th>
              <th className="px-4 py-3">User Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No transactions match filters.</td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const displayType = getDisplayTransactionType(row.type, row.description)

                return (
                  <tr key={row.id} className="border-b border-border/70 text-foreground">
                    <td className="px-4 py-3">{new Date(row.created_at).toLocaleString("en-GB", { timeZone: "UTC" })}</td>
                    <td className="px-4 py-3">{row.id}</td>
                    <td className="px-4 py-3">{row.user_full_name?.trim() || `User ${row.user_id.slice(0, 8)}`}</td>
                    <td className={`px-4 py-3 font-medium ${displayType === "credit" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>{displayType}</td>
                    <td className="px-4 py-3">{formatCurrency(row.amount)}</td>
                    <td className="px-4 py-3">{row.description || "-"}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredRows.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <p>
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-foreground">Page {currentPage} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}