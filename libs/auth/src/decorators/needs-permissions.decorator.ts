import { RbacPermission } from "@lib/common";
import { SetMetadata } from "@nestjs/common";

export const NEEDS_PERMISSIONS_KEY = "needsPermissions";
export const NeedsPermissions = (...permissions: RbacPermission[]) =>
  SetMetadata(NEEDS_PERMISSIONS_KEY, permissions);
