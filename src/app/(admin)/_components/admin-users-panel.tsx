"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

type AdminUser = {
  id: string
  full_name: string | null
  role: "user" | "analyst" | "admin"
  is_active: boolean
}

type UserDetails = {
  profile: AdminUser
  accounts: Array<{ id: string; name: string; type: string; balance: number; currency: string }>
  transactions: Array<{ id: string; type: "credit" | "debit"; amount: number; description: string | null; created_at: string }>
}

type PendingAction =
  | {
      kind: "toggle"
      userId: string
      title: string
      description: string
      confirmLabel: string
    }
  | {
      kind: "delete"
      userId: string
      title: string
      description: string
      confirmLabel: string
    }
  | {
      kind: "role"
      userId: string
      nextRole: "user" | "analyst" | "admin"
      title: string
      description: string
      confirmLabel: string
    }

function formatCurrency(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value)
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

export function AdminUsersPanel() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [details, setDetails] = useState<UserDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/admin/users", { cache: "no-store" })
        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.error || "Failed to load users")
        }

        if (!cancelled) {
          const nextUsers = json.data ?? []
          setUsers(nextUsers)
          setSelectedUserId((prev) => prev ?? nextUsers[0]?.id ?? null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load users")
          toast.error(err instanceof Error ? err.message : "Failed to load users")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadUsers()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDetails() {
      if (!selectedUserId) {
        setDetails(null)
        return
      }

      setDetailsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/users/${selectedUserId}/details`, { cache: "no-store" })
        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.error || "Failed to load user details")
        }

        if (!cancelled) {
          setDetails(json.data ?? null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load user details")
          toast.error(err instanceof Error ? err.message : "Failed to load user details")
        }
      } finally {
        if (!cancelled) {
          setDetailsLoading(false)
        }
      }
    }

    loadDetails()
    return () => {
      cancelled = true
    }
  }, [selectedUserId])

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [users, selectedUserId])

  async function toggleUser(userId: string) {
    const response = await fetch(`/api/admin/users/${userId}/toggle`, { method: "PATCH" })
    const json = await response.json()

    if (!response.ok) {
      throw new Error(json.error || "Failed to toggle user")
    }

    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, is_active: json.data.is_active } : user)))
    if (details?.profile.id === userId) {
      setDetails({ ...details, profile: { ...details.profile, is_active: json.data.is_active } })
    }
  }

  async function deleteUser(userId: string) {
    const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
    const json = await response.json()

    if (!response.ok) {
      throw new Error(json.error || "Failed to delete user")
    }

    setUsers((prev) => prev.filter((user) => user.id !== userId))
    if (selectedUserId === userId) {
      setSelectedUserId(null)
      setDetails(null)
    }
  }

  async function updateRole(userId: string, role: "user" | "analyst" | "admin") {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    const json = await response.json()

    if (!response.ok) {
      throw new Error(json.error || "Failed to update role")
    }

    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: json.data.role } : user)))
    if (details?.profile.id === userId) {
      setDetails({ ...details, profile: { ...details.profile, role: json.data.role } })
    }
  }

  function handleToggle(userId: string) {
    const user = users.find((entry) => entry.id === userId)
    if (!user) {
      return
    }

    setPendingAction({
      kind: "toggle",
      userId,
      title: `${user.is_active ? "Deactivate" : "Activate"} user`,
      description: `Are you sure you want to ${user.is_active ? "deactivate" : "activate"} ${user.full_name || `User ${user.id.slice(0, 8)}`}?`,
      confirmLabel: user.is_active ? "Deactivate" : "Activate",
    })
  }

  function handleDelete(userId: string) {
    const user = users.find((entry) => entry.id === userId)
    if (!user) {
      return
    }

    setPendingAction({
      kind: "delete",
      userId,
      title: "Delete user",
      description: `Delete ${user.full_name || `User ${user.id.slice(0, 8)}`} and all related data? This action cannot be undone.`,
      confirmLabel: "Delete",
    })
  }

  function handleRoleChange(userId: string, role: "user" | "analyst" | "admin") {
    const user = users.find((entry) => entry.id === userId)
    if (!user || user.role === role) {
      return
    }

    setPendingAction({
      kind: "role",
      userId,
      nextRole: role,
      title: "Change user role",
      description: `Change role for ${user.full_name || `User ${user.id.slice(0, 8)}`} from ${user.role} to ${role}?`,
      confirmLabel: "Change role",
    })
  }

  async function confirmAction() {
    if (!pendingAction) {
      return
    }

    try {
      setActionLoading(true)
      setError(null)

      if (pendingAction.kind === "toggle") {
        await toggleUser(pendingAction.userId)
        toast.success("User status updated")
      }

      if (pendingAction.kind === "delete") {
        await deleteUser(pendingAction.userId)
        toast.success("User deleted")
      }

      if (pendingAction.kind === "role") {
        await updateRole(pendingAction.userId, pendingAction.nextRole)
        toast.success(`Role updated to ${pendingAction.nextRole}`)
      }

      setPendingAction(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed"
      setError(message)
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-foreground shadow-sm">Loading users...</div>
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Users</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left ${selectedUserId === user.id
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-background hover:bg-accent/60"
                  }`}
              >
                <p className="text-sm font-medium text-foreground">{user.full_name || `User ${user.id.slice(0, 8)}`}</p>
                <p className="mt-1 text-xs text-muted-foreground">{user.role} • {user.is_active ? "active" : "inactive"}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-foreground">User Management</h2>
          {!selectedUser ? (
            <p className="text-sm text-muted-foreground">Select a user to manage.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-sm font-medium text-foreground">{selectedUser.full_name || `User ${selectedUser.id.slice(0, 8)}`}</p>
                <p className="mt-1 text-xs text-muted-foreground">ID: {selectedUser.id}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/users/${selectedUser.id}`}
                    className="rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                  >
                    Open Drilldown
                  </Link>
                  <select
                    value={selectedUser.role}
                    onChange={(event) => handleRoleChange(selectedUser.id, event.target.value as "user" | "analyst" | "admin")}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    disabled={actionLoading}
                  >
                    <option value="user">User</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleToggle(selectedUser.id)}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground hover:bg-accent"
                    disabled={actionLoading}
                  >
                    {selectedUser.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedUser.id)}
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="mb-2 text-sm font-semibold text-foreground">Accounts</p>
                  {detailsLoading ? (
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  ) : details?.accounts.length ? (
                    <div className="space-y-2">
                      {details.accounts.map((account) => (
                        <div key={account.id} className="rounded-lg border border-border px-2 py-2 text-xs text-foreground">
                          <p className="font-medium">{account.name}</p>
                          <p className="text-muted-foreground">{account.type} • {formatCurrency(Number(account.balance), account.currency)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No accounts.</p>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="mb-2 text-sm font-semibold text-foreground">Recent Transactions</p>
                  {detailsLoading ? (
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  ) : details?.transactions.length ? (
                    <div className="space-y-2">
                      {details.transactions.slice(0, 8).map((tx) => {
                        const displayType = getDisplayTransactionType(tx.type, tx.description)

                        return (
                          <div key={tx.id} className="rounded-lg border border-border px-2 py-2 text-xs text-foreground">
                            <p className="font-medium">{tx.description || "No description"}</p>
                            <p className={displayType === "credit" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}>
                              {displayType === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No transactions.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">{pendingAction.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{pendingAction.description}</p>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={actionLoading}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction}
                disabled={actionLoading}
                className={`rounded-lg px-3 py-2 text-sm disabled:opacity-50 ${pendingAction.kind === "delete"
                  ? "border border-destructive/50 bg-destructive/10 text-destructive"
                  : "border border-primary bg-primary text-primary-foreground"}`}
              >
                {actionLoading ? "Processing..." : pendingAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
