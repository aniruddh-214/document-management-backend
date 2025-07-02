import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, IsNull, Repository } from 'typeorm';

import { UserAuthTokenPayload } from '../auth/interfaces/jwtPayload.interface';
import UserRoleEnum from '../common/enums/role.enum';
import { SimpleResponseType } from '../common/types/response/genericMessage.type';
import LoggerService from '../common/utils/logging/loggerService';
import { DocumentService } from '../document/document.service';

import GetAllIngestionsDto from './dtos/getAllIngestions.dto';
import { IngestionEntity } from './entities/ingestion.entity';
import IngestionStatusEnum from './enums/ingestion.enum';
import { TriggerIngestionResponseType } from './types/response/triggerIngestion.type';

@Injectable()
export class IngestionService {
  public constructor(
    @InjectRepository(IngestionEntity)
    private readonly _ingestionRepo: Repository<IngestionEntity>,
    private readonly _documentService: DocumentService,
  ) {}

  public async triggerIngestion(
    logger: LoggerService,
    user: UserAuthTokenPayload,
    docId: string,
  ): Promise<TriggerIngestionResponseType> {
    try {
      const document = await this._documentService.findDocumentBy(logger, {
        where: {
          id: docId,
          deletedAt: IsNull(),
        },
        select: {
          userId: true,
        },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      if (document.userId !== user.sub && user.role !== UserRoleEnum.ADMIN) {
        throw new UnauthorizedException(
          `You do not have permission to perform this action`,
        );
      }
      const ingestion = {
        documentId: docId,
        userId: user.sub,
        logs: `Ingestion triggered`,
      };

      const result: InsertResult = await this._ingestionRepo
        .createQueryBuilder()
        .insert()
        .into(IngestionEntity)
        .values(ingestion)
        .execute();
      const insertedIngestion = result.raw[0];

      this.simulateProcessing(insertedIngestion.id, logger);
      logger.logInfo({
        action: 'info',
        source: 'IngestionService#triggerIngestion',
        message: `Ingestion triggered for ${docId} by ${user.sub}`,
      });

      return {
        message: `Triggered ingestion successfully. Current status: ${IngestionStatusEnum.QUEUED}`,
        documentId: docId,
        ingestionId: insertedIngestion.id,
      };
    } catch (error) {
      logger.logError({
        message: 'Error while triggering the ingestion',
        action: 'error',
        source: 'IngestionService#triggerIngestion',
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  private simulateProcessing(ingestionId: string, logger: LoggerService): void {
    // Step 1: Move to PROCESSING after 2 seconds
    setTimeout(() => {
      void (async (): Promise<void> => {
        await this._ingestionRepo.update(ingestionId, {
          status: IngestionStatusEnum.PROCESSING,
          logs: `Processing started at ${new Date().toISOString()}`,
        });

        logger.logInfo({
          action: 'processing',
          source: 'IngestionService#simulateProcessing',
          message: `Ingestion ${ingestionId} moved to PROCESSING`,
        });

        // Step 2: Simulate completion/failure after 3 seconds
        setTimeout(() => {
          void (async (): Promise<void> => {
            const success = Math.random() > 0.2;

            await this._ingestionRepo.update(ingestionId, {
              status: success
                ? IngestionStatusEnum.COMPLETED
                : IngestionStatusEnum.FAILED,
              logs: success
                ? `Completed successfully at ${new Date().toUTCString()}`
                : `Failed at ${new Date().toUTCString()}`,
              errorMessage: success ? undefined : 'Simulated ingestion failure',
              finishedAt: new Date().toUTCString(),
            });

            logger.logInfo({
              action: success ? 'completed' : 'failed',
              source: 'IngestionService#simulateProcessing',
              message: `Ingestion ${ingestionId} ended with status: ${
                success ? 'COMPLETED' : 'FAILED'
              }`,
            });
          })();
        }, 3000);
      })();
    }, 2000);
  }

  public async getIngestionDetails(
    ingestionId: string,
    logger: LoggerService,
  ): Promise<Partial<IngestionEntity>> {
    try {
      const ingestion = await this._ingestionRepo.findOne({
        where: { id: ingestionId, deletedAt: IsNull() },
        select: [
          'id',
          'updatedAt',
          'createdAt',
          'documentId',
          'status',
          'logs',
          'errorMessage',
          'userId',
        ],
      });

      if (!ingestion) {
        throw new NotFoundException(
          `Ingestion with ID ${ingestionId} not found`,
        );
      }

      logger.logInfo({
        action: 'info',
        source: 'IngestionService#getIngestionStatus',
        message: `Fetched status for ingestion ${ingestionId}`,
      });

      return ingestion;
    } catch (error) {
      logger.logError({
        action: 'error',
        source: 'IngestionService#getIngestionStatus',
        message: `Failed to fetch ingestion status`,
        errorMessage: (error as Error).message,
      });
      throw new NotFoundException(
        `Ingestion not found with ID: ${ingestionId}`,
      );
    }
  }

  public async deleteIngestionById(
    ingestionId: string,
    logger: LoggerService,
  ): Promise<SimpleResponseType> {
    try {
      const result = await this._ingestionRepo.softDelete({ id: ingestionId });

      if (result.affected === 0) {
        logger.logInfo({
          action: 'info',
          source: 'IngestionService#deleteIngestionById',
          message: `Ingestion not deleted (not found or already deleted): ${ingestionId}`,
        });

        throw new NotFoundException(
          `Ingestion with ID ${ingestionId} not found or already deleted`,
        );
      }

      logger.logInfo({
        action: 'info',
        source: 'IngestionService#deleteIngestionById',
        message: `Ingestion soft-deleted: ${ingestionId}`,
      });

      return {
        message: `Ingestion with id ${ingestionId} has been deleted successfully`,
      };
    } catch (error) {
      logger.logError({
        action: 'error',
        source: 'IngestionService#deleteIngestionById',
        message: `Failed to delete ingestion: ${ingestionId}`,
        error,
      });

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Something went wrong while deleting the ingestion',
      );
    }
  }

  public async getAllIngestions(
    filters: GetAllIngestionsDto,
    logger: LoggerService,
  ): Promise<{
    data: IngestionEntity[];
    totalCount: number;
    totalPages: number;
  }> {
    const {
      select,
      id,
      documentId,
      userId,
      status,
      isActive,
      isDeleted,
      hasLogs,
      hasError,
      page,
      limit,
      sortOrder,
    } = filters;

    try {
      const query = this._ingestionRepo.createQueryBuilder('ingestion');
      query.withDeleted();

      // Columns
      const columns = select?.map((field) => `ingestion.${field}`) ?? [
        'ingestion.id',
        'ingestion.status',
        'ingestion.document_id',
        'ingestion.user_id',
        'ingestion.logs',
        'ingestion.error_message',
        'ingestion.created_at',
      ];
      query.select(columns);

      if (id) {
        query.andWhere('ingestion.id = :id', { id });
      }

      if (documentId) {
        query.andWhere('ingestion.document_id = :documentId', { documentId });
      }

      if (userId) {
        query.andWhere('ingestion.user_id = :userId', { userId });
      }

      if (status) {
        query.andWhere('ingestion.status IN (:...status)', { status });
      }

      if (typeof isActive === 'boolean') {
        query.andWhere('ingestion.is_active = :isActive', { isActive });
      }

      if (typeof isDeleted === 'boolean') {
        if (isDeleted) {
          query.andWhere('ingestion.deleted_at IS NOT NULL');
        } else {
          query.andWhere('ingestion.deleted_at IS NULL');
        }
      }

      if (typeof hasLogs === 'boolean') {
        query.andWhere(
          hasLogs
            ? "ingestion.logs IS NOT NULL AND ingestion.logs <> ''"
            : "ingestion.logs IS NULL OR ingestion.logs = ''",
        );
      }

      if (typeof hasError === 'boolean') {
        query.andWhere(
          hasError
            ? "ingestion.error_message IS NOT NULL AND ingestion.error_message <> ''"
            : "ingestion.error_message IS NULL OR ingestion.error_message = ''",
        );
      }

      query
        .orderBy('ingestion.updated_at', sortOrder ?? 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [data, total] = await query.getManyAndCount();

      logger.logInfo({
        action: 'get_all_ingestions',
        message: `Fetched ${data.length} ingestions (Page ${page})`,
        source: 'IngestionService#getAllIngestions',
      });

      return { data, totalCount: total, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      logger.logError({
        action: 'get_all_ingestions',
        message: 'Error fetching ingestions',
        source: 'IngestionService#getAllIngestions',
        errorMessage: error?.message,
        stack: error?.stack,
      });

      throw new InternalServerErrorException('Failed to fetch ingestions');
    }
  }
}
