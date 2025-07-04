import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import UserRoleEnum from '../../common/enums/role.enum';
import { DocumentService } from '../document.service';

@Injectable()
export class DocumentOwnershipGuard implements CanActivate {
  constructor(private readonly documentService: DocumentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const { role, sub: userId } = request.user;
    const documentId = request.params.id;
    if (!documentId || !userId) {
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
    }

    const doc = await this.documentService.findDocumentBy(
      {
        where: {
          id: documentId,
        },
      },
      request.logger,
    );

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.userId !== userId && role !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException('You do not have access to this document');
    }

    request.context = doc;
    return true;
  }
}
