import { Role } from "./abac-permissions";

export type RbacPermission = (typeof RBAC_ROLES)[Role][number];

export const RBAC_ROLES = {
  admin: ["view:users", "create:users", "updated:users", "delete:users"],
  moderator: ["view:users", "create:users", "delete:users"],
  user: ["view:users"],
};
