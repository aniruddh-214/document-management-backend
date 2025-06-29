import { Module } from '@nestjs/common';

import { JsonWebToken } from '../common/utils/jsonwebtoken.util';
import { UserModule } from '../user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UserModule],
  providers: [JsonWebToken, AuthService],
  controllers: [AuthController],
  exports: [],
})
export class AuthModule {}
