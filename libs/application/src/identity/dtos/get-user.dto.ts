export interface GetUserRequest {
  id: number;
}

export interface GetUserResponse {
  id: number;
  email: string;
  isActive: boolean;
  hasTwoFA: boolean;
  roleId?: number;
  lastLogin?: Date;
}
