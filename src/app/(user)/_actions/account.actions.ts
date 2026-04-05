"use server"

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { OnboardAccountPayload } from "../../../../models/schemas/account.schema";
import { createAccountService } from "../../../../models/services/account.service";

/**
 * Shared helper — builds a Supabase client with the current request's cookies.
 * Server Actions have full access to next/headers, so session is always included.
 */
async function buildSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Safe to ignore when called from a Server Component context
          }
        },
      },
    }
  );
}

/**
 * Server Action: createOnboardAccountAction
 *
 * Calls the service directly (NO intermediate fetch) so the authenticated
 * session cookies are automatically available via next/headers.
 *
 * On success, revalidatePath('/user') causes Next.js to re-render the
 * server page and switch from <OnboardingForm> to <UserDashboard>.
 */
export async function createOnboardAccountAction(payload: OnboardAccountPayload) {
  try {
    const supabase = await buildSupabaseClient();
    const accountService = createAccountService(supabase);
    const { data, error } = await accountService.createAccountWithInitialBalance(payload);

    if (error && !data) {
      return { success: false, error };
    }

    if (error && data) {
      // Account created but initial balance transaction failed (soft failure)
      revalidatePath("/user");
      return { success: true, data, warning: error };
    }

    revalidatePath("/user");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}
