import { Profile } from "../schemas/profile.schema";

/**
 * Asserts that the provided user profile has at least one of the allowed roles.
 * @throws Error if the user role is not in the allowed list.
 */
export const requireRole = (userProfile: Profile, ...allowedRoles: string[]) => {
  if (!allowedRoles.includes(userProfile.role)) {
    throw new Error(`Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`);
  }
};

/**
 * Asserts that the user account is currently active.
 * Deactivated users are blocked from mutating the system.
 * @throws Error if the user is deactivated.
 */
export const requireActive = (userProfile: Profile) => {
  if (!userProfile.is_active) {
    throw new Error("Forbidden: User account is deactivated.");
  }
};
