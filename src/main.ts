/// <reference path="./types/globals.d.ts" />

import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/allExceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalAppLogger } from './common/utils/logging/loggerFactory';
import ENV from './config/env.config';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  const logger = GlobalAppLogger();
  app.use('/favicon.ico', (req, res) => res.status(204).end());
  app.enableShutdownHooks();

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

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Document Management Backend System')
    .setDescription('API docs for document management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Swagger UI at /docs

  await app.listen(ENV.PORT, () => {
    logger.logInfo({
      message: `Application started successfully at http://localhost:${ENV.PORT}`,
      action: 'info',
      source: 'bootstrap',
    });
  });
};

void bootstrap();
