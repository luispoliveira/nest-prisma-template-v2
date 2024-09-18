import { LoggerInterceptor } from '@lib/common';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggerInterceptor)
export class BaseAuthController {}
