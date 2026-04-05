"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Wallet, Landmark, CreditCard, Loader2, Plus } from "lucide-react"
import { Account } from "../../../../models/schemas/account.schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createUserAccountAction } from "../_actions/dashboard-account.actions"

interface AccountManagerProps {
  accounts: Account[]
}

export function AccountManager({ accounts }: AccountManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [type, setType] = useState<"cash" | "bank" | "wallet">("bank")
  const [currency, setCurrency] = useState("INR")
  const [initialBalance, setInitialBalance] = useState("")

  function resetForm() {
    setName("")
    setType("bank")
    setCurrency("INR")
    setInitialBalance("")
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter an account name")
      return
    }

    const parsedBalance = Number.parseFloat(initialBalance)
    const openingBalance = Number.isFinite(parsedBalance) && parsedBalance > 0 ? parsedBalance : 0

    startTransition(async () => {
      const result = await createUserAccountAction({
        name: name.trim(),
        type,
        currency: currency.trim().toUpperCase() || "INR",
        initial_balance: openingBalance,
      })

      if (!result.success) {
        toast.error(result.error ?? "Failed to create account")
        return
      }

      toast.success(openingBalance > 0 ? "Account created with opening balance" : "Account created")
      resetForm()
    })
  }

  return (
    <section className="rounded-3xl border border-white/5 bg-background/50 p-6 shadow-2xl backdrop-blur-xl md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Accounts
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Add a new account</h2>
          <p className="text-sm text-muted-foreground">
            Create multiple accounts for cash, bank, or wallet balances and use them in self transactions or transfers.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-4 py-2 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4" />
          {accounts.length} active
        </div>
      </div>

      <Separator className="my-6 bg-white/10" />

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2 xl:col-span-1">
          <Label htmlFor="account-name">Account name</Label>
          <Input
            id="account-name"
            placeholder="e.g. Savings, Cash, Main Bank"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
            className="h-12 bg-background/60"
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setType("cash")}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${type === "cash"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              disabled={isPending}
            >
              <Wallet className="h-4 w-4" />
              Cash
            </button>
            <button
              type="button"
              onClick={() => setType("bank")}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${type === "bank"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              disabled={isPending}
            >
              <Landmark className="h-4 w-4" />
              Bank
            </button>
            <button
              type="button"
              onClick={() => setType("wallet")}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${type === "wallet"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              disabled={isPending}
            >
              <CreditCard className="h-4 w-4" />
              Wallet
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            placeholder="INR"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            disabled={isPending}
            className="h-12 bg-background/60 uppercase"
            maxLength={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="opening-balance">Opening balance</Label>
          <Input
            id="opening-balance"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={initialBalance}
            onChange={(event) => setInitialBalance(event.target.value)}
            disabled={isPending}
            className="h-12 bg-background/60"
          />
        </div>

        <div className="md:col-span-2 xl:col-span-4 flex justify-end">
          <Button type="submit" className="h-12 px-6" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add account
          </Button>
        </div>
      </form>
    </section>
  )
}