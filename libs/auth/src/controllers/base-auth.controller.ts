import { LoggerInterceptor } from "@app/audit";
import { UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PermissionsGuard } from "../guards/permissions.guard";
import { AuthInterceptor } from "../interceptor/auth.interceptor";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(LoggerInterceptor, AuthInterceptor)
@ApiBearerAuth()
export class BaseAuthController {}
