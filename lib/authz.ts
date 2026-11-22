/**
 * Role policy for studio members. Pure, so it is unit tested directly.
 * Viewers read everything in their studio and write nothing.
 */
export type Role = "owner" | "admin" | "member" | "viewer";

const WRITE_ROLES: ReadonlySet<Role> = new Set<Role>(["owner", "admin", "member"]);

export function canWrite(role: Role): boolean {
  return WRITE_ROLES.has(role);
}
