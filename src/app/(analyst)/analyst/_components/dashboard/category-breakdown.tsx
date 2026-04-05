import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CategoryRow = {
  category_id: string | null
  category_name: string
  total: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

const PIE_COLORS = ["#e11d48", "#fb7185", "#f97316", "#f59e0b", "#84cc16", "#14b8a6", "#3b82f6"]

export function CategoryBreakdown({ categories }: { categories: CategoryRow[] }) {
  const total = categories.reduce((acc, row) => acc + row.total, 0)

  let cursor = 0
  const slices = categories.map((row, index) => {
    const percent = total > 0 ? (row.total / total) * 100 : 0
    const start = cursor
    const end = cursor + percent
    cursor = end

    return {
      ...row,
      color: PIE_COLORS[index % PIE_COLORS.length],
      percent,
      start,
      end,
    }
  })

  const gradient = slices.length
    ? `conic-gradient(${slices.map((slice) => `${slice.color} ${slice.start.toFixed(2)}% ${slice.end.toFixed(2)}%`).join(", ")})`
    : "conic-gradient(#e5e7eb 0% 100%)"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {!categories.length ? (
          <p className="text-sm text-muted-foreground">No expense categories available.</p>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto h-44 w-44 rounded-full border border-border" style={{ background: gradient }} />

            <div className="space-y-2">
              {slices.map((slice) => (
                <div key={slice.category_id ?? "self-transfer"} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                    <span>{slice.category_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatCurrency(slice.total)}</p>
                    <p className="text-muted-foreground">{slice.percent.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
