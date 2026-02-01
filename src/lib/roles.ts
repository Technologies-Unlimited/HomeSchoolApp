export function isAdmin(role?: string) {
  return role === "admin" || role === "super_admin";
}
