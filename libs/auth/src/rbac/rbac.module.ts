import { PrismaModule } from "@lib/prisma";
import { Global, Module } from "@nestjs/common";
import { RbacService } from "./rbac.service";

@Global()
@Module({
  imports: [PrismaModule.register()],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
