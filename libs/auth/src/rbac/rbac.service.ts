import { RBAC_ROLES, RbacPermission } from "@lib/common";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import { LoggedUser } from "../models/user.model";

@Injectable()
export class RbacService {
  constructor(private readonly _prismaService: PrismaService) {}

  async userHasPermissions(user: LoggedUser, permissions: RbacPermission[]) {
    return user.roles.some(role =>
      (RBAC_ROLES[role] as readonly RbacPermission[]).some(permission =>
        permissions.includes(permission),
      ),
    );
  }
}
