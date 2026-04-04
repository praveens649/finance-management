import { AuthService } from "@/services/auth/auth.service"

import type { CurrentUserProfile } from "../_types/current-user-profile"

type GetCurrentUserProfilePayload = {
  userId: string
  email: string | null
}

export const getCurrentUserProfileClientQuery = async ({
  userId,
  email,
}: GetCurrentUserProfilePayload): Promise<CurrentUserProfile> => {
  const profile = await AuthService.getUserProfile(userId)

  return {
    id: userId,
    email,
    username: profile?.username ?? null,
    first_name: profile?.first_name ?? null,
    last_name: profile?.last_name ?? null,
  }
}
