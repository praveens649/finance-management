import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Summary = {
  total_income: number
  total_expense: number
  net: number
  total_users: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(summary.total_income)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Total Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{formatCurrency(summary.total_expense)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Net Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${summary.net >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
            {formatCurrency(summary.net)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{summary.total_users.toLocaleString("en-IN")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
