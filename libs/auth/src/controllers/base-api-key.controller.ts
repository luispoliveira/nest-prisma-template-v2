import { LoggerInterceptor } from '@lib/common';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../guards/api-key-auth.guard';

@UseGuards(ApiKeyAuthGuard)
@UseInterceptors(LoggerInterceptor)
export class BaseApiKeyController {}
