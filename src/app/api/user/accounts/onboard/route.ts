import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { onboardAccountSchema } from "../../../../../../models/schemas/account.schema";
import { createAccountService } from "../../../../../../models/services/account.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = onboardAccountSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
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
            }
          },
        },
      }
    );

    const accountService = createAccountService(supabase);
    const { data, error } = await accountService.createAccountWithInitialBalance(parsed.data);

    if (error && !data) {
      return Response.json({ success: false, error }, { status: 422 });
    }

    if (error && data) {
      return Response.json(
        { success: true, data, warning: error },
        { status: 207 }
      );
    }

    return Response.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/user/accounts/onboard error:", err);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

