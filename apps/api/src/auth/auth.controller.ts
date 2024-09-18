import { Public } from '@lib/auth';
import { BaseAuthController } from '@lib/auth/controllers/base-auth.controller';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { Login } from './models/login.model';

@ApiTags('Auth')
@Controller('auth')
export class AuthController extends BaseAuthController {
  constructor(private readonly _authService: AuthService) {
    super();
  }

  @Public()
  @Post('signin')
  @ApiOkResponse({
    type: Login,
  })
  async signIn(@Body() signInDto: SignInDto): Promise<Login> {
    const { email, password } = signInDto;
    const user = await this._authService.signIn(email, password);

    const login = await this._authService.login(user as User);

    return {
      accessToken: login.accessToken,
      userId: user.id,
      email: user.email,
    };
  }
}
