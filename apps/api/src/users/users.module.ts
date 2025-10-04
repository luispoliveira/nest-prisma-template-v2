import { Module } from '@nestjs/common';
import { IdentityApplicationModule } from '@lib/application';
import { UsersController } from './users.controller';

@Module({
  imports: [IdentityApplicationModule],
  controllers: [UsersController],
})
export class UsersModule {}
