import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type MonthlyRow = {
  month: string
  income: number
  expense: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatMonthLabel(month: string) {
  const date = new Date(month)
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(date)
}

export function MonthlyTrendChart({ monthly }: { monthly: MonthlyRow[] }) {
  const maxValue = Math.max(1, ...monthly.map((row) => Math.max(row.income, row.expense)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {!monthly.length ? (
          <p className="text-sm text-muted-foreground">No monthly trend data available.</p>
        ) : (
          <div className="space-y-3">
            {monthly.map((row) => (
              <div key={row.month} className="space-y-1 rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatMonthLabel(row.month)}</span>
                  <span>{formatCurrency(row.income)} / {formatCurrency(row.expense)}</span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 rounded bg-muted">
                    <div className="h-2 rounded bg-emerald-600 dark:bg-emerald-400" style={{ width: `${Math.max(4, (row.income / maxValue) * 100)}%` }} />
                  </div>
                  <div className="h-2 rounded bg-muted">
                    <div className="h-2 rounded bg-rose-600 dark:bg-rose-400" style={{ width: `${Math.max(4, (row.expense / maxValue) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
