import { AuthService } from '../../../../models/services/auth.service'
import { CurrentUserProfile } from '../_types/current-user-profile'

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
    full_name: profile?.full_name ?? null,
  }
}

