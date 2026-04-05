"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createTransactionService } from "../../../../models/services/transaction.service"
import { createTransferService } from "../../../../models/services/transfer.service"
import { CreateTransactionPayload } from "../../../../models/schemas/transaction.schema"
import { TransferPayload } from "../../../../models/schemas/transfer.schema"

async function buildSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Safe to ignore in server component contexts.
          }
        },
      },
    }
  )
}

export async function createUserTransactionAction(payload: CreateTransactionPayload) {
  try {
    const supabase = await buildSupabaseClient()
    const transactionService = createTransactionService(supabase)
    const { data, error } = await transactionService.createTransaction(payload)

    if (error || !data) {
      return { success: false, error: error ?? "Unable to create transaction." }
    }

    revalidatePath("/user")
    return { success: true, data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred."
    return { success: false, error: message }
  }
}

export async function createUserTransferAction(payload: TransferPayload) {
  try {
    const supabase = await buildSupabaseClient()
    const transferService = createTransferService(supabase)
    const result = await transferService.createTransfer(payload)

    if (!result.success) {
      return { success: false, error: result.error ?? "Unable to create transfer." }
    }

    revalidatePath("/user")
    return { success: true, transferReference: result.transferReference }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred."
    return { success: false, error: message }
  }
}