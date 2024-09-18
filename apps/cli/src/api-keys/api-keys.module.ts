import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

@Module({
  providers: [ApiKeysService]
})
export class ApiKeysModule {}
