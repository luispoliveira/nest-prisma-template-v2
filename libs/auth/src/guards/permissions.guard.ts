import { ContextUtil, RbacPermission } from '@lib/common';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NEEDS_PERMISSIONS_KEY } from '../decorators/needs-permissions.decorator';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly _reflector: Reflector,
    private readonly _rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this._reflector.getAllAndOverride<
      RbacPermission[]
    >(NEEDS_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) return true;

    const requestUser = ContextUtil.getRequest(context).user;
    if (!requestUser) return false;

    return await this._rbacService.userHasPermissions(
      requestUser,
      requiredPermissions,
    );
  }
}
