"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { ArrowRightLeft, Loader2, ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react"
import { Account } from "../../../../models/schemas/account.schema"
import { Category } from "../../../../models/schemas/categories.schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createUserTransactionAction, createUserTransferAction } from "../_actions/transaction.actions"

type ComposerMode = "self" | "transfer"
type EntryType = "credit" | "debit"

interface TransactionComposerProps {
  accounts: Account[]
  categories: Category[]
}

export function TransactionComposer({ accounts, categories }: TransactionComposerProps) {
  const [mode, setMode] = useState<ComposerMode>("self")
  const [isPending, startTransition] = useTransition()

  const [selfAccountId, setSelfAccountId] = useState(accounts[0]?.id ?? "")
  const [selfType, setSelfType] = useState<EntryType>("debit")
  const [selfCategoryId, setSelfCategoryId] = useState("")
  const [selfAmount, setSelfAmount] = useState("")
  const [selfDescription, setSelfDescription] = useState("")

  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id ?? "")
  const [destinationAccountId, setDestinationAccountId] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferDescription, setTransferDescription] = useState("")

  const formatCurrency = (amount: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(amount)

  const selectedSourceAccount = useMemo(
    () => accounts.find((account) => account.id === sourceAccountId),
    [accounts, sourceAccountId]
  )

  const transferDestinationAccounts = useMemo(() => {
    if (!selectedSourceAccount) {
      return accounts.filter((account) => account.id !== sourceAccountId)
    }

    return accounts.filter(
      (account) =>
        account.id !== sourceAccountId && account.currency === selectedSourceAccount.currency
    )
  }, [accounts, selectedSourceAccount, sourceAccountId])

  const selfCategories = useMemo(
    () => categories.filter((category) => category.type === (selfType === "credit" ? "income" : "expense")),
    [categories, selfType]
  )

  useEffect(() => {
    if (mode !== "transfer") {
      return
    }

    if (
      destinationAccountId &&
      !transferDestinationAccounts.some((account) => account.id === destinationAccountId)
    ) {
      setDestinationAccountId("")
    }
  }, [destinationAccountId, mode, transferDestinationAccounts])

  useEffect(() => {
    if (selfCategoryId && !selfCategories.some((category) => category.id === selfCategoryId)) {
      setSelfCategoryId("")
    }
  }, [selfCategories, selfCategoryId])

  function resetSelfForm() {
    setSelfAmount("")
    setSelfDescription("")
    setSelfCategoryId("")
  }

  function resetTransferForm() {
    setTransferAmount("")
    setTransferDescription("")
    setDestinationAccountId("")
  }

  function handleSelfSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!selfAccountId) {
      toast.error("Select an account first")
      return
    }

    const amount = Number.parseFloat(selfAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount")
      return
    }

    startTransition(async () => {
      const result = await createUserTransactionAction({
        account_id: selfAccountId,
        category_id: selfCategoryId || null,
        type: selfType,
        amount,
        description: selfDescription.trim() || undefined,
      })

      if (!result.success) {
        toast.error(result.error ?? "Failed to save transaction")
        return
      }

      toast.success("Transaction saved")
      resetSelfForm()
    })
  }

  function handleTransferSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!sourceAccountId || !destinationAccountId) {
      toast.error("Select both source and destination accounts")
      return
    }

    if (sourceAccountId === destinationAccountId) {
      toast.error("Source and destination accounts must be different")
      return
    }

    const amount = Number.parseFloat(transferAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid transfer amount")
      return
    }

    startTransition(async () => {
      const result = await createUserTransferAction({
        source_account_id: sourceAccountId,
        destination_account_id: destinationAccountId,
        amount,
        description: transferDescription.trim() || undefined,
      })

      if (!result.success) {
        toast.error(result.error ?? "Failed to create transfer")
        return
      }

      toast.success("Transfer completed")
      resetTransferForm()
    })
  }

  if (accounts.length === 0) {
    return null
  }

  return (
    <section
      id="transaction-composer"
      className="rounded-3xl border border-white/5 bg-background/50 p-6 shadow-2xl backdrop-blur-xl md:p-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            New entry
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Record a transaction or transfer</h2>
          <p className="text-sm text-muted-foreground">
            Self entries update one account. Transfers move money between your own accounts atomically.
          </p>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 rounded-2xl border border-white/10 bg-black/10 p-1">
          <button
            type="button"
            onClick={() => setMode("self")}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${mode === "self"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
          >
            <Wallet className="h-4 w-4" />
            Self
          </button>
          <button
            type="button"
            onClick={() => setMode("transfer")}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${mode === "transfer"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Other
          </button>
        </div>
      </div>

      <Separator className="my-6 bg-white/10" />

      {mode === "self" ? (
        <form onSubmit={handleSelfSubmit} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-1">
            <Label htmlFor="self-account">Account</Label>
            <select
              id="self-account"
              value={selfAccountId}
              onChange={(event) => setSelfAccountId(event.target.value)}
              disabled={isPending}
              className="h-12 w-full rounded-lg border border-white/10 bg-background px-3 text-sm outline-none transition focus:border-primary/50 disabled:opacity-50"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatCurrency(Number(account.balance), account.currency)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Direction</Label>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setSelfType("debit")}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${selfType === "debit"
                  ? "bg-rose-500/15 text-rose-300"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Debit
              </button>
              <button
                type="button"
                onClick={() => setSelfType("credit")}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${selfType === "credit"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
              >
                <ArrowDownRight className="h-4 w-4" />
                Credit
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="self-category">Category</Label>
            <select
              id="self-category"
              value={selfCategoryId}
              onChange={(event) => setSelfCategoryId(event.target.value)}
              disabled={isPending || selfCategories.length === 0}
              className="h-12 w-full rounded-lg border border-white/10 bg-background px-3 text-sm outline-none transition focus:border-primary/50 disabled:opacity-50"
            >
              <option value="">No category</option>
              {selfCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {selfCategories.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No matching categories found for this direction.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="self-amount">Amount</Label>
            <Input
              id="self-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={selfAmount}
              onChange={(event) => setSelfAmount(event.target.value)}
              disabled={isPending}
              className="h-12 bg-background/60"
            />
          </div>

          <div className="space-y-2 xl:col-span-4">
            <Label htmlFor="self-description">Description</Label>
            <Input
              id="self-description"
              placeholder="Optional note"
              value={selfDescription}
              onChange={(event) => setSelfDescription(event.target.value)}
              disabled={isPending}
              className="h-12 bg-background/60"
            />
          </div>

          <div className="xl:col-span-4 flex justify-end">
            <Button type="submit" className="h-12 px-6" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save transaction
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleTransferSubmit} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="source-account">Source account</Label>
            <select
              id="source-account"
              value={sourceAccountId}
              onChange={(event) => {
                setSourceAccountId(event.target.value)
                setDestinationAccountId("")
              }}
              disabled={isPending}
              className="h-12 w-full rounded-lg border border-white/10 bg-background px-3 text-sm outline-none transition focus:border-primary/50 disabled:opacity-50"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.currency}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination-account">Destination account</Label>
            <select
              id="destination-account"
              value={destinationAccountId}
              onChange={(event) => setDestinationAccountId(event.target.value)}
              disabled={isPending || transferDestinationAccounts.length === 0}
              className="h-12 w-full rounded-lg border border-white/10 bg-background px-3 text-sm outline-none transition focus:border-primary/50 disabled:opacity-50"
            >
              <option value="">Select destination</option>
              {transferDestinationAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.currency}
                </option>
              ))}
            </select>
            {selectedSourceAccount ? (
              <p className="text-xs text-muted-foreground">
                Destination accounts are limited to the same currency as {selectedSourceAccount.name}.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount</Label>
            <Input
              id="transfer-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={transferAmount}
              onChange={(event) => setTransferAmount(event.target.value)}
              disabled={isPending}
              className="h-12 bg-background/60"
            />
          </div>

          <div className="space-y-2 xl:col-span-4">
            <Label htmlFor="transfer-description">Description</Label>
            <Input
              id="transfer-description"
              placeholder="Optional note"
              value={transferDescription}
              onChange={(event) => setTransferDescription(event.target.value)}
              disabled={isPending}
              className="h-12 bg-background/60"
            />
          </div>

          <div className="xl:col-span-4 flex justify-end">
            <Button type="submit" className="h-12 px-6" disabled={isPending || transferDestinationAccounts.length === 0}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Move money
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}