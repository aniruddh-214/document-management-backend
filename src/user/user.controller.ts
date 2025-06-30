import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import UserRoleEnum from '../common/enums/role.enum';
import { RequestValidationPipe } from '../common/pipes/zodValidation.pipe';
import { SimpleResponseType } from '../common/types/response/genericMessage.type';
import { DocumentEntity } from '../document/entities/document.entity';

import GetAllUsersDto from './dtos/getAllUsers.dto';
import {
  DeleteUserRequestParamType,
  GetAllUSersRequestQueryType,
  GetUserRequestParamType,
  UpdateUserDetailsRequestBodyType,
  UpdateUserDetailsRequestParamsType,
  UsersSchema,
} from './schemas/request/user.schema';
import { GetAllUsersResponseType } from './types/response/getAllUsers.type';
import { GetUserByIdResponseType } from './types/response/getUser.type';
import UserService from './user.service';

@Controller('user')
export default class UserController {
  public constructor(private readonly _userService: UserService) {}

  // Route to get all users details based on filter and pagination
  @Get('all')
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(new RequestValidationPipe(UsersSchema.shape.getAllUsers))
  public async getAllUsers(
    @Req() req: Request,

    @Query() query: GetAllUSersRequestQueryType,
  ): Promise<GetAllUsersResponseType> {
    return this._userService.getAllUsers(req.logger, new GetAllUsersDto(query));
  }

  // Route to get single user detail
  @Get(':id')
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(new RequestValidationPipe(UsersSchema.shape.getUser))
  public async getUserDetailsById(
    @Req() req: Request,
    @Param() param: GetUserRequestParamType,
  ): Promise<GetUserByIdResponseType | null> {
    return this._userService.getUserById(req.logger, param.id);
  }

  // Route to update user roles
  @Patch(':id')
  @UsePipes(new RequestValidationPipe(UsersSchema.shape.updateUserDetails))
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  public async updateUserDetails(
    @Req() req: Request,
    @Param() param: UpdateUserDetailsRequestParamsType,
    @Body() body: UpdateUserDetailsRequestBodyType,
  ): Promise<SimpleResponseType> {
    return this._userService.updateUserDetails(req.logger, param, body);
  }

  // Route to soft delete user
  @Delete(':id')
  @UsePipes(new RequestValidationPipe(UsersSchema.shape.deleteUser))
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  public async deleteUserById(
    @Req() req: Request,
    @Param() param: DeleteUserRequestParamType,
  ): Promise<SimpleResponseType> {
    return this._userService.deleteUserById(req.logger, param.id);
  }

  @Get('/me/documents')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.EDITOR)
  @UsePipes(new RequestValidationPipe(UsersSchema.shape.getUserDocuments))
  getUserAllDocuments(@Req() req: Request): Promise<DocumentEntity[]> {
    return this._userService.getUserDocuments(req.logger, req.user.sub);
  }
}
