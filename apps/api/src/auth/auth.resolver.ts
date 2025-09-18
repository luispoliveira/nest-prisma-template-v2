import { User } from '@gen/prisma-client';
import { Public } from '@lib/auth';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { Login } from './models/login.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly _authService: AuthService) {}

  @Public()
  @Mutation(() => Login, { name: 'AuthSignIn' })
  async signIn(
    @Args({ name: 'email', type: () => String }) email: string,
    @Args({ name: 'password', type: () => String }) password: string,
  ) {
    const user = await this._authService.signIn(email, password);

    const login = await this._authService.login(user as User);

    return {
      accessToken: login.accessToken,
      userId: user.id,
      email: user.email,
    };
  }
}
