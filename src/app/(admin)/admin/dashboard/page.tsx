import { AdminOverviewPanel } from "../../_components/admin-overview-panel"

export default function DashboardPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">System overview, quick actions, and latest transaction activity.</p>
      </div>
      <AdminOverviewPanel />
    </div>
  )
}