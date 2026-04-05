"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SummaryCards } from "./dashboard/summary-cards"
import { MonthlyTrendChart } from "./dashboard/monthly-trend-chart"
import { CategoryBreakdown } from "./dashboard/category-breakdown"
import { TopInsights } from "./dashboard/top-insights"
import { AuthService } from "../../../../../models/services/auth.service"

type DashboardPayload = {
  summary: {
    total_income: number
    total_expense: number
    net: number
    total_users: number
  }
  monthly: Array<{
    month: string
    income: number
    expense: number
  }>
  categories: Array<{
    category_id: string | null
    category_name: string
    total: number
  }>
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-xl xl:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  )
}

export function AnalystDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    setError(null)

    try {
      await AuthService.signOut()
      router.push("/")
      router.refresh()
    } catch {
      setSigningOut(false)
      setError("Failed to sign out. Please try again.")
    }
  }

  const signOutButton = (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50"
      >
        {signingOut ? "Signing out..." : "Sign out"}
      </button>
    </div>
  )

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/analyst/dashboard", { cache: "no-store" })
        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.error || "Failed to load analytics")
        }

        if (!cancelled) {
          setDashboard(json.data ?? null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load analytics")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {signOutButton}
        <DashboardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        {signOutButton}
        <Card>
          <CardHeader>
            <CardTitle>Failed to load analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboard || (dashboard.summary.total_income === 0 && dashboard.summary.total_expense === 0 && dashboard.monthly.length === 0)) {
    return (
      <div className="space-y-4">
        {signOutButton}
        <Card>
          <CardHeader>
            <CardTitle>No data available for analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Start tracking transactions to unlock system-wide insights.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {signOutButton}
      <SummaryCards summary={dashboard.summary} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MonthlyTrendChart monthly={dashboard.monthly} />
        </div>
        <CategoryBreakdown categories={dashboard.categories} />
      </div>

      <TopInsights summary={dashboard.summary} monthly={dashboard.monthly} categories={dashboard.categories} />
    </div>
  )
}
