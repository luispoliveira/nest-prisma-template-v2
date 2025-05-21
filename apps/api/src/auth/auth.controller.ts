import { User } from "@gen/prisma-client";
import { Public } from "@lib/auth";
import { BaseAuthController } from "@lib/auth/controllers/base-auth.controller";
import { PasswordUtil } from "@lib/common";
import { PrismaService } from "@lib/prisma";
import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ENHANCED_PRISMA } from "@zenstackhq/server/nestjs";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { Login } from "./models/login.model";
import { SignUpModel } from "./models/sign-up.model";

@ApiTags("Auth")
@Controller("auth")
export class AuthController extends BaseAuthController {
  constructor(
    private readonly _authService: AuthService,
    @Inject(ENHANCED_PRISMA) private readonly _prismaService: PrismaService,
  ) {
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
    const user = await this._prismaService.user.create({
      data: {
        email: body.email,
        password: await PasswordUtil.hashPassword(body.password),
        isActive: false,
        createdBy: body.email,
        updatedBy: body.email,
      },
    });

    return user;
  }
}
