import { PrismaService } from "@lib/prisma";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class UsersService {
  private _logger = new Logger(UsersService.name);

  constructor(private readonly _prismaService: PrismaService) {}

  async findUserByEmail(email: string) {
    return this._prismaService.user.findUnique({
      where: {
        email,
      },
    });
  }
}
