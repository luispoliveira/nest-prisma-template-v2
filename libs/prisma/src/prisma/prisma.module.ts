import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { configuration } from "../config/configuration";
import { validationSchema } from "../config/validation";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
