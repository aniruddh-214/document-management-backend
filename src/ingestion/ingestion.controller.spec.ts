import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { Request } from 'express';
import { GetAllIngestionsRequestQueryType } from './schemas/request/ingestion.schema';
import { DatabaseSortingOrder } from '../common/enums/dbOrderSort.enum';

describe('IngestionController', () => {
  let controller: IngestionController;
  let service: Partial<IngestionService>;

  beforeEach(() => {
    service = {
      triggerIngestion: jest.fn(),
      getIngestionDetails: jest.fn(),
      deleteIngestionById: jest.fn(),
      getAllIngestions: jest.fn(),
    };

    controller = new IngestionController(service as IngestionService);
  });

  describe('triggerIngestion', () => {
    it('should call triggerIngestion and return result', async () => {
      const param = { id: 'ingestion123' };
      const req = {
        user: { sub: 'userId' },
        logger: {},
      } as unknown as Request;

      const expected = { message: 'Ingestion triggered' };
      (service.triggerIngestion as jest.Mock).mockResolvedValue(expected);

      const result = await controller.triggerIngestion(req, param);

      expect(service.triggerIngestion).toHaveBeenCalledWith(
        req.logger,
        req.user,
        param.id,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getIngestionDetails', () => {
    it('should return ingestion details by ID', async () => {
      const param = { id: 'ingestion123' };
      const req = { logger: {} } as unknown as Request;
      const expected = { id: 'ingestion123', status: 'pending' };

      (service.getIngestionDetails as jest.Mock).mockResolvedValue(expected);

      const result = await controller.getIngestionDetails(req, param);

      expect(service.getIngestionDetails).toHaveBeenCalledWith(
        param.id,
        req.logger,
      );
      expect(result).toBe(expected);
    });
  });

  describe('deleteIngestion', () => {
    it('should delete ingestion and return response', async () => {
      const param = { id: 'ingestion123' };
      const req = { logger: {} } as unknown as Request;
      const expected = { message: 'Ingestion deleted successfully' };

      (service.deleteIngestionById as jest.Mock).mockResolvedValue(expected);

      const result = await controller.deleteIngestion(req, param);

      expect(service.deleteIngestionById).toHaveBeenCalledWith(
        param.id,
        req.logger,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getAllIngestions', () => {
    it('should return paginated list of ingestions', async () => {
      const query: GetAllIngestionsRequestQueryType = {
        page: 1,
        limit: 10,
        status: [],
        sortOrder: DatabaseSortingOrder.ASC,
        select: [],
      };
      const req = { logger: {} } as unknown as Request;

      const expected = {
        data: [{ id: 'ing1' }, { id: 'ing2' }],
        totalCount: 2,
        totalPages: 1,
      };

      (service.getAllIngestions as jest.Mock).mockResolvedValue(expected);

      const result = await controller.getAllIngestions(req, query);

      expect(service.getAllIngestions).toHaveBeenCalledWith(
        expect.anything(),
        req.logger,
      );
      expect(result).toBe(expected);
    });
  });
});
