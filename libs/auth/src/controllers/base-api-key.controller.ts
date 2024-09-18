import { UseGuards } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../guards/api-key-auth.guard';

@UseGuards(ApiKeyAuthGuard)
export class BaseApiKeyController {}
