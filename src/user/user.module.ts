import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JsonWebToken } from '../common/utils/jsonwebtoken.util';

import UserEntity from './entities/user.entity';
import UserController from './user.controller';
import UserService from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [JsonWebToken, UserService],
  exports: [UserService],
})
export class UserModule {}
