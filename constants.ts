
export enum UserRole {
  GENERAL_STUDENT = "General Student",
  GENERAL_MEMBER = "General Member",
  ASSOCIATE_MEMBER = "Associate Member",
  EXECUTIVE_MEMBER = "Executive Member",
  LIFETIME_MEMBER = "Lifetime Member",
  ADMIN = "Admin",
}

export enum Province {
  CULTURAL = "Cultural",
  TECHNICAL = "Technical",
}

export const USER_ROLES = Object.values(UserRole);
export const PROVINCES = Object.values(Province);
