import { BaseAuthController, CurrentUser, LoggedUser } from '@lib/auth';
import {
  CreateUserUseCase,
  GetUserUseCase,
  GetAllUsersUseCase,
  CreateUserRequest,
  GetUserRequest,
  GetAllUsersRequest,
} from '@lib/application';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
@ApiTags('Users')
export class UsersController extends BaseAuthController {
  constructor(
    private readonly _createUserUseCase: CreateUserUseCase,
    private readonly _getUserUseCase: GetUserUseCase,
    private readonly _getAllUsersUseCase: GetAllUsersUseCase,
  ) {
    super();
  }

  @Get('')
  async findAll() {
    const request: GetAllUsersRequest = {};
    return await this._getAllUsersUseCase.execute(request);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const request: GetUserRequest = { id };
    return await this._getUserUseCase.execute(request);
  }

  @Post('')
  async create(@Body() body: CreateUserDto) {
    const request: CreateUserRequest = {
      email: body.email,
      password: body.password,
      roleId: body.roleId,
    };
    return await this._createUserUseCase.execute(request);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) _id: number,
    @Body() _body: UpdateUserDto,
  ) {
    // TODO: Implement UpdateUserUseCase
    return { message: 'UpdateUser use case not implemented yet' };
  }

  @Patch(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) _id: number,
    @CurrentUser() _user: LoggedUser,
  ) {
    // TODO: Implement ResetPasswordUseCase
    return { message: 'ResetPassword use case not implemented yet' };
  }

  @Patch(':id/activate')
  async activate(
    @Param('id', ParseIntPipe) _id: number,
    @CurrentUser() _user: LoggedUser,
  ) {
    // TODO: Implement ActivateUserUseCase
    return { message: 'ActivateUser use case not implemented yet' };
  }

  @Patch(':id/deactivate')
  async deactivate(
    @Param('id', ParseIntPipe) _id: number,
    @CurrentUser() _user: LoggedUser,
  ) {
    // TODO: Implement DeactivateUserUseCase
    return { message: 'DeactivateUser use case not implemented yet' };
  }

  @Patch(':id/role')
  async alterRole(
    @Param('id', ParseIntPipe) _id: number,
    @Body('role', ParseIntPipe) _roleId: number,
    @CurrentUser() _user: LoggedUser,
  ) {
    // TODO: Implement ChangeUserRoleUseCase
    return { message: 'ChangeUserRole use case not implemented yet' };
  }
}
