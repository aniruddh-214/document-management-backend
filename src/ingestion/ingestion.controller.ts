import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
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

import GetAllIngestionsDto from './dtos/getAllIngestions.dto';
import { IngestionEntity } from './entities/ingestion.entity';
import { IngestionService } from './ingestion.service';
import { INGESTION_SWAGGER_SCHEMA } from './schemas/ingestionSwagger.schema';
import {
  DeleteIngestionRequestParamType,
  GetAllIngestionsRequestQueryType,
  IngestionSchema,
  TriggerIngestionRequestParamType,
} from './schemas/request/ingestion.schema';
import { TriggerIngestionResponseType } from './types/response/triggerIngestion.type';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post(':id/trigger')
  @SwaggerDoc(INGESTION_SWAGGER_SCHEMA.TRIGGER_INGESTION)
  @UsePipes(new RequestValidationPipe(IngestionSchema.shape.triggerIngestion))
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.EDITOR)
  @UseGuards(JwtAuthGuard)
  async triggerIngestion(
    @Req() req: Request,
    @Param() param: TriggerIngestionRequestParamType,
  ): Promise<TriggerIngestionResponseType> {
    return this.ingestionService.triggerIngestion(
      req.logger,
      req.user,
      param.id,
    );
  }

  @Get(':id/details')
  @SwaggerDoc(INGESTION_SWAGGER_SCHEMA.GET_INGESTION_DETAILS_BY_ID)
  @UsePipes(
    new RequestValidationPipe(IngestionSchema.shape.getIngestionDetails),
  )
  @UseGuards(JwtAuthGuard)
  async getIngestionDetails(
    @Req() req: Request,
    @Param() param: TriggerIngestionRequestParamType,
  ): Promise<Partial<IngestionEntity>> {
    return this.ingestionService.getIngestionDetails(param.id, req.logger);
  }

  @Delete(':id/delete')
  @SwaggerDoc(INGESTION_SWAGGER_SCHEMA.DELETE_INGESTION_BY_ID)
  @UsePipes(new RequestValidationPipe(IngestionSchema.shape.deleteIngestion))
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteIngestion(
    @Req() req: Request,
    @Param() param: DeleteIngestionRequestParamType,
  ): Promise<SimpleResponseType> {
    return this.ingestionService.deleteIngestionById(param.id, req.logger);
  }

  @Get('all')
  @SwaggerDoc(INGESTION_SWAGGER_SCHEMA.GET_ALL_DOCUMENTS)
  @UsePipes(new RequestValidationPipe(IngestionSchema.shape.getAllIngestions))
  @UseGuards(JwtAuthGuard)
  async getAllIngestions(
    @Req() req: Request,
    @Query() query: GetAllIngestionsRequestQueryType,
  ): Promise<{
    data: IngestionEntity[];
    totalCount: number;
    totalPages: number;
  }> {
    return this.ingestionService.getAllIngestions(
      new GetAllIngestionsDto(query),
      req.logger,
    );
  }
}
