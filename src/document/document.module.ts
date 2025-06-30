import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JsonWebToken } from '../common/utils/jsonwebtoken.util';

import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentEntity } from './entities/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity])],
  controllers: [DocumentController],
  providers: [JsonWebToken, DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
