import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';

import { RequestValidationPipe } from '../common/pipes/zodValidation.pipe';
import UserEntity from '../user/entities/user.entity';
import { CreateUserResponseType } from '../user/types/response/createUser.type';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/auth.guard';
import {
  AuthSchema,
  CreateUserRequestType,
  LoginUserRequestType,
} from './schemas/request/auth.schema';
import { LoginResponseType } from './types/response/login.type';

@Controller('auth')
export class AuthController {
  public constructor(private readonly _authService: AuthService) {}

  @Post('register')
  @UsePipes(new RequestValidationPipe(AuthSchema.shape.createUser))
  public async register(
    @Req() req: Request,
    @Body() body: CreateUserRequestType,
  ): Promise<CreateUserResponseType> {
    return this._authService.createUser(body, req.logger);
  }

  @Post('login')
  @UsePipes(new RequestValidationPipe(AuthSchema.shape.loginUser))
  @HttpCode(200)
  public async login(
    @Req() req: Request,
    @Body() body: LoginUserRequestType,
  ): Promise<LoginResponseType> {
    return this._authService.login(body, req.logger);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  public logout(): { message: string } {
    // Since backend can't invalid the token we can you other ways if intentionally want
    return { message: 'Successfully logged out' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  public getUserProfile(@Req() req: Request): Promise<Partial<UserEntity>> {
    return this._authService.getUserProfile(req.user.sub, req.logger);
  }
}
