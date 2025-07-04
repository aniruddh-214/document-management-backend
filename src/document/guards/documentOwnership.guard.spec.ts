import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DocumentOwnershipGuard } from './documentOwnership.guard';
import { DocumentService } from '../document.service';
import UserRoleEnum from '../../common/enums/role.enum';

describe('DocumentOwnershipGuard', () => {
  let guard: DocumentOwnershipGuard;
  let documentService: Partial<Record<keyof DocumentService, jest.Mock>>;

  const mockRequest = {
    params: { id: 'doc123' },
    user: { sub: 'user123', role: UserRoleEnum.EDITOR },
    logger: {},
  };

  const createMockContext = (req = mockRequest): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    documentService = {
      findDocumentBy: jest.fn(),
    };

    guard = new DocumentOwnershipGuard(
      documentService as unknown as DocumentService,
    );
  });

  it('should allow access if user owns the document', async () => {
    documentService.findDocumentBy!.mockResolvedValue({
      id: 'doc123',
      userId: 'user123',
    });

    const canActivate = await guard.canActivate(createMockContext());

    expect(canActivate).toBe(true);
    expect(documentService.findDocumentBy).toHaveBeenCalled();
  });

  it('should allow access if user is admin', async () => {
    const adminReq = {
      ...mockRequest,
      user: { sub: 'admin456', role: UserRoleEnum.ADMIN },
    };

    documentService.findDocumentBy!.mockResolvedValue({
      id: 'doc123',
      userId: 'someOtherUser',
    });

    const canActivate = await guard.canActivate(createMockContext(adminReq));

    expect(canActivate).toBe(true);
  });

  it('should throw UnauthorizedException if documentId or userId is missing', async () => {
    const badReq = {
      ...mockRequest,
      params: {},
    };

    await expect(
      guard.canActivate(createMockContext(badReq as any)),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw NotFoundException if document not found', async () => {
    documentService.findDocumentBy!.mockResolvedValue(null);

    await expect(guard.canActivate(createMockContext())).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ForbiddenException if user is not owner and not admin', async () => {
    documentService.findDocumentBy!.mockResolvedValue({
      id: 'doc123',
      userId: 'anotherUser',
    });

    await expect(guard.canActivate(createMockContext())).rejects.toThrow(
      ForbiddenException,
    );
  });
});
