export const VALID_ROLES = ["user", "admin", "super_admin"] as const;
export type Role = (typeof VALID_ROLES)[number];

export function isValidRole(role: string): role is Role {
  return (VALID_ROLES as readonly string[]).includes(role);
}

export function isAdmin(role?: string) {
  return role === "admin" || role === "super_admin";
}
