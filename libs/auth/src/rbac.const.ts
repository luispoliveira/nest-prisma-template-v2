import { IStorageRbac } from "nestjs-rbac";

export const RBAC: IStorageRbac = {
  roles: ["admin", "user"],
  permissions: {
    user: ["create", "read", "update", "delete"],
    role: ["create", "read", "update", "delete"],
    permission: ["read"],
  },
  grants: {
    admin: ["user", "role", "permission"],
    user: ["user@read", "user@update"],
  },
  filters: {},
};
