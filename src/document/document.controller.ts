import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  UsePipes,
  Req,
  Body,
  Patch,
  Param,
  Get,
  Res,
  Delete,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { SwaggerDoc } from '../common/decorators/swagger.decorator';
import UserRoleEnum from '../common/enums/role.enum';
import { RequestValidationPipe } from '../common/pipes/zodValidation.pipe';
import { SimpleResponseType } from '../common/types/response/genericMessage.type';

import { fileFilter, multerStorage } from './configs/multer.config';
import { DocumentService } from './document.service';
import GetAllDocumentsDto from './dtos/getAllDocuments.dto';
import { DocumentEntity } from './entities/document.entity';
import { DocumentOwnershipGuard } from './guards/documentOwnership.guard';
import { DOCUMENT_SWAGGER_SCHEMA } from './schemas/documentSwagger.schema';
import {
  DownloadDocumentRequestParamType,
  DocumentSchema,
  UpdateDocumentRequestBodyType,
  UpdateDocumentRequestParamType,
  UploadDocumentRequestBodyType,
  GetDocumentRequestParamType,
  DeleteDocumentRequestParamType,
  GetAllDocumentsRequestQueryType,
} from './schemas/request/document.schema';
import { GetAllDocumentsResponseType } from './types/response/getAllDocuments.type';
import { UploadDocumentResponseType } from './types/response/uploadDocument.type';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('all')
  @SwaggerDoc(DOCUMENT_SWAGGER_SCHEMA.GET_ALL_DOCUMENTS)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new RequestValidationPipe(DocumentSchema.shape.getAllDocuments))
  getAllDocuments(
    @Req() req: Request,
    @Query() query: GetAllDocumentsRequestQueryType,
  ): Promise<GetAllDocumentsResponseType> {
    return this.documentService.getAllDocuments(
      new GetAllDocumentsDto(query),
      req.logger,
    );
  }

  @Post('upload')
  @SwaggerDoc(DOCUMENT_SWAGGER_SCHEMA.UPLOAD_FILE)
  @Roles(UserRoleEnum.EDITOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(new RequestValidationPipe(DocumentSchema.shape.uploadDocument))
  @UseInterceptors(
    FileInterceptor('document', {
      storage: multerStorage,
      fileFilter,
      limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Body() body: UploadDocumentRequestBodyType,
  ): Promise<UploadDocumentResponseType> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.documentService.createDocument(
      req.user.sub,
      body,
      file,
      req.logger,
    );
  }

  @Patch(':id/update')
  @SwaggerDoc(DOCUMENT_SWAGGER_SCHEMA.UPDATE_FILE)
  @UseGuards(JwtAuthGuard, DocumentOwnershipGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.EDITOR)
  @UsePipes(new RequestValidationPipe(DocumentSchema.shape.updateDocument))
  @UseInterceptors(
    FileInterceptor('document', {
      storage: multerStorage,
      fileFilter,
      limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
    }),
  )
  async updateDocumentById(
    @Req() req: Request,
    @Param() param: UpdateDocumentRequestParamType,
    @Body() body: UpdateDocumentRequestBodyType,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SimpleResponseType> {
    return this.documentService.updateDocument(
      param.id,
      body,
      req.context as DocumentEntity,
      req.logger,
      file,
    );
  }

  @Get(':id/download')
  @SwaggerDoc(DOCUMENT_SWAGGER_SCHEMA.DOWNLOAD_DOCUMENT)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new RequestValidationPipe(DocumentSchema.shape.downloadDocument))
  async downloadDocument(
    @Param() param: DownloadDocumentRequestParamType,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<void> {
    const { stream, mimeType, filename } =
      await this.documentService.downloadDocument(param.id, req.logger);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    stream.pipe(res);
  }

  @Get(':id')
  @SwaggerDoc(DOCUMENT_SWAGGER_SCHEMA.GET_DOCUMENT_BY_ID)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new RequestValidationPipe(DocumentSchema.shape.getDocument))
  async getDocument(
    @Param() param: GetDocumentRequestParamType,
    @Req() req: Request,
  ): Promise<Partial<DocumentEntity> | null> {
    return this.documentService.getDocumentDetailsById(param.id, req.logger);
  }

  @Delete(':id/delete')
  @SwaggerDoc(DOCUMENT_SWAGGER_SCHEMA.DELETE_DOCUMENT)
  @UseGuards(JwtAuthGuard, DocumentOwnershipGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.EDITOR)
  @UsePipes(new RequestValidationPipe(DocumentSchema.shape.deleteDocument))
  async deleteDocumentById(
    @Req() req: Request,
    @Param() _param: DeleteDocumentRequestParamType,
  ): Promise<SimpleResponseType> {
    return this.documentService.deleteDocumentById(
      req.context as DocumentEntity,
      req.logger,
    );
  }
}
