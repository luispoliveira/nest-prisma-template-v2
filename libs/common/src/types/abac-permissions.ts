import { User } from '@gen/prisma-client';
import { LoggedUser } from '@lib/auth';

export type Role = 'admin' | 'moderator' | 'user';

type PermissionCheck<Key extends keyof AbacPermissions> =
  | boolean
  | ((_user: LoggedUser, _data: AbacPermissions[Key]['dataType']) => boolean);

export type RolesWithPermissions = {
  [_R in Role]: Partial<{
    [Key in keyof AbacPermissions]: Partial<{
      [_Action in AbacPermissions[Key]['action']]: PermissionCheck<Key>;
    }>;
  }>;
};

export type AbacPermissions = {
  user: {
    dataType: User;
    action: 'view' | 'create' | 'update';
  };
};

export const ABAC_ROLES = {
  admin: {
    user: {
      view: true,
      create: true,
      update: true,
    },
  },
  moderator: {
    user: {
      view: true,
      delete: (loggedUser: LoggedUser, user: User) => user.isActive,
    },
  },
  user: {
    user: {
      view: (loggedUser: LoggedUser, user: User) => user.id === loggedUser.id,
    },
  },
};
