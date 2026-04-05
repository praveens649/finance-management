"use client"

import { ReactNode, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Shield } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"
import { AuthService } from "../../../models/services/auth.service"

export default function AnalystLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const isLoginPage = pathname === "/analyst/login"
  async function handleSignOut() {
    setSigningOut(true)

    try {
      await AuthService.signOut()
      router.push("/")
      router.refresh()
    } catch {
      toast.error("Failed to sign out. Please try again.")
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      {!isLoginPage && user ? (
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-foreground">Analyst Workspace</p>
                <p className="text-xs text-muted-foreground">System-wide analytics dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">Analyst Access</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {isLoading ? "Loading access..." : user?.email || "No email available"}
                  </p>
                </div>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Read-only
                </span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </header>
      ) : null}

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  )
}
