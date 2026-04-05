import { AdminAnalyticsPanel } from "../../_components/admin-analytics-panel"

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">User-wise income and expense drilldown with weekly/monthly views.</p>
      </div>
      <AdminAnalyticsPanel />
    </div>
  )
}