"use client"

import { ReactNode, useState } from "react"
import { Shield, LogOut } from "lucide-react"
import { AuthService } from "../../../models/services/auth.service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function UserLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await AuthService.signOut()
      router.push("/")
    } catch {
      toast.error("Failed to sign out. Please try again.")
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col items-center">
      <header className="w-full max-w-7xl px-4 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="p-1.5 bg-primary/20 rounded-md text-primary">
            <Shield size={20} />
          </div>
          Finance<span className="text-primary">Hub</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-sm text-muted-foreground transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={15} />
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl px-4 py-8 md:py-12">
        {children}
      </main>
    </div>
  )
}

