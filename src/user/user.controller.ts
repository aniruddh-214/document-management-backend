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
import { SwaggerDoc } from '../common/decorators/swagger.decorator';
import UserRoleEnum from '../common/enums/role.enum';
import { RequestValidationPipe } from '../common/pipes/zodValidation.pipe';
import { SimpleResponseType } from '../common/types/response/genericMessage.type';

import GetAllUsersDto from './dtos/getAllUsers.dto';
import GetUserDocumentsDTO from './dtos/getUserDocuements.dto';
import {
  DeleteUserRequestParamType,
  GetAllUSersRequestQueryType,
  GetUserDocumentsRequestQueryType,
  GetUserRequestParamType,
  UpdateUserDetailsRequestBodyType,
  UpdateUserDetailsRequestParamsType,
  UsersSchema,
} from './schemas/request/user.schema';
import { USER_SWAGGER_SCHEMA } from './schemas/userSwagger.schema';
import { GetAllUsersResponseType } from './types/response/getAllUsers.type';
import { GetUserByIdResponseType } from './types/response/getUser.type';
import { GetUserDocumentsResponseType } from './types/response/getUserDocuments.type';
import UserService from './user.service';

@Controller('user')
export default class UserController {
  public constructor(private readonly _userService: UserService) {}

  // Route to get all users details based on filter and pagination
  @Get('all')
  @SwaggerDoc(USER_SWAGGER_SCHEMA.GET_ALL_USERS)
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(new RequestValidationPipe(UsersSchema.shape.getAllUsers))
  public async getAllUsers(
    @Req() req: Request,
    @Query() query: GetAllUSersRequestQueryType,
  ): Promise<GetAllUsersResponseType> {
    return this._userService.getAllUsers(new GetAllUsersDto(query), req.logger);
  }

  // Route to get single user detail
  @Get(':id')
  @SwaggerDoc(USER_SWAGGER_SCHEMA.GET_USER_BY_ID)
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(new RequestValidationPipe(UsersSchema.shape.getUser))
  public async getUserDetailsById(
    @Req() req: Request,
    @Param() param: GetUserRequestParamType,
  ): Promise<GetUserByIdResponseType> {
    return this._userService.getUserById(param.id, req.logger);
  }

  // Route to update user roles
  @Patch(':id')
  @SwaggerDoc(USER_SWAGGER_SCHEMA.UPDATE_USER_ROLE)
  @UsePipes(new RequestValidationPipe(UsersSchema.shape.updateUserDetails))
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  public async updateUserDetails(
    @Req() req: Request,
    @Param() param: UpdateUserDetailsRequestParamsType,
    @Body() body: UpdateUserDetailsRequestBodyType,
  ): Promise<SimpleResponseType> {
    return this._userService.updateUserDetails(param.id, body, req.logger);
  }

  // Route to soft delete user
  @Delete(':id')
  @SwaggerDoc(USER_SWAGGER_SCHEMA.DELETE_USER_BY_ID)
  @UsePipes(new RequestValidationPipe(UsersSchema.shape.deleteUser))
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  public async deleteUserById(
    @Req() req: Request,
    @Param() param: DeleteUserRequestParamType,
  ): Promise<SimpleResponseType> {
    return this._userService.deleteUserById(param.id, req.logger);
  }

  @Get('/me/documents')
  @SwaggerDoc(USER_SWAGGER_SCHEMA.GET_USER_DOCUMENTS)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.EDITOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(new RequestValidationPipe(UsersSchema.shape.getUserDocuments))
  getUserAllDocuments(
    @Req() req: Request,
    @Query() query: GetUserDocumentsRequestQueryType,
  ): Promise<GetUserDocumentsResponseType> {
    return this._userService.getUserDocuments(
      req.user,
      new GetUserDocumentsDTO(query),
      req.logger,
    );
  }
}
