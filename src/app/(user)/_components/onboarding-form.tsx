"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, Landmark, Loader2, IndianRupee } from "lucide-react"
import { createOnboardAccountAction } from "../_actions/account.actions"
import { toast } from "sonner"

export function OnboardingForm() {
  const [isPending, startTransition] = useTransition()
  const [selectedType, setSelectedType] = useState<"cash" | "bank" | "wallet">("bank")
  const [name, setName] = useState("")
  const [initialBalance, setInitialBalance] = useState("")

  function setSuggestion(suggestedName: string, type: "cash" | "bank" | "wallet") {
    setName(suggestedName)
    setSelectedType(type)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter an account name")
      return
    }

    const parsedBalance = parseFloat(initialBalance)
    const initial_balance = isNaN(parsedBalance) || initialBalance.trim() === "" ? 0 : parsedBalance

    if (initial_balance < 0) {
      toast.error("Initial balance cannot be negative")
      return
    }

    startTransition(async () => {
      const result = await createOnboardAccountAction({
        name: name.trim(),
        type: selectedType,
        currency: "INR",
        initial_balance,
      })

      if (result.success) {
        if (result.warning) {
          toast.warning("Account created, but initial balance could not be set. You can add it as a transaction.")
        } else {
          toast.success(
            initial_balance > 0
              ? `Account created with ₹${initial_balance.toLocaleString("en-IN")} opening balance!`
              : "Account created successfully!"
          )
        }
      } else {
        toast.error(result.error ?? "Failed to create account. Please try again.")
      }
    })
  }

  const isLoading = isPending

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/5 bg-background/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Create your first account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You need at least one account to track transactions. Add your opening balance to start right.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="account-name">Account Name</Label>
            <Input
              id="account-name"
              placeholder="e.g. Main Savings"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              disabled={isLoading}
              className="h-12 bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Suggestions</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSuggestion("Cash", "cash")}
                disabled={isLoading}
                className={`flex h-14 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all
                  ${selectedType === "cash" && name === "Cash"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
              >
                <Wallet className="h-4 w-4" />
                Cash Wallet
              </button>
              <button
                type="button"
                onClick={() => setSuggestion("Bank", "bank")}
                disabled={isLoading}
                className={`flex h-14 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all
                  ${selectedType === "bank" && name === "Bank"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
              >
                <Landmark className="h-4 w-4" />
                Bank Account
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial-balance">
              Opening Balance{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="initial-balance"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                disabled={isLoading}
                className="h-12 bg-background/50 pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              If you already have money here, enter it now. We&apos;ll record it as a credit transaction.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up your account...
              </>
            ) : (
              "Create Account & Continue"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

