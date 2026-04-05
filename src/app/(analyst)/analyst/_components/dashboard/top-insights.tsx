import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type MonthlyRow = {
  month: string
  income: number
  expense: number
}

type CategoryRow = {
  category_id: string | null
  category_name: string
  total: number
}

type Summary = {
  total_income: number
  total_expense: number
  net: number
  total_users: number
}

function formatMonth(month: string) {
  const date = new Date(month)
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date)
}

export function TopInsights({ summary, monthly, categories }: { summary: Summary; monthly: MonthlyRow[]; categories: CategoryRow[] }) {
  const insights: string[] = []

  const topCategory = [...categories].sort((a, b) => b.total - a.total)[0]
  if (topCategory) {
    insights.push(`Highest spending category: ${topCategory.category_name}.`)
  }

  const peakExpenseMonth = [...monthly].sort((a, b) => b.expense - a.expense)[0]
  if (peakExpenseMonth) {
    insights.push(`Expenses peaked in ${formatMonth(peakExpenseMonth.month)}.`)
  }

  if (monthly.length >= 2) {
    const previous = monthly[monthly.length - 2]
    const current = monthly[monthly.length - 1]
    const base = Math.max(1, previous.income)
    const deltaPercent = ((current.income - previous.income) / base) * 100

    if (deltaPercent > 0) {
      insights.push(`Income increased by ${deltaPercent.toFixed(1)}% compared to last month.`)
    } else if (deltaPercent < 0) {
      insights.push(`Income decreased by ${Math.abs(deltaPercent).toFixed(1)}% compared to last month.`)
    }
  }

  if (summary.net < 0) {
    insights.push("Overall net flow is negative for the selected period.")
  }

  if (insights.length === 0) {
    insights.push("No strong trend detected yet. Add more data for deeper insights.")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-foreground">
          {insights.map((insight) => (
            <li key={insight} className="rounded-lg border border-border bg-background px-3 py-2">
              {insight}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
