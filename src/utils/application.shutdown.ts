import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { GlobalAppLogger } from '../common/utils/logging/loggerFactory';
import LoggerService from '../common/utils/logging/loggerService';

@Injectable()
export class AppShutdownService implements OnApplicationShutdown {
  private readonly logger: LoggerService = GlobalAppLogger();

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationShutdown(signal: string): Promise<void> {
    this.logger.logInfo({
      action: 'info',
      source: 'AppShutdownService#onApplicationShutdown',
      message: `Shutdown signal received: ${signal}`,
    });

    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
      this.logger.logInfo({
        action: 'info',
        source: 'AppShutdownService#onApplicationShutdown',
        message: 'Database connection closed.',
      });
    }
  }
}
