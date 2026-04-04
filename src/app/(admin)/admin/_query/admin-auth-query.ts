import { createAuthService } from "../../../../../models/services/auth.service"

export type AdminSignInPayload = {
  email: string
  password: string
}

export const signInAdminQuery = async ({ email, password }: AdminSignInPayload) => {
  return AuthService.signIn(email, password)
}
