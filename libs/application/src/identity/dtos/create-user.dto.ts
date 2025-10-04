export interface CreateUserRequest {
  email: string;
  password?: string;
  roleId?: number;
}

export interface CreateUserResponse {
  id: number;
  email: string;
  isActive: boolean;
  activationToken?: string;
}
