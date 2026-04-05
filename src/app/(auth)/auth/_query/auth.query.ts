
import { AuthService } from "../../../../../models/services/auth.service"

export type SignInPayload = {
    email: string
    password: string
}

export const signInUserQuery = async ({ email, password }: SignInPayload) => {
    return AuthService.signIn(email, password)
}

export type SignUpPayload = {
    email: string
    password: string
    firstName?: string
    lastName?: string
    role?: 'user' | 'analyst'
}

export const signUpUserQuery = async ({
    email,
    password,
    firstName,
    lastName,
    role,
}: SignUpPayload) => {
    return AuthService.signUp({
        email,
        password,
        firstName,
        lastName,
        role,
    })
}

