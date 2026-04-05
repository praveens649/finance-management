import { createClient as createUserClient } from "../../../../../lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function getAnalystClients() {
  const userClient = await createUserClient()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase analyst environment configuration.")
  }

  const serviceRoleClient = createSupabaseClient(
    supabaseUrl,
    serviceRoleKey
  )

  return { userClient, serviceRoleClient }
}
