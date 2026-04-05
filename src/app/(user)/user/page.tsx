import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createAccountService } from "../../../../models/services/account.service"
import { createTransactionService } from "../../../../models/services/transaction.service"
import { createCategoryService } from "../../../../models/services/category.service"
import { OnboardingForm } from "../_components/onboarding-form"
import { UserDashboard } from "../_components/user-dashboard"

export const dynamic = 'force-dynamic'

export default async function UserPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const accountService = createAccountService(supabase)
  const transactionService = createTransactionService(supabase)
  const categoryService = createCategoryService(supabase)
  
  const { data: accounts, error } = await accountService.getUserAccounts()

  if (error || !accounts) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
         <h2 className="text-2xl font-bold">Error loading dashboard</h2>
         <p className="text-muted-foreground mt-2">{error || "Could not retrieve user data."}</p>
      </div>
    )
  }

  if (accounts.length === 0) {
    return <OnboardingForm />
  }

  const { data: categories } = await categoryService.getUserCategories()
  const { data: recentTransactions } = await transactionService.getRecentTransactions(8)
  const safeCategories = categories ?? []
  const safeRecentTransactions = recentTransactions ?? []

  return (
    <UserDashboard 
      accounts={accounts} 
      recentTransactions={safeRecentTransactions} 
      categories={safeCategories}
    />
  )
}

