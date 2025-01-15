import { LoggerInterceptor } from "@lib/common";
import { UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiHeader } from "@nestjs/swagger";
import { ApiKeyAuthGuard } from "../guards/api-key-auth.guard";

@UseGuards(ApiKeyAuthGuard)
@UseInterceptors(LoggerInterceptor)
@ApiHeader({
  name: "api-key",
})
export class BaseApiKeyController {}
