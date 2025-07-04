import * as fs from 'fs';
import path from 'path';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, IsNull, Repository } from 'typeorm';

import { SimpleResponseType } from '../common/types/response/genericMessage.type';
import LoggerService from '../common/utils/logging/loggerService';
import GetUserDocumentsDTO from '../user/dtos/getUserDocuements.dto';
import { GetUserDocumentsResponseType } from '../user/types/response/getUserDocuments.type';

import { DocumentEntity } from './entities/document.entity';
import {
  GetAllDocumentsRequestQueryType,
  UploadDocumentRequestBodyType,
} from './schemas/request/document.schema';
import { UploadDocumentResponseType } from './types/response/uploadDocument.type';
import FSUtils from './utils/fs.util';

@Injectable()
export class DocumentService {
  public constructor(
    @InjectRepository(DocumentEntity)
    private readonly _documentRepo: Repository<DocumentEntity>,
  ) {}

  public async createDocument(
    userId: string,
    body: UploadDocumentRequestBodyType,
    file: Express.Multer.File,
    logger: LoggerService,
  ): Promise<UploadDocumentResponseType> {
    try {
      file.path = FSUtils.AbsoluteToRelativePath(file.path);
      const document: Partial<DocumentEntity> = {
        title: body.title,
        description: body.description,
        fileName: file.filename,
        size: file.size,
        filePath: file.path,
        mimeType: file.mimetype,
        userId,
      };

      const result = await this._documentRepo
        .createQueryBuilder()
        .insert()
        .into(DocumentEntity)
        .values(document)
        .returning(['id'])
        .execute();

      const insertId = result.raw?.[0]?.id;

      if (!insertId) {
        throw new InternalServerErrorException(
          'Document creation failed — no ID returned',
        );
      }
      logger.logInfo({
        action: 'info',
        message: 'Saved user document information into DB',
        source: 'DocumentService#createDocument',
      });
      return {
        message: 'Document successfully uploaded',
        id: insertId,
      };
    } catch (error) {
      logger.logError({
        action: 'error',
        message: 'Error while saving document to the database',
        source: 'DocumentService#createDocument',
        errorMessage: error?.message,
      });

      throw error;
    }
  }

  public async findDocumentBy(
    conditions: FindOneOptions<DocumentEntity>,
    logger: LoggerService,
  ): Promise<DocumentEntity | null> {
    logger.logInfo({
      action: 'info',
      message: `Fetching document with conditions: ${JSON.stringify(conditions)}`,
      source: 'DocumentService#findDocumentBy',
    });

    try {
      const document = await this._documentRepo.findOne(conditions);

      if (!document) {
        logger.logWarn({
          action: 'warn',
          message: `No document found with conditions: ${JSON.stringify(conditions)}`,
          source: 'DocumentService#findDocumentBy',
        });
        return null;
      }

      return document;
    } catch (error) {
      logger.logError({
        action: 'error',
        message: 'Error while fetching document from the database',
        source: 'DocumentService#findDocumentBy',
        errorMessage: error?.message,
      });

      throw new InternalServerErrorException('Failed to fetch document');
    }
  }

  public async updateDocument(
    docId: string,
    newUpdates: Partial<DocumentEntity>,
    existingDocument: DocumentEntity,
    logger: LoggerService,
    file?: Express.Multer.File,
  ): Promise<SimpleResponseType> {
    logger.logInfo({
      action: 'info',
      message: `Updating document with id: ${docId}`,
      source: 'DocumentService#updateDocument',
    });

    try {
      if (!file && !newUpdates.title && !newUpdates.description) {
        throw new BadRequestException('No update data provided');
      }
      existingDocument.title = newUpdates.title ?? existingDocument.title;
      existingDocument.description =
        newUpdates.description ?? existingDocument.description;

      existingDocument.fileName = file?.filename ?? existingDocument.fileName;

      const deleteExistingFile = FSUtils.deleteFile(existingDocument.filePath);
      existingDocument.filePath = file?.path
        ? FSUtils.AbsoluteToRelativePath(file.path)
        : existingDocument.filePath;
      existingDocument.mimeType = file?.mimetype ?? existingDocument.mimeType;
      existingDocument.size = file?.size ?? existingDocument.size;

      // Delete existing file and update DB in parallel
      const updateDocument = this._documentRepo.update(
        { id: docId },
        existingDocument,
      );

      const [, result] = await Promise.all([
        deleteExistingFile,
        updateDocument,
      ]);

      if (result.affected === 0) {
        throw new NotFoundException(`Document with id ${docId} not found`);
      }

      logger.logInfo({
        action: 'info',
        message: `Document updated successfully with id: ${docId}`,
        source: 'DocumentService#updateDocument',
      });

      return { message: 'Document Updated Successfully' };
    } catch (error) {
      logger.logError({
        action: 'error',
        message: `Error updating document with id: ${docId}`,
        source: 'DocumentService#updateDocument',
        errorMessage: error?.message,
      });

      throw error;
    }
  }

