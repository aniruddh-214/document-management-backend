import { determineIngestionOutcome } from './ingestion.helper';
import IngestionStatusEnum from '../enums/ingestion.enum';

describe('determineIngestionOutcome', () => {
  it('should return COMPLETED when random > 0.2', () => {
    const mockRandom = () => 0.9;

    const result = determineIngestionOutcome(mockRandom);

    expect(result.status).toBe(IngestionStatusEnum.COMPLETED);
    expect(result.logs).toContain('Completed successfully at');
    expect(result.errorMessage).toBeUndefined();
  });

  it('should return FAILED when random <= 0.2', () => {
    const mockRandom = () => 0.1;

    const result = determineIngestionOutcome(mockRandom);

    expect(result.status).toBe(IngestionStatusEnum.FAILED);
    expect(result.logs).toContain('Failed at');
    expect(result.errorMessage).toBe('Simulated ingestion failure');
  });

  it('should use Math.random by default', () => {
    const result = determineIngestionOutcome();

    expect([
      IngestionStatusEnum.COMPLETED,
      IngestionStatusEnum.FAILED,
    ]).toContain(result.status);
    expect(result.logs).toMatch(/(Completed successfully at|Failed at)/);
  });
});
