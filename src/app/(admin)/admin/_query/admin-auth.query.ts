import { AuthService } from '../../../../../models/services/auth.service'

export type AdminSignInPayload = {
  email: string
  password: string
}

/**
 * Calls AuthService.signIn and returns user + roles.
 * The auth form checks roles.includes('admin') before proceeding.
 */
export const signInAdminQuery = async ({ email, password }: AdminSignInPayload) => {
  return AuthService.signIn(email, password)
}
