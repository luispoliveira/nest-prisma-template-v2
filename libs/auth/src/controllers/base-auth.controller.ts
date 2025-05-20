import { LoggerInterceptor } from "@app/audit";
import { UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionsGuard } from "../guards/permissions.guard";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(LoggerInterceptor)
@ApiBearerAuth()
export class BaseAuthController {}
