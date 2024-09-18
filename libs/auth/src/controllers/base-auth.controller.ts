import { LoggerInterceptor } from '@lib/common';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(LoggerInterceptor)
export class BaseAuthController {}
