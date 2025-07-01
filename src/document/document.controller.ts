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
import UserRoleEnum from '../common/enums/role.enum';
import { RequestValidationPipe } from '../common/pipes/zodValidation.pipe';
import { SimpleResponseType } from '../common/types/response/genericMessage.type';

import { fileFilter, multerStorage } from './configs/multer.config';
import { DocumentService } from './document.service';
import GetAllDocumentsDto from './dtos/getAllDocuments.dto';
import { DocumentEntity } from './entities/document.entity';
import { DocumentOwnershipGuard } from './guards/documentOwnership.guard';
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

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new RequestValidationPipe(DocumentSchema.shape.getAllDocuments))
  getAllDocuments(
    @Req() req: Request,
    @Query() query: GetAllDocumentsRequestQueryType,
  ): Promise<{
    data: DocumentEntity[];
    totalCount: number;
    totalPages: number;
  }> {
    return this.documentService.getAllDocuments(
      req.logger,
      new GetAllDocumentsDto(query),
    );
  }
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.EDITOR)
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
  ): Promise<Partial<DocumentEntity>> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.documentService.createDocument(
      req.logger,
      req.user.sub,
      body,
      file,
    );
  }

  @Patch(':id/update')
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
      req.logger,
      param.id,
      body,
      req.context as DocumentEntity,
      file,
    );
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.EDITOR, UserRoleEnum.VIEWER)
  @UsePipes(new RequestValidationPipe(DocumentSchema.shape.downloadDocument))
  async downloadDocument(
    @Param() param: DownloadDocumentRequestParamType,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<void> {
    const { stream, mimeType, filename } =
      await this.documentService.downloadDocument(req.logger, param.id);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    stream.pipe(res);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.EDITOR, UserRoleEnum.VIEWER)
  @UsePipes(new RequestValidationPipe(DocumentSchema.shape.getDocument))
  async getDocument(
    @Param() param: GetDocumentRequestParamType,
    @Req() req: Request,
  ): Promise<Partial<DocumentEntity> | null> {
    return this.documentService.getDocumentDetailsById(
      req.logger,
      param.id,
      true,
    );
  }

  @Delete(':id/delete')
  @UseGuards(JwtAuthGuard, DocumentOwnershipGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.EDITOR)
  @UsePipes(new RequestValidationPipe(DocumentSchema.shape.deleteDocument))
  async deleteDocumentById(
    @Req() req: Request,
    @Param() _param: DeleteDocumentRequestParamType,
  ): Promise<SimpleResponseType> {
    return this.documentService.deleteDocumentById(
      req.logger,
      req.context as DocumentEntity,
    );
  }
}
