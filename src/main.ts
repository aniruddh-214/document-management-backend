import 'dotenv/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { GlobalAppLogger } from './common/utils/logging/loggerFactory';
import ENV from './config/env.config';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  const logger = GlobalAppLogger();

  await app.listen(ENV.PORT, () => {
    logger.logInfo({
      message: `Application started successfully at http://localhost:${ENV.PORT}`,
      action: 'info',
      source: 'bootstrap',
    });
  });
};

void bootstrap();
