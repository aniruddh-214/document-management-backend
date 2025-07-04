import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { DocumentService } from './document.service';
import { Repository } from 'typeorm';
import { DocumentEntity } from './entities/document.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import AppDataSource from '../config/typeorm.config';
import TestFixtureHelper from '../scripts/test/testDatabseSeederHelper';
import path from 'path';
import {
  MOCK_LOGGER_SERVICE,
  TEST_DOCUMENT,
  TEST_USER,
} from '../scripts/test/dummyData';

import UserRoleEnum from '../common/enums/role.enum';
import { randomUUID } from 'crypto';
import FSUtils from './utils/fs.util';
import { DatabaseSortingOrder } from '../common/enums/dbOrderSort.enum';
import GetUserDocumentsDTO from '../user/dtos/getUserDocuements.dto';
import { GetAllDocumentsRequestQueryType } from './schemas/request/document.schema';

describe('DocumentService', () => {
  let documentService: DocumentService;
  let documentRepo: Repository<DocumentEntity>;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await TestFixtureHelper.clearDocumentTable();
    await TestFixtureHelper.clearUserTable();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: AppDataSource.getRepository(DocumentEntity),
        },
      ],
    }).compile();

    documentService = module.get<DocumentService>(DocumentService);
    documentRepo = module.get<Repository<DocumentEntity>>(
      getRepositoryToken(DocumentEntity),
    );
  });

  beforeEach(async () => {
    await TestFixtureHelper.clearDocumentTable();
    await TestFixtureHelper.clearUserTable();
  });

  //  -->>

  afterEach(async () => {
    await TestFixtureHelper.clearDocumentTable();
    await TestFixtureHelper.clearUserTable();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(documentService).toBeDefined();
  });

  describe('createDocument', () => {
    it('Should create a document', async () => {
      const testFilePath = path.join(__dirname, '.././../test/testAsset.pdf');

      const mockFile = {
        filename: 'test-file.txt',
        size: 20,
        path: testFilePath,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const result = await documentService.createDocument(
        user.id,
        {
          title: 'Integration Test Document',
          description: 'Test description',
        },
        mockFile,
        MOCK_LOGGER_SERVICE,
      );

      expect(result).toHaveProperty('id');
      expect(result.message).toBe('Document successfully uploaded');

      const saved = await documentRepo.findOneBy({ id: result.id });
      expect(saved).toBeDefined();
      expect(saved?.title).toBe('Integration Test Document');

      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });

    it('should throw InternalServerErrorException if no insert ID is returned', async () => {
      const testFilePath = path.join(__dirname, '../../test/testAsset.pdf');

      const mockFile = {
        filename: 'testAsset.pdf',
        size: 20,
        path: testFilePath,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      // Spy on query builder to simulate missing ID
      const insertQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ raw: [{}] }), // no `id` in raw
      };

      const spy = jest
        .spyOn(documentRepo, 'createQueryBuilder')
        .mockReturnValue(insertQueryBuilder as any);

      await expect(
        documentService.createDocument(
          user.id,
          {
            title: 'Failure Document',
            description: 'Missing insert ID',
          },
          mockFile,
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow('Document creation failed — no ID returned');

      spy.mockRestore();
    });
  });

  describe('findDocumentBy', () => {
    it('should return a document when valid conditions are passed', async () => {
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const insertedDoc = await TestFixtureHelper.insertDocument(
        TEST_DOCUMENT(user.id),
      );

      const result = await documentService.findDocumentBy(
        {
          where: { id: insertedDoc.id },
        },
        MOCK_LOGGER_SERVICE,
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(insertedDoc.id);
      expect(result?.title).toBe('Test Document');
      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });

    it('should return null if no document matches the conditions', async () => {
      const result = await documentService.findDocumentBy(
        {
          where: { id: randomUUID() },
        },
        MOCK_LOGGER_SERVICE,
      );

      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException if repository throws error', async () => {
      const spy = jest
        .spyOn(documentRepo, 'findOne')
        .mockRejectedValue(new Error('DB error'));

      await expect(
        documentService.findDocumentBy(
          {
            where: { id: randomUUID() },
          },
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow('Failed to fetch document');

      spy.mockRestore();
      jest.restoreAllMocks();
    });
  });

  describe('updateDocument', () => {
    it('should update document metadata and file successfully', async () => {
      const testFilePath = path.join(__dirname, '../../test/temp.pdf');
      fs.writeFileSync(testFilePath, 'original content');
      const newFilePath = path.join(__dirname, '../../test/testAsset2.pdf');

      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      // Insert initial document
      const existingDoc = await documentRepo.save({
        title: 'Old Title',
        description: 'Old Description',
        fileName: 'oldFile.pdf',
        filePath: FSUtils.AbsoluteToRelativePath(testFilePath),
        mimeType: 'application/pdf',
        size: 1234,
        userId: user.id,
      });

      const mockNewFile = {
        filename: 'updatedFile.pdf',
        size: 5678,
        path: newFilePath,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const updatePayload = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const result = await documentService.updateDocument(
        existingDoc.id,
        updatePayload,
        existingDoc,
        MOCK_LOGGER_SERVICE,
        mockNewFile,
      );

      expect(result).toEqual({ message: 'Document Updated Successfully' });

      const updatedDoc = await documentRepo.findOneBy({ id: existingDoc.id });
      expect(updatedDoc).toBeDefined();
      expect(updatedDoc?.title).toBe(updatePayload.title);
      expect(updatedDoc?.description).toBe(updatePayload.description);
      expect(updatedDoc?.fileName).toBe(mockNewFile.filename);
      expect(updatedDoc?.size).toBe(mockNewFile.size);
      expect(updatedDoc?.mimeType).toBe(mockNewFile.mimetype);
      expect(updatedDoc?.filePath.replace(/\\/g, '/')).toContain(
        'test/testAsset2.pdf',
      );

      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });

    it('should throw BadRequestException if no updates or file are provided', async () => {
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const existingDoc = await documentRepo.save({
        title: 'Test Title',
        description: 'Test Description',
        fileName: 'test.pdf',
        filePath: '/uploads/test.pdf',
        mimeType: 'application/pdf',
        size: 1000,
        userId: user.id,
      });

      await expect(
        documentService.updateDocument(
          existingDoc.id,
          {},
          existingDoc,
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow('No update data provided');

      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });

    it('should throw NotFoundException if update affects 0 rows', async () => {
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const existingDoc = await documentRepo.save({
        title: 'Test Title',
        description: 'Test Description',
        fileName: 'test.pdf',
        filePath: '/uploads/test.pdf',
        mimeType: 'application/pdf',
        size: 1000,
        userId: user.id,
      });

      // Spy on update to simulate affected = 0
      const spy = jest
        .spyOn(documentRepo, 'update')
        .mockResolvedValue({ affected: 0 } as any);

      await expect(
        documentService.updateDocument(
          existingDoc.id,
          { description: 'test' },
          existingDoc,
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow(`Document with id ${existingDoc.id} not found`);
      spy.mockRestore();
      jest.restoreAllMocks();

      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });

    it('should throw NotFoundException if update affects 0 rows', async () => {
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const existingDoc = await documentRepo.save({
        title: 'Test Title',
        description: 'Test Description',
        fileName: 'test.pdf',
        filePath: '/uploads/test.pdf',
        mimeType: 'application/pdf',
        size: 1000,
        userId: user.id,
      });

      // Spy on update to simulate affected = 0
      const spy = jest
        .spyOn(documentRepo, 'update')
        .mockResolvedValue({ affected: 0 } as any);

      await expect(
        documentService.updateDocument(
          existingDoc.id,
          { title: 'test' },
          existingDoc,
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow(`Document with id ${existingDoc.id} not found`);
      spy.mockRestore();
      jest.restoreAllMocks();

      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });
  });

  describe('downloadDocument', () => {
    it('should return a readable stream and correct metadata when document exists', async () => {
      const testFilePath = path.join(__dirname, '../../test/testDownload.pdf');
      const relativePath = FSUtils.AbsoluteToRelativePath(testFilePath);

      fs.writeFileSync(testFilePath, 'Sample file content');

      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const insertedDoc = await documentRepo.save({
        title: 'Downloadable Document',
        description: 'Test file download',
        fileName: 'testDownload.pdf',
        filePath: relativePath,
        mimeType: 'application/pdf',
        size: 1234,
        userId: user.id,
      });

      const result = await documentService.downloadDocument(
        insertedDoc.id,
        MOCK_LOGGER_SERVICE,
      );

      expect(result).toBeDefined();
      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename).toBe('Downloadable Document.pdf');
      expect(result.stream).toBeInstanceOf(fs.ReadStream);

      // Optional: read the stream to confirm content
      const content = await new Promise<string>((resolve, reject) => {
        let data = '';
        result.stream.setEncoding('utf8');
        result.stream.on('data', (chunk) => (data += chunk));
        result.stream.on('end', () => resolve(data));
        result.stream.on('error', reject);
      });

      expect(content).toBe('Sample file content');

      fs.unlinkSync(testFilePath); // cleanup
      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });

    it('should throw NotFoundException if document is not found in DB', async () => {
      const id = randomUUID();
      await expect(
        documentService.downloadDocument(id, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(`Document with id ${id} not found`);
    });

    it('should throw NotFoundException if file does not exist on disk', async () => {
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const fakeRelativePath = FSUtils.AbsoluteToRelativePath(
        path.join(__dirname, '../../test/nonExistentFile.pdf'),
      );

      const doc = await documentRepo.save({
        title: 'Broken File',
        description: 'Points to missing file',
        fileName: 'nonExistentFile.pdf',
        filePath: fakeRelativePath,
        mimeType: 'application/pdf',
        size: 100,
        userId: user.id,
      });

      await expect(
        documentService.downloadDocument(doc.id, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow('File does not exist on server');

      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });
  });

  describe('getDocumentDetailsById', () => {
    it('should return document details when document exists', async () => {
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const doc = await documentRepo.save({
        title: 'Doc Details',
        description: 'Checking getDocumentDetailsById',
        fileName: 'doc.pdf',
        filePath: '/uploads/doc.pdf',
        mimeType: 'application/pdf',
        size: 1111,
        userId: user.id,
      });

      const result = await documentService.getDocumentDetailsById(
        doc.id,
        MOCK_LOGGER_SERVICE,
      );

      expect(result).toBeDefined();
      expect(result.id).toBeUndefined(); // because not selected
      expect(result.title).toBe('Doc Details');
      expect(result.description).toBe('Checking getDocumentDetailsById');
      expect(result.mimeType).toBe('application/pdf');
      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });

    it('should throw NotFoundException if document is not found', async () => {
      const id = randomUUID();
      await expect(
        documentService.getDocumentDetailsById(id, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(`Document with id ${id} not found`);
    });
  });

  describe('deleteDocumentById', () => {
    it('should soft delete the document and remove the file from disk', async () => {
      const filePath = path.join(__dirname, '../../test/testDelete.pdf');
      const relativePath = FSUtils.AbsoluteToRelativePath(filePath);
      fs.writeFileSync(filePath, 'delete me');

      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const doc = await documentRepo.save({
        title: 'To Delete',
        description: 'This file will be deleted',
        fileName: 'testDelete.pdf',
        filePath: relativePath,
        mimeType: 'application/pdf',
        size: 999,
        userId: user.id,
      });

      const result = await documentService.deleteDocumentById(
        doc,
        MOCK_LOGGER_SERVICE,
        true,
      );

      const deleted = await documentRepo.findOne({
        where: { id: doc.id },
        withDeleted: true,
      });

      expect(result).toEqual({
        message: `Document ${doc.id} deleted successfully`,
      });
      expect(deleted?.deletedAt).toBeTruthy();
      expect(fs.existsSync(filePath)).toBe(false); // file should be deleted

      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });

    it('should soft delete document even if file does not exist', async () => {
      const fakePath = FSUtils.AbsoluteToRelativePath(
        path.join(__dirname, '../../test/missingFile.pdf'),
      );

      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const doc = await documentRepo.save({
        title: 'Missing File',
        description: 'File is missing but should not block delete',
        fileName: 'missingFile.pdf',
        filePath: fakePath,
        mimeType: 'application/pdf',
        size: 123,
        userId: user.id,
      });

      const result = await documentService.deleteDocumentById(
        doc,
        MOCK_LOGGER_SERVICE,
        true,
      );

      const deleted = await documentRepo.findOne({
        where: { id: doc.id },
        withDeleted: true,
      });

      expect(result).toEqual({
        message: `Document ${doc.id} deleted successfully`,
      });
      expect(deleted?.deletedAt).toBeTruthy();

      await TestFixtureHelper.clearDocumentTable();
      await TestFixtureHelper.clearUserTable();
    });
    it('should throw error if database soft delete fails', async () => {
      const filePath = path.join(
        __dirname,
        '../../test/testSoftDeleteFail.pdf',
      );
      const relativePath = FSUtils.AbsoluteToRelativePath(filePath);
      fs.writeFileSync(filePath, 'safe');

      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const doc = await documentRepo.save({
        title: 'DB Fail',
        description: 'Will simulate DB failure',
        fileName: 'testSoftDeleteFail.pdf',
        filePath: relativePath,
        mimeType: 'application/pdf',
        size: 321,
        userId: user.id,
      });

      jest
        .spyOn(documentRepo, 'softDelete')
        .mockRejectedValueOnce(new Error('DB failure'));

      await expect(
        documentService.deleteDocumentById(doc, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow('Failed to update document metadata');

      jest.restoreAllMocks();

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    it('should soft delete the document but not delete the file when needFileDelete is false', async () => {
      const filePath = path.join(__dirname, '../../test/testNoDelete.pdf');
      const relativePath = FSUtils.AbsoluteToRelativePath(filePath);
      fs.writeFileSync(filePath, 'keep me'); // create dummy file

      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      const doc = await documentRepo.save({
        title: 'Keep File',
        description: 'Should soft delete but retain file',
        fileName: 'testNoDelete.pdf',
        filePath: relativePath,
        mimeType: 'application/pdf',
        size: 100,
        userId: user.id,
      });

      const result = await documentService.deleteDocumentById(
        doc,
        MOCK_LOGGER_SERVICE,
        false, // 👈 key part here
      );

      const deleted = await documentRepo.findOne({
        where: { id: doc.id },
        withDeleted: true,
      });

      expect(result).toEqual({
        message: `Document ${doc.id} deleted successfully`,
      });

      expect(deleted?.deletedAt).toBeTruthy(); // soft delete confirmed
      expect(fs.existsSync(filePath)).toBe(true); // file should NOT be deleted

      fs.unlinkSync(filePath); // cleanup
    });
  });

  describe('getUserDocuments', () => {
    it('should return paginated user documents with and without filePath', async () => {
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      // Insert 3 documents
      await documentRepo.save([
        {
          title: 'Doc 1',
          description: 'desc 1',
          fileName: 'doc1.pdf',
          filePath: '/uploads/doc1.pdf',
          mimeType: 'application/pdf',
          size: 100,
          userId: user.id,
        },
        {
          title: 'Doc 2',
          description: 'desc 2',
          fileName: 'doc2.pdf',
          filePath: '/uploads/doc2.pdf',
          mimeType: 'application/pdf',
          size: 200,
          userId: user.id,
        },
        {
          title: 'Doc 3',
          description: 'desc 3',
          fileName: 'doc3.pdf',
          filePath: '/uploads/doc3.pdf',
          mimeType: 'application/pdf',
          size: 300,
          userId: user.id,
        },
      ]);

      const baseQuery: GetUserDocumentsDTO = {
        id: user.id,
        page: 1,
        limit: 2,
        order: DatabaseSortingOrder.DESC,
        needToIncludeFilePath: false,
      };

      // ✅ With filePath
      const withFilePath = await documentService.getUserDocuments(
        { ...baseQuery, needToIncludeFilePath: true },
        MOCK_LOGGER_SERVICE,
      );

      expect(withFilePath.data.length).toBe(2);
      expect(withFilePath.totalCount).toBe(3);
      expect(withFilePath.totalPages).toBe(2);
      expect(withFilePath.data[0]).toHaveProperty('filePath');

      // ✅ Without filePath
      const withoutFilePath = await documentService.getUserDocuments(
        { ...baseQuery, needToIncludeFilePath: false },
        MOCK_LOGGER_SERVICE,
      );

      expect(withoutFilePath.data.length).toBe(2);
      expect(withoutFilePath.data[0].filePath).toBeUndefined();
    });
    it('should throw InternalServerErrorException if query builder fails', async () => {
      const mock = jest
        .spyOn(documentRepo, 'createQueryBuilder')
        .mockImplementation(() => {
          throw new Error('QueryBuilder crashed');
        });

      await expect(
        documentService.getUserDocuments(
          {
            id: randomUUID(),
            page: 1,
            limit: 10,
            order: DatabaseSortingOrder.ASC,
            needToIncludeFilePath: false,
          },
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow('Failed to fetch documents');

      mock.mockRestore();
    });
  });

  describe('getAllDocuments', () => {
    it('should return all documents with pagination, filtering, and selected fields', async () => {
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      await documentRepo.save([
        {
          title: 'Node.js Guide',
          description: 'For developers',
          fileName: 'node.pdf',
          filePath: '/uploads/node.pdf',
          mimeType: 'application/pdf',
          size: 1234,
          userId: user.id,
        },
        {
          title: 'React Guide',
          description: 'For frontend devs',
          fileName: 'react.pdf',
          filePath: '/uploads/react.pdf',
          mimeType: 'application/pdf',
          size: 4321,
          userId: user.id,
        },
        {
          title: 'Delete Me',
          description: 'To be soft deleted',
          fileName: 'delete.pdf',
          filePath: '/uploads/delete.pdf',
          mimeType: 'application/pdf',
          size: 1000,
          userId: user.id,
          deletedAt: new Date(),
        },
      ]);

      const filters: GetAllDocumentsRequestQueryType = {
        select: ['id', 'title', 'mimeType'],
        title: 'guide',
        mimeType: 'pdf',
        isDeleted: false,
        page: 1,
        limit: 10,
        sortOrder: DatabaseSortingOrder.DESC,
      };

      const result = await documentService.getAllDocuments(
        filters,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.totalCount).toBe(2); // Node.js Guide + React Guide
      expect(result.totalPages).toBe(1);
      expect(result.data.length).toBe(2);
      expect(result.data[0]).toHaveProperty('title');
      expect(result.data[0]).toHaveProperty('mimeType');
      expect(result.data[0].description).toBeUndefined(); // not selected
    });

    it('should return only soft-deleted documents when isDeleted is true', async () => {
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      // Create and then soft-delete
      const softDeletedDoc = await documentRepo.save({
        title: 'Delete Me',
        description: 'To be soft deleted',
        fileName: 'delete.pdf',
        filePath: '/uploads/delete.pdf',
        mimeType: 'application/pdf',
        size: 1000,
        userId: user.id,
      });
      await documentRepo.softDelete({ id: softDeletedDoc.id });

      const filters: GetAllDocumentsRequestQueryType = {
        select: ['id', 'title'],
        isDeleted: true,
        page: 1,
        limit: 5,
        sortOrder: DatabaseSortingOrder.ASC,
      };

      const result = await documentService.getAllDocuments(
        filters,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.totalCount).toBe(1);
      expect(result.data[0].title).toBe('Delete Me');
      expect(result.data[0].id).toBe(softDeletedDoc.id);
    });

    it('should throw InternalServerErrorException when query builder fails', async () => {
      const spy = jest
        .spyOn(documentRepo, 'createQueryBuilder')
        .mockImplementation(() => {
          throw new Error('Simulated DB failure');
        });

      const filters: GetAllDocumentsRequestQueryType = {
        page: 1,
        limit: 10,
        sortOrder: DatabaseSortingOrder.DESC,
        isDeleted: false,
        select: ['id', 'fileName'],
      };

      await expect(
        documentService.getAllDocuments(filters, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow('Failed to fetch documents');

      spy.mockRestore();
    });

    it('should return default fields when no select filter is provided', async () => {
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.EDITOR,
      });

      await documentRepo.save({
        title: 'Default Select Test',
        description: 'Should return default fields',
        fileName: 'default.pdf',
        filePath: '/uploads/default.pdf',
        mimeType: 'application/pdf',
        size: 500,
        userId: user.id,
      });

      const filters: any = {
        page: 1,
        limit: 10,
        sortOrder: DatabaseSortingOrder.DESC,
        isDeleted: false,
      };

      const result = await documentService.getAllDocuments(
        filters,
        MOCK_LOGGER_SERVICE,
      );

      const result2 = await documentService.getAllDocuments(
        { ...filters, isDeleted: '' },
        MOCK_LOGGER_SERVICE,
      );

      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('title');
      expect(result.data[0]).toHaveProperty('description');
      expect(result.data[0]).toHaveProperty('size');
      expect(result.data[0]).toHaveProperty('fileName');
      expect(result.data[0].filePath).toBeUndefined();

      expect(result2.data[0]).toHaveProperty('title');
      expect(result2.data[0]).toHaveProperty('description');
    });
  });
});
