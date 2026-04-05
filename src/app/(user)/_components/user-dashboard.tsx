"use client"

import { Account } from "../../../../models/schemas/account.schema"
import { Transaction } from "../../../../models/schemas/transaction.schema"
import { Category } from "../../../../models/schemas/categories.schema"
import { Button } from "@/components/ui/button"
import { PlusCircle, Wallet, ArrowUpRight, ArrowDownRight, CreditCard, LayoutDashboard } from "lucide-react"
import { AccountManager } from "./account-manager"
import { TransactionComposer } from "./transaction-composer"
import { CategoryManager } from "./category-manager"

interface UserDashboardProps {
  accounts: Account[]
  recentTransactions: Transaction[]
  categories: Category[]
}

export function UserDashboard({ accounts, recentTransactions, categories }: UserDashboardProps) {
  const totalBalance = accounts.reduce((acc, account) => acc + Number(account.balance), 0)

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(amount)
  }

  const formatTransactionDate = (value: Date | string) => {
    const date = new Date(value)

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(date)
  }

  const getTransactionTitle = (tx: Transaction) => {
    const description = tx.description?.trim()

    if (!description) {
      return "Transfer"
    }

    const sentMatch = description.match(/^Self Transfer to (.+?) \[TRF-/)
    if (sentMatch) {
      return `Received to ${sentMatch[1]}`
    }

    const receivedMatch = description.match(/^Self Transfer from (.+?) \[TRF-/)
    if (receivedMatch) {
      return `Sent from ${receivedMatch[1]}`
    }

    return description
  }

  const getTransactionDisplayType = (tx: Transaction) => {
    const description = tx.description?.trim() ?? ""

    if (/^Self Transfer to .+? \[TRF-/.test(description)) {
      return "credit"
    }

    if (/^Self Transfer from .+? \[TRF-/.test(description)) {
      return "debit"
    }

    return tx.type
  }

  return (
    <div className="space-y-8 pb-12">
      <section className="flex flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {formatCurrency(totalBalance)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Total balance across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </p>
        </div>
      </section>

      <AccountManager accounts={accounts} />

      <CategoryManager categories={categories} />

      <TransactionComposer accounts={accounts} categories={categories} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">My Accounts</h2>
          </div>
          
          <div className="grid gap-4">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-background/40 p-6 backdrop-blur-md transition-all hover:bg-background/60 hover:border-primary/20"
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {account.type === 'cash' ? <Wallet size={24} /> : <CreditCard size={24} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{account.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{formatCurrency(Number(account.balance), account.currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Recent Transactions</h2>
            {recentTransactions.length > 0 && (
              <Button variant="link" className="text-sm text-muted-foreground">View all</Button>
            )}
          </div>
          
          <div className="rounded-2xl border border-white/5 bg-background/40 backdrop-blur-md overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
                  <PlusCircle className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold">No transactions yet</h3>
                <p className="mb-6 mt-2 max-w-sm text-sm text-muted-foreground">
                  Your transaction history is empty. Start by adding a transaction to track your expenses and income.
                </p>
                <Button variant="outline" className="gap-2 rounded-full px-6">
                  <PlusCircle className="h-4 w-4" />
                  Create your first transaction
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                    {(() => {
                      const isCredit = getTransactionDisplayType(tx) === 'credit'

                      return (
                        <>
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCredit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {isCredit ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                            </div>
                            <div>
                              <p className="font-medium">{getTransactionTitle(tx)}</p>
                              <p className={`text-xs font-medium ${isCredit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isCredit ? 'Credit' : 'Debit'}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatTransactionDate(tx.created_at)}</p>
                            </div>
                          </div>
                          <div className={`font-semibold ${isCredit ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

