import * as fs from 'fs';
import path from 'path';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';

import { SimpleResponseType } from '../common/types/response/genericMessage.type';
import LoggerService from '../common/utils/logging/loggerService';

import { DocumentEntity } from './entities/document.entity';
import {
  GetAllDocumentsRequestQueryType,
  UploadDocumentRequestBodyType,
} from './schemas/request/document.schema';
import FSUtils from './utils/fs.util';

@Injectable()
export class DocumentService {
  public constructor(
    @InjectRepository(DocumentEntity)
    private readonly _documentRepo: Repository<DocumentEntity>,
  ) {}

  public async createDocument(
    logger: LoggerService,
    userId: string,
    body: UploadDocumentRequestBodyType,
    file: Express.Multer.File,
  ): Promise<Partial<DocumentEntity>> {
    logger.logInfo({
      action: 'info',
      message: 'Saving user document information into DB',
      source: 'DocumentService#createDocument',
    });

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

      return {
        id: insertId,
      };
    } catch (error) {
      logger.logError({
        action: 'error',
        message: 'Error while saving document to the database',
        source: 'DocumentService#createDocument',
        errorMessage: error?.message || 'Unknown error',
      });

      throw new InternalServerErrorException('Failed to create document');
    }
  }

  public async findDocumentBy(
    logger: LoggerService,
    conditions: FindOneOptions<DocumentEntity>,
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
        errorMessage: error?.message || 'Unknown error',
      });

      throw new InternalServerErrorException('Failed to fetch document');
    }
  }

  public async updateDocument(
    logger: LoggerService,
    docId: string,
    newUpdates: Partial<DocumentEntity>,
    existingDocument: DocumentEntity,
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
        logger.logError({
          action: 'error',
          message: `No document found to update with id: ${docId}`,
          source: 'DocumentService#updateDocument',
        });
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

      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update document');
    }
  }

  public async downloadDocument(
    logger: LoggerService,
    id: string,
  ): Promise<{ stream: fs.ReadStream; mimeType: string; filename: string }> {
    const document = await this.findDocumentBy(logger, {
      where: {
        id,
        isDeleted: false,
        isActive: true,
      },
      select: {
        filePath: true,
        mimeType: true,
        title: true,
      },
    });

    if (!document?.filePath) {
      logger.logError({
        action: 'download',
        message: `Document not found with id: ${id}`,
        source: 'DocumentService#downloadDocument',
      });
      throw new NotFoundException(`Document with id ${id} not found`);
    }
    const { mimeType, title, filePath } = document;
    const absolutePath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      logger.logError({
        action: 'download',
        message: `File not found on disk: ${absolutePath}`,
        source: 'DocumentService#downloadDocument',
      });
      throw new NotFoundException('File does not exist on server');
    }

    const stream = fs.createReadStream(absolutePath);

    logger.logInfo({
      action: 'download',
      message: `Streaming file for document id: ${id}`,
      source: 'DocumentService#downloadDocument',
    });

    return {
      stream,
      mimeType: mimeType || 'application/octet-stream',
      filename: title + path.extname(absolutePath),
    };
  }

  public async getDocumentDetailsById(
    logger: LoggerService,
    id: string,
    throwIfNotFound = true,
  ): Promise<DocumentEntity | null> {
    logger.logInfo({
      action: 'fetch',
      message: `Fetching document details for id: ${id}`,
      source: 'DocumentService#getDocumentDetailsById',
    });

    const document = await this._documentRepo.findOne({
      where: {
        id,
        isDeleted: false,
        isActive: true,
      },
      select: {
        title: true,
        description: true,
        fileName: true,
        mimeType: true,
        size: true,
        updatedAt: true,
        createdAt: true,
        documentStatus: true,
      },
    });

    if (!document && throwIfNotFound) {
      logger.logError({
        action: 'fetch',
        message: `Document not found with id: ${id}`,
        source: 'DocumentService#getDocumentDetailsById',
      });
      throw new NotFoundException(`Document with id ${id} not found`);
    }

    return document;
  }

  public async deleteDocumentById(
    logger: LoggerService,
    document: DocumentEntity,
    needFileDelete = true,
  ): Promise<SimpleResponseType> {
    const absolutePath = path.resolve(process.cwd(), document.filePath.trim());

    const fileDeleteTask = async (): Promise<void> => {
      if (needFileDelete && fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
        logger.logInfo({
          action: 'delete_file',
          message: `Deleted file: ${absolutePath}`,
          source: 'DocumentService#deleteDocumentFile',
        });
      }
    };

    const dbUpdateTask = this._documentRepo.update(
      { id: document.id },
      { isDeleted: true, isActive: false },
    );

    const [fileResult, dbResult] = await Promise.allSettled([
      fileDeleteTask(),
      dbUpdateTask,
    ]);

    if (fileResult.status === 'rejected') {
      logger.logWarn({
        action: 'delete_file',
        message: 'File delete failed (non-blocking)',
        source: 'DocumentService#deleteDocumentFile',
        errorMessage: fileResult.reason?.message,
      });
    }

    if (dbResult.status === 'rejected' || dbResult.value.affected === 0) {
      throw new Error('Failed to update document metadata');
    }

    logger.logInfo({
      action: 'delete_document',
      message: `Soft deleted document ${document.id}`,
      source: 'DocumentService#deleteDocumentFile',
    });

    return { message: `Document ${document.id} deleted successfully` };
  }

  public async getUserDocuments(
    logger: LoggerService,
    userId: string,
  ): Promise<DocumentEntity[]> {
    logger.logInfo({
      action: 'get_user_documents',
      message: `Fetching documents for user: ${userId}`,
      source: 'UserService#getUserDocuments',
    });

    try {
      const documents = await this._documentRepo.find({
        where: {
          userId,
          isDeleted: false,
          isActive: true,
        },
        order: {
          createdAt: 'DESC',
        },
        select: {
          id: true,
          title: true,
          description: true,
          fileName: true,
          filePath: true,
          mimeType: true,
          size: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return documents;
    } catch (error) {
      logger.logError({
        action: 'get_user_documents',
        message: `Error fetching documents for user ${userId}`,
        source: 'UserService#getUserDocuments',
        errorMessage: error.message,
      });
      throw new InternalServerErrorException('Failed to fetch documents');
    }
  }

  public async getAllDocuments(
    logger: LoggerService,
    filters: GetAllDocumentsRequestQueryType,
  ): Promise<{ data: DocumentEntity[]; total: number }> {
    logger.logInfo({
      action: 'info',
      message: 'Fetching documents with filters',
      source: 'DocumentService#getAllDocuments',
      details: filters,
    });
    const {
      select,
      title,
      mimeType,
      documentStatus,
      isActive,
      isDeleted,
      page,
      limit,
      sortOrder,
    } = filters;

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
        'document.document_status',
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

      if (documentStatus?.length) {
        query.andWhere('document.document_status IN (:...statuses)', {
          statuses: documentStatus,
        });
      }

      if (typeof isActive === 'boolean') {
        query.andWhere('document.is_active = :isActive', { isActive });
      }

      if (typeof isDeleted === 'boolean') {
        query.andWhere('document.is_deleted = :isDeleted', { isDeleted });
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

      return { data, total };
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
