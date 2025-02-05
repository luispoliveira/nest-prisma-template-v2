import { PrismaModule } from "@lib/prisma";
import { Module } from "@nestjs/common";
import { AbacService } from "./abac.service";

@Module({
  imports: [PrismaModule.register()],
  providers: [AbacService],
  exports: [AbacService],
})
export class AbacModule {}
