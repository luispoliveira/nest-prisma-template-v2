import { Role } from "@lib/common";

export class LoggedUser {
  id: number;
  email: string;
  roles: Role[] = [];
}
