import { LoggerInterceptor } from "@app/audit";
import { UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RBAcGuard } from "nestjs-rbac";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AuthInterceptor } from "../interceptor/auth.interceptor";

@UseGuards(JwtAuthGuard, RBAcGuard)
@UseInterceptors(LoggerInterceptor, AuthInterceptor)
@ApiBearerAuth()
export class BaseAuthController {}
