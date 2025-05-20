import { LoggerInterceptor } from "@app/audit";
import { UseInterceptors } from "@nestjs/common";
import { Public } from "../decorators/public.decorator";

@Public()
@UseInterceptors(LoggerInterceptor)
export class BasePublicController {}
