import { AuthService } from '../../../../models/services/auth.service'
import { CurrentUserProfile } from '../_types/current-user-profile'
// import type { CurrentUserProfile } from '../_types/current-user-profile'

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
    // Our profiles table has `full_name` — map it directly
    full_name: profile?.full_name ?? null,
  }
}
