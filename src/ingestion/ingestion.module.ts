import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JsonWebToken } from '../common/utils/jsonwebtoken.util';
import { DocumentModule } from '../document/document.module';

import { IngestionEntity } from './entities/ingestion.entity';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [DocumentModule, TypeOrmModule.forFeature([IngestionEntity])],
  controllers: [IngestionController],
  providers: [JsonWebToken, IngestionService],
})
export class IngestionModule {}
