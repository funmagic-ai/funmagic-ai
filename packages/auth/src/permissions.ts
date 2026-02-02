export type UserRole = "user" | "admin" | "super_admin"

export const isAdmin = (role?: string): boolean => {
  return role === "admin" || role === "super_admin"
}

export const isSuperAdmin = (role?: string): boolean => {
  return role === "super_admin"
}
