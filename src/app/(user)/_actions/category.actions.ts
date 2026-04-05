"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createCategoryService } from "../../../../models/services/category.service"
import { CreateCategoryPayload } from "../../../../models/schemas/categories.schema"

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
          }
        },
      },
    }
  )
}

export async function createUserCategoryAction(payload: CreateCategoryPayload) {
  try {
    const supabase = await buildSupabaseClient()
    const categoryService = createCategoryService(supabase)
    const { data, error } = await categoryService.createCategory(payload)

    if (error || !data) {
      return { success: false, error: error ?? "Unable to create category." }
    }

    revalidatePath("/user")
    return { success: true, data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred."
    return { success: false, error: message }
  }
}
