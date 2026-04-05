import { AdminUsersPanel } from "../../_components/admin-users-panel"

export default function AdminUsersPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">Manage user role, status, and account lifecycle.</p>
      </div>
      <AdminUsersPanel />
    </div>
  )
}