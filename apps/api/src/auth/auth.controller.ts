import { User } from "@gen/prisma-client";
import { Public } from "@lib/auth";
import { BaseAuthController } from "@lib/auth/controllers/base-auth.controller";
import { Body, Controller, Post } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { ForgetPasswordDto, ResetPasswordDto } from "./dto/reset-password.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { Login } from "./models/login.model";
import { SignUpModel } from "./models/sign-up.model";

@ApiTags("Auth")
@Controller("auth")
export class AuthController extends BaseAuthController {
  constructor(private readonly _authService: AuthService) {
    super();
  }

  @Public()
  @Post("signin")
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

  @Public()
  @Post("signup")
  @ApiOkResponse({
    type: SignUpModel,
  })
  async signUp(@Body() body: SignUpDto) {
    const user = await this._authService.signUp(body.email, body.password);

    return user;
  }

  @Public()
  @Post("forget-password")
  async forgetPassword(@Body() body: ForgetPasswordDto) {
    await this._authService.forgetPassword(body.email);

    return true;
  }

  @Public()
  @Post("reset-password")
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this._authService.resetPassword(body.token, body.password);

    return true;
  }
}
