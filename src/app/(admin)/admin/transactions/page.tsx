import { AdminTransactionsPanel } from "../../_components/admin-transactions-panel"

export default function AdminTransactionsPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-sm text-muted-foreground">Audit system-wide transaction flow with filters.</p>
      </div>
      <AdminTransactionsPanel />
    </div>
  )
}