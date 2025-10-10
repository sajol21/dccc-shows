
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

export const ROLE_HIERARCHY: { [key in UserRole]: number } = {
    [UserRole.GENERAL_STUDENT]: 0,
    [UserRole.GENERAL_MEMBER]: 1,
    [UserRole.ASSOCIATE_MEMBER]: 2,
    [UserRole.EXECUTIVE_MEMBER]: 3,
    [UserRole.LIFETIME_MEMBER]: 4,
    [UserRole.ADMIN]: 5,
};

export const LEADERBOARD_ROLES = [
    UserRole.GENERAL_STUDENT,
    UserRole.GENERAL_MEMBER,
    UserRole.ASSOCIATE_MEMBER
];
