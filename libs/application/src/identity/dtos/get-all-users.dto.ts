export interface GetAllUsersRequest {
  // Future: add filtering, pagination parameters
}

export interface GetAllUsersResponse {
  users: Array<{
    id: number;
    email: string;
    isActive: boolean;
    hasTwoFA: boolean;
    roleId?: number;
    lastLogin?: Date;
  }>;
}
