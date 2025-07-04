import { BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { GetAllDocumentsRequestQueryType } from './schemas/request/document.schema';
import { DatabaseSortingOrder } from '../common/enums/dbOrderSort.enum';

describe('DocumentController', () => {
  let controller: DocumentController;
  let service: Partial<DocumentService>;

  beforeEach(() => {
    service = {
      getAllDocuments: jest.fn(),
      createDocument: jest.fn(),
      updateDocument: jest.fn(),
      downloadDocument: jest.fn(),
      getDocumentDetailsById: jest.fn(),
      deleteDocumentById: jest.fn(),
    };

    controller = new DocumentController(service as DocumentService);
  });

  describe('getAllDocuments', () => {
    it('should call service.getAllDocuments and return result', async () => {
      const query: GetAllDocumentsRequestQueryType = {
        page: 1,
        limit: 10,
        sortOrder: DatabaseSortingOrder.ASC,
        select: [],
      };
      const mockReq = { logger: {} } as Request;
      const expected = { documents: [] };

      (service.getAllDocuments as jest.Mock).mockResolvedValue(expected);

      const result = await controller.getAllDocuments(mockReq, query);

      expect(service.getAllDocuments).toHaveBeenCalledWith(
        expect.anything(),
        mockReq.logger,
      );
      expect(result).toBe(expected);
    });
  });

  describe('uploadDocument', () => {
    const mockReq = { user: { sub: 'userId' }, logger: {} } as Request;
    const mockBody = { title: 'Doc title' };

    it('should throw BadRequestException if file not provided', async () => {
      await expect(
        controller.uploadDocument(undefined as any, mockReq, mockBody),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call service.createDocument and return result', async () => {
      const mockFile = { originalname: 'file.pdf' } as Express.Multer.File;
      const expected = { id: 'docId' };
      (service.createDocument as jest.Mock).mockResolvedValue(expected);

      const result = await controller.uploadDocument(
        mockFile,
        mockReq,
        mockBody,
      );

      expect(service.createDocument).toHaveBeenCalledWith(
        mockReq.user.sub,
        mockBody,
        mockFile,
        mockReq.logger,
      );
      expect(result).toBe(expected);
    });
  });

  describe('updateDocumentById', () => {
    const mockReq = { context: {}, logger: {} } as Request;
    const param = { id: 'docId' };
    const body = { title: 'Updated title' };
    const mockFile = { originalname: 'update.pdf' } as Express.Multer.File;

    it('should call service.updateDocument and return result', async () => {
      const expected = { success: true };
      (service.updateDocument as jest.Mock).mockResolvedValue(expected);

      const result = await controller.updateDocumentById(
        mockReq,
        param,
        body,
        mockFile,
      );

      expect(service.updateDocument).toHaveBeenCalledWith(
        param.id,
        body,
        mockReq.context,
        mockReq.logger,
        mockFile,
      );
      expect(result).toBe(expected);
    });

    it('should work without file', async () => {
      const expected = { success: true };
      (service.updateDocument as jest.Mock).mockResolvedValue(expected);

      const result = await controller.updateDocumentById(mockReq, param, body);

      expect(service.updateDocument).toHaveBeenCalledWith(
        param.id,
        body,
        mockReq.context,
        mockReq.logger,
        undefined,
      );
      expect(result).toBe(expected);
    });
  });

  describe('downloadDocument', () => {
    it('should set headers and pipe stream to response', async () => {
      const param = { id: 'docId' };
      const mockRes = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        end: jest.fn(),
      } as unknown as Response;

      const mockReq = { logger: {} } as Request;
      const mockStream = { pipe: jest.fn() };

      (service.downloadDocument as jest.Mock).mockResolvedValue({
        stream: mockStream,
        mimeType: 'application/pdf',
        filename: 'file.pdf',
      });

      await controller.downloadDocument(param, mockRes, mockReq);

      expect(service.downloadDocument).toHaveBeenCalledWith(
        param.id,
        mockReq.logger,
      );
      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="file.pdf"',
      });
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });
  });

  describe('getDocument', () => {
    it('should call service.getDocumentDetailsById and return result', async () => {
      const param = { id: 'docId' };
      const mockReq = { logger: {} } as Request;
      const expected = { id: 'docId', title: 'Doc' };

      (service.getDocumentDetailsById as jest.Mock).mockResolvedValue(expected);

      const result = await controller.getDocument(param, mockReq);

      expect(service.getDocumentDetailsById).toHaveBeenCalledWith(
        param.id,
        mockReq.logger,
      );
      expect(result).toBe(expected);
    });
  });

  describe('deleteDocumentById', () => {
    it('should call service.deleteDocumentById and return result', async () => {
      const mockReq = { context: {}, logger: {} } as Request;
      const param = { id: 'docId' };

      const expected = { message: 'Deleted successfully' };
      (service.deleteDocumentById as jest.Mock).mockResolvedValue(expected);

      const result = await controller.deleteDocumentById(mockReq, param);

      expect(service.deleteDocumentById).toHaveBeenCalledWith(
        mockReq.context,
        mockReq.logger,
      );
      expect(result).toBe(expected);
    });
  });
});
