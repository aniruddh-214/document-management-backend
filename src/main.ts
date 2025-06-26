import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/allExceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.intercepter';
import { GlobalAppLogger } from './common/utils/logging/loggerFactory';
import ENV from './config/env.config';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  const logger = GlobalAppLogger();

  app.enableCors({
    origin: '*', // have to keep frontend  e.g. ['https://domain.com']
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(helmet());

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(logger));

  await app.listen(ENV.PORT, () => {
    logger.logInfo({
      message: `Application started successfully at http://localhost:${ENV.PORT}`,
      action: 'info',
      source: 'bootstrap',
    });
  });
};

void bootstrap();
