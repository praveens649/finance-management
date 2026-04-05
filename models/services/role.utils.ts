import { Profile } from "../schemas/profile.schema";


export const requireRole = (userProfile: Profile, ...allowedRoles: string[]) => {
  if (!allowedRoles.includes(userProfile.role)) {
    throw new Error(`Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`);
  }
};


export const requireActive = (userProfile: Profile) => {
  if (!userProfile.is_active) {
    throw new Error("Forbidden: User account is deactivated.");
  }
};

