import { Query, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Resolver()
export class AppResolver {
  @Query(() => String, { name: 'HelloGraphQL' })
  async hello(@CurrentUser() user: User) {
    console.log(user);
    return `I'm working!`;
  }
}
