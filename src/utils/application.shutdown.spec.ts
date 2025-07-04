import { DataSource } from 'typeorm';
import { AppShutdownService } from './application.shutdown';

describe('AppShutdownService', () => {
  let service: AppShutdownService;
  let dataSource: Partial<DataSource>;
  let logInfoMock: jest.Mock;

  beforeEach(() => {
    logInfoMock = jest.fn();

    // Mock GlobalAppLogger to return an object with logInfo method
    jest.mock('../common/utils/logging/loggerFactory', () => ({
      GlobalAppLogger: () => ({
        logInfo: logInfoMock,
      }),
    }));

    dataSource = {
      isInitialized: false,
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    service = new AppShutdownService(dataSource as DataSource);
    // Replace logger with mocked logger
    (service as any).logger = { logInfo: logInfoMock };
  });

  it('should log shutdown signal', async () => {
    await service.onApplicationShutdown('SIGINT');

    expect(logInfoMock).toHaveBeenCalledWith({
      action: 'info',
      source: 'AppShutdownService#onApplicationShutdown',
      message: 'Shutdown signal received: SIGINT',
    });
  });

  it('should not destroy dataSource if not initialized', async () => {
    (dataSource as any).isInitialized = false;

    await service.onApplicationShutdown('SIGTERM');

    expect(dataSource.destroy).not.toHaveBeenCalled();
    expect(logInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Shutdown signal received: SIGTERM',
      }),
    );
  });

  it('should destroy dataSource and log after closing connection if initialized', async () => {
    (dataSource as any).isInitialized = true;

    await service.onApplicationShutdown('SIGTERM');

    expect(dataSource.destroy).toHaveBeenCalled();
    expect(logInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Shutdown signal received: SIGTERM',
      }),
    );
    expect(logInfoMock).toHaveBeenCalledWith({
      action: 'info',
      source: 'AppShutdownService#onApplicationShutdown',
      message: 'Database connection closed.',
    });
  });
});
