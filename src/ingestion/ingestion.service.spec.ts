import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { DocumentService } from '../document/document.service';
import AppDataSource from '../config/typeorm.config';
import TestFixtureHelper from '../scripts/test/testDatabseSeederHelper';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IngestionEntity } from './entities/ingestion.entity';
import { DocumentEntity } from '../document/entities/document.entity';
import {
  MOCK_LOGGER_SERVICE,
  TEST_DOCUMENT,
  TEST_USER,
} from '../scripts/test/dummyData';
import UserRoleEnum from '../common/enums/role.enum';
import IngestionStatusEnum from './enums/ingestion.enum';
import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

jest.setTimeout(999999);

describe('IngestionService', () => {
  let ingestionService: IngestionService;
  let documentService: DocumentService;
  let ingestionRepo: Repository<IngestionEntity>;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: AppDataSource.getRepository(DocumentEntity),
        },
        DocumentService,
        {
          provide: getRepositoryToken(IngestionEntity),
          useValue: AppDataSource.getRepository(IngestionEntity),
        },
        IngestionService,
      ],
    }).compile();

    ingestionService = module.get<IngestionService>(IngestionService);
    documentService = module.get<DocumentService>(DocumentService);
    ingestionRepo = module.get<Repository<IngestionEntity>>(
      getRepositoryToken(IngestionEntity),
    );
  });

  beforeEach(async () => {
    await TestFixtureHelper.clearIngestionTable();
    await TestFixtureHelper.clearDocumentTable();
    await TestFixtureHelper.clearUserTable();
  });

  afterEach(async () => {
    await TestFixtureHelper.clearIngestionTable();
    await TestFixtureHelper.clearDocumentTable();
    await TestFixtureHelper.clearUserTable();
    jest.clearAllMocks();
  });

  // afterAll(async () => {
  //   if (AppDataSource.isInitialized) {
  //     await AppDataSource.destroy();
  //   }
  // });

  it('should be defined', () => {
    expect(ingestionService).toBeDefined();
    expect(documentService).toBeDefined();
  });

  describe('triggerIngestion', () => {
    it('should trigger ingestion successfully for valid user and document', async () => {
      // Insert user
      const user = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        role: UserRoleEnum.VIEWER,
      });

      // Insert document owned by the user
      const document = await TestFixtureHelper.insertDocument(
        TEST_DOCUMENT(user.id),
      );

      // Call the ingestion trigger
      const result = await ingestionService.triggerIngestion(
        MOCK_LOGGER_SERVICE,
        { sub: user.id, role: user.role },
        document.id,
      );

      expect(result).toHaveProperty('ingestionId');
      expect(result.documentId).toBe(document.id);
      expect(result.message).toContain(IngestionStatusEnum.QUEUED);
    });

    it('should throw UnauthorizedException if user is not the owner and not admin', async () => {
      const ownerUser = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        email: 'owner@test.com',
      });
      const otherUser = await TestFixtureHelper.insertUser({
        ...TEST_USER,
        email: 'other@test.com',
      });

      const document = await TestFixtureHelper.insertDocument(
        TEST_DOCUMENT(ownerUser.id),
      );

      await expect(
        ingestionService.triggerIngestion(
          MOCK_LOGGER_SERVICE,
          { sub: otherUser.id, role: UserRoleEnum.VIEWER },
          document.id,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if document is not found', async () => {
      const user = await TestFixtureHelper.insertUser(TEST_USER);

      const nonExistentDocId = randomUUID();

      await expect(
        ingestionService.triggerIngestion(
          MOCK_LOGGER_SERVICE,
          { sub: user.id, role: user.role },
          nonExistentDocId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('simulateProcessing', () => {
    const ingestionRepoMock = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    const ingestionService = new IngestionService(
      ingestionRepoMock as unknown as Repository<IngestionEntity>,
      {} as any,
    );

    const mockDelayFn = (fn: () => void, _ms: number) => fn();

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should mark ingestion as COMPLETED when random > 0.2', async () => {
      const onStatusChange = jest.fn();

      await new Promise<void>((resolve) => {
        ingestionService.simulateProcessing('abc123', MOCK_LOGGER_SERVICE, {
          delayFn: (fn) => fn(), // instantly invoke
          randomFn: () => 0.95, // force success
          onStatusChange,
        });

        // Wait for next tick so both async updates are complete
        setImmediate(() => {
          expect(ingestionRepoMock.update).toHaveBeenNthCalledWith(
            1,
            'abc123',
            expect.objectContaining({
              status: IngestionStatusEnum.PROCESSING,
            }),
          );

          expect(ingestionRepoMock.update).toHaveBeenNthCalledWith(
            2,
            'abc123',
            expect.objectContaining({
              status: IngestionStatusEnum.COMPLETED,
              logs: expect.stringContaining('Completed successfully'),
              errorMessage: undefined,
            }),
          );

          expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'completed' }),
          );

          expect(onStatusChange).toHaveBeenCalledWith(
            IngestionStatusEnum.PROCESSING,
          );
          expect(onStatusChange).toHaveBeenCalledWith(
            IngestionStatusEnum.COMPLETED,
          );

          resolve();
        });
      });
    });

    it('should mark ingestion as FAILED when random <= 0.2', async () => {
      const onStatusChange = jest.fn();

      await new Promise<void>((resolve) => {
        ingestionService.simulateProcessing('def456', MOCK_LOGGER_SERVICE, {
          delayFn: (fn) => fn(),
          randomFn: () => 0.1, // force failure
          onStatusChange,
        });

        setImmediate(() => {
          expect(ingestionRepoMock.update).toHaveBeenNthCalledWith(
            1,
            'def456',
            expect.objectContaining({
              status: IngestionStatusEnum.PROCESSING,
            }),
          );

          expect(ingestionRepoMock.update).toHaveBeenNthCalledWith(
            2,
            'def456',
            expect.objectContaining({
              status: IngestionStatusEnum.FAILED,
              logs: expect.stringContaining('Failed at'),
              errorMessage: 'Simulated ingestion failure',
            }),
          );

          expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'failed' }),
          );

          expect(onStatusChange).toHaveBeenCalledWith(
            IngestionStatusEnum.PROCESSING,
          );
          expect(onStatusChange).toHaveBeenCalledWith(
            IngestionStatusEnum.FAILED,
          );

          resolve();
        });
      });
    });

    it('should respect custom timing values', async () => {
      const delays: number[] = [];

      const delaySpy = jest.fn((fn: () => void, delay: number) => {
        delays.push(delay);
        fn();
      });

      ingestionService.simulateProcessing('ghi789', MOCK_LOGGER_SERVICE, {
        delayFn: delaySpy,
        randomFn: () => 0.8,
        processingDelayMs: 1000,
        completionDelayMs: 5000,
      });

      // Wait for async chain
      await new Promise((res) => setImmediate(res));

      expect(delays).toEqual([1000, 5000]); // Validate timing values were used
    });
  });

  describe('getIngestionDetails', () => {
    it('should return ingestion details successfully', async () => {
      const user = await TestFixtureHelper.insertUser(TEST_USER);
      const document = await TestFixtureHelper.insertDocument(
        TEST_DOCUMENT(user.id),
      );

      const ingestion = await TestFixtureHelper.insertIngestion({
        documentId: document.id,
        userId: user.id,
        status: IngestionStatusEnum.QUEUED,
      });

      const result = await ingestionService.getIngestionDetails(
        ingestion.id,
        MOCK_LOGGER_SERVICE,
      );

      expect(result).toMatchObject({
        id: ingestion.id,
        documentId: ingestion.documentId,
        status: ingestion.status,
        logs: ingestion.logs,
        userId: ingestion.userId,
      });
    });

    it('should throw NotFoundException if ingestion is not found', async () => {
      await expect(
        ingestionService.getIngestionDetails(
          'non-existing-id',
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if ingestion is soft-deleted', async () => {
      const user = await TestFixtureHelper.insertUser(TEST_USER);
      const document = await TestFixtureHelper.insertDocument(
        TEST_DOCUMENT(user.id),
      );

      const ingestion = await TestFixtureHelper.insertIngestion({
        documentId: document.id,
        userId: user.id,
        status: IngestionStatusEnum.QUEUED,
      });

      // Soft-delete the ingestion
      await AppDataSource.getRepository(IngestionEntity).softDelete(
        ingestion.id,
      );

      await expect(
        ingestionService.getIngestionDetails(ingestion.id, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteIngestionById', () => {
    it('should soft delete ingestion successfully', async () => {
      const user = await TestFixtureHelper.insertUser(TEST_USER);
      const document = await TestFixtureHelper.insertDocument(
        TEST_DOCUMENT(user.id),
      );

      const ingestion = await TestFixtureHelper.insertIngestion({
        documentId: document.id,
        userId: user.id,
      });

      const result = await ingestionService.deleteIngestionById(
        ingestion.id,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.message).toEqual(
        `Ingestion with id ${ingestion.id} has been deleted successfully`,
      );

      // Ensure it's soft deleted
      const deleted = await AppDataSource.getRepository(
        IngestionEntity,
      ).findOne({
        where: { id: ingestion.id },
        withDeleted: true,
      });

      expect(deleted).toBeDefined();
      expect(deleted?.deletedAt).toBeTruthy();
    });

    it('should throw NotFoundException if ingestion not found or already deleted', async () => {
      const fakeId = randomUUID();

      await expect(
        ingestionService.deleteIngestionById(fakeId, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      const fakeId = randomUUID();

      const mockRepo = AppDataSource.getRepository(IngestionEntity);
      const softDeleteSpy = jest
        .spyOn(mockRepo, 'softDelete')
        .mockRejectedValueOnce(new Error('DB failed'));

      await expect(
        ingestionService.deleteIngestionById(fakeId, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(InternalServerErrorException);

      softDeleteSpy.mockRestore();
    });
  });

  describe('getAllIngestions', () => {
    let user: any;
    let document: any;
    let temp: any;

    beforeEach(async () => {
      user = await TestFixtureHelper.insertUser(TEST_USER);
      document = await TestFixtureHelper.insertDocument(TEST_DOCUMENT(user.id));

      await TestFixtureHelper.insertIngestion({
        userId: user.id,
        documentId: document.id,
        status: IngestionStatusEnum.QUEUED,
        logs: 'Initial log',
        errorMessage: '',
      });

      await TestFixtureHelper.insertIngestion({
        userId: user.id,
        documentId: document.id,
        status: IngestionStatusEnum.FAILED,
        logs: '',
        errorMessage: 'Something failed',
      });

      await TestFixtureHelper.insertIngestion({
        userId: user.id,
        documentId: document.id,
        status: IngestionStatusEnum.COMPLETED,
        logs: '',
        errorMessage: 'Not good',
        deletedAt: new Date(),
      });

      temp = await ingestionRepo.findOne({ where: { userId: user.id } });
    });

    it('should fetch ingestions with default pagination and no filters', async () => {
      const result = await ingestionService.getAllIngestions(
        {
          page: 1,
          limit: 10,
        } as any,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.totalCount).toBeGreaterThanOrEqual(1);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should filter ingestions by userId and status', async () => {
      const result = await ingestionService.getAllIngestions(
        {
          page: 1,
          limit: 10,
          userId: user.id,
          status: [IngestionStatusEnum.FAILED],
        } as any,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(IngestionStatusEnum.FAILED);
    });

    it('should get ingestion by id and document id', async () => {
      const result = await ingestionService.getAllIngestions(
        {
          page: 1,
          limit: 10,
          id: temp.id,
          documentId: temp.documentId,
          hasLogs: true,
        } as any,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.data).toHaveLength(1);

      expect(result.data[0].status).toBe(IngestionStatusEnum.QUEUED);
    });

    it('should get ingestion non deleted and non logs based', async () => {
      const result = await ingestionService.getAllIngestions(
        {
          page: 1,
          limit: 10,
          isDeleted: false,
          hasLogs: false,
        } as any,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.data).toHaveLength(2);
    });

    it('should return soft-deleted ingestions if isDeleted is true', async () => {
      const result = await ingestionService.getAllIngestions(
        {
          select: ['deletedAt'],
          page: 1,
          limit: 10,
          isDeleted: true,
        } as any,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.data.find((d) => d.deletedAt)).toBeDefined();
    });

    it('should return soft-deleted ingestions if hasError is true', async () => {
      const result = await ingestionService.getAllIngestions(
        {
          select: ['deletedAt'],
          page: 1,
          limit: 10,
          hasError: true,
        } as any,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.data.find((d) => d.deletedAt)).toBeDefined();
    });

    it('should not return soft-deleted ingestions if hasError is false', async () => {
      const result = await ingestionService.getAllIngestions(
        {
          select: ['deletedAt'],
          page: 1,
          limit: 10,
          hasError: false,
        } as any,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.data.find((d) => d.deletedAt)).toBeUndefined();
    });

    it('should return empty array if no ingestions match filter', async () => {
      const result = await ingestionService.getAllIngestions(
        {
          page: 1,
          limit: 10,
          userId: randomUUID(),
        } as any,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.data).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should throw InternalServerErrorException on DB error', async () => {
      const mockRepo = AppDataSource.getRepository(IngestionEntity);
      const spy = jest
        .spyOn(mockRepo, 'createQueryBuilder')
        .mockImplementation(() => {
          throw new Error('DB Failure');
        });

      await expect(
        ingestionService.getAllIngestions(
          {
            page: 1,
            limit: 10,
          } as any,
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow(InternalServerErrorException);

      spy.mockRestore();
    });
  });
});