  public async downloadDocument(
    id: string,
    logger: LoggerService,
  ): Promise<{ stream: fs.ReadStream; mimeType: string; filename: string }> {
    try {
      const document = await this.findDocumentBy(
        {
          where: {
            id,
            deletedAt: IsNull(),
          },
          select: {
            filePath: true,
            mimeType: true,
            title: true,
          },
        },
        logger,
      );

      if (!document) {
        throw new NotFoundException(`Document with id ${id} not found`);
      }
      const { mimeType, title, filePath } = document;
      const absolutePath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(absolutePath)) {
        throw new NotFoundException('File does not exist on server');
      }

      const stream = fs.createReadStream(absolutePath);

      logger.logInfo({
        action: 'info',
        message: `Streaming file for document id: ${id}`,
        source: 'DocumentService#downloadDocument',
      });

      return {
        stream,
        mimeType: mimeType,
        filename: title + path.extname(absolutePath),
      };
    } catch (error) {
      logger.logError({
        action: 'info',
        message: `Error while downloading document for ID: ${id}`,
        source: 'DocumentService#downloadDocument',
      });
      throw error;
    }
  }

  public async getDocumentDetailsById(
    id: string,
    logger: LoggerService,
  ): Promise<DocumentEntity> {
    try {
      const document = await this._documentRepo.findOne({
        where: {
          id,
          deletedAt: IsNull(),
        },
        select: {
          title: true,
          description: true,
          fileName: true,
          mimeType: true,
          size: true,
          updatedAt: true,
          createdAt: true,
          version: true,
        },
      });

      if (!document) {
        throw new NotFoundException(`Document with id ${id} not found`);
      }

      logger.logInfo({
        action: 'info',
        message: `found document details for id: ${id}`,
        source: 'DocumentService#getDocumentDetailsById',
      });
      return document;
    } catch (error) {
      logger.logError({
        action: 'error',
        message: `Document not found with id: ${id}`,
        source: 'DocumentService#getDocumentDetailsById',
      });
      throw error;
    }
  }

  public async deleteDocumentById(
    document: DocumentEntity,
    logger: LoggerService,
    needFileDelete = true,
  ): Promise<SimpleResponseType> {
    try {
      const absolutePath = path.resolve(
        process.cwd(),
        document.filePath.trim(),
      );

      const fileDeleteTask = async (): Promise<void> => {
        if (needFileDelete && fs.existsSync(absolutePath)) {
          await fs.promises.unlink(absolutePath);
          logger.logInfo({
            action: 'info',
            message: `Deleted file: ${absolutePath}`,
            source: 'DocumentService#deleteDocumentFile',
          });
        }
      };

      const dbUpdateTask = this._documentRepo.softDelete({ id: document.id });

      const [, dbResult] = await Promise.allSettled([
        fileDeleteTask(),
        dbUpdateTask,
      ]);

      if (dbResult.status === 'rejected' || dbResult.value.affected === 0) {
        throw new Error('Failed to update document metadata');
      }

      logger.logInfo({
        action: 'delete_document',
        message: `Soft deleted document ${document.id}`,
        source: 'DocumentService#deleteDocumentFile',
      });

      return { message: `Document ${document.id} deleted successfully` };
    } catch (error) {
      logger.logInfo({
        action: 'error',
        message: `Error while deleting a document ${document.id}`,
        source: 'DocumentService#deleteDocumentFile',
      });
      throw error;
    }
  }

  public async getUserDocuments(
    query: GetUserDocumentsDTO,
    logger: LoggerService,
  ): Promise<GetUserDocumentsResponseType> {
    try {
      const qb = this._documentRepo.createQueryBuilder('document');
      const select = [
        'document.id',
        'document.title',
        'document.description',
        'document.fileName',
        'document.mimeType',
        'document.size',
        'document.createdAt',
      ];

      if (query.needToIncludeFilePath) {
        select.push('document.filePath');
      }
      qb.select(select);

      qb.where('document.user_id = :id', { id: query.id });
      qb.andWhere('document.deleted_at IS NULL');

      qb.orderBy('document.created_at', query.order);
      qb.skip((query.page - 1) * query.limit);
      qb.take(query.limit);

      const [data, total] = await qb.getManyAndCount();
      return {
        data: data,
        totalCount: total,
        totalPages: Math.ceil(total / query.limit),
      };
    } catch (error) {
      logger.logError({
        action: 'error',
        message: `Error fetching documents for user ${query.id}`,
        source: 'UserService#getUserDocuments',
        errorMessage: error.message,
      });
      throw new InternalServerErrorException('Failed to fetch documents');
    }
  }

  public async getAllDocuments(
    filters: GetAllDocumentsRequestQueryType,
    logger: LoggerService,
  ): Promise<{
    data: DocumentEntity[];
    totalCount: number;
    totalPages: number;
  }> {
    const { select, title, mimeType, isDeleted, page, limit, sortOrder } =
      filters;

    try {
      const query = this._documentRepo.createQueryBuilder('document');

      // Include soft-deleted records if needed
      query.withDeleted();

      // Select requested columns or default
      const columns = select?.map((field) => `document.${field}`) ?? [
        'document.id',
        'document.title',
        'document.description',
        'document.file_name',
        'document.size',
      ];
      query.select(columns);

      if (title) {
        query.andWhere('document.title ILIKE :title', { title: `%${title}%` });
      }

      if (mimeType) {
        query.andWhere('document.mime_type ILIKE :mimeType', {
          mimeType: `%${mimeType}%`,
        });
      }

      if (typeof isDeleted === 'boolean') {
        if (isDeleted) {
          query.andWhere('document.deleted_at IS NOT NULL');
        } else {
          query.andWhere('document.deleted_at IS NULL');
        }
      }

      query
        .orderBy('document.updated_at', sortOrder)
        .skip((page - 1) * limit)
        .take(limit);

      const [data, total] = await query.getManyAndCount();

      logger.logInfo({
        action: 'get_all_documents',
        message: `Fetched ${data.length} documents (Page ${page})`,
        source: 'DocumentService#getAllDocuments',
      });

      return { data, totalCount: total, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      logger.logError({
        action: 'get_all_documents',
        message: 'Error fetching documents',
        source: 'DocumentService#getAllDocuments',
        errorMessage: error?.message,
        stack: error?.stack,
      });

      throw new InternalServerErrorException('Failed to fetch documents');
    }
  }
}
