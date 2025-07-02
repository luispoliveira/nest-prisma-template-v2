import { Module } from "@nestjs/common";
import { HelpService } from "./help.service";

@Module({
  providers: [HelpService],
})
export class HelpModule {}
