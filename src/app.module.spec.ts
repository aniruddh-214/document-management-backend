// app.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppModule } from './app.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AppShutdownService } from './utils/application.shutdown';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';

describe('AppModule', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should compile the AppModule', () => {
    expect(app).toBeDefined();
  });

  it('should resolve AppService', () => {
    const appService = app.get<AppService>(AppService);
    expect(appService).toBeInstanceOf(AppService);
  });

  it('should resolve AppShutdownService', () => {
    const shutdownService = app.get<AppShutdownService>(AppShutdownService);
    expect(shutdownService).toBeInstanceOf(AppShutdownService);
  });

  it('should resolve AppController', () => {
    const controller = app.get<AppController>(AppController);
    expect(controller).toBeInstanceOf(AppController);
  });
});

describe('AppModule Middleware Configuration', () => {
  it('should apply LoggerMiddleware to all routes except favicon.ico GET', () => {
    const forRoutesMock = jest.fn();
    const excludeMock = jest.fn(() => ({ forRoutes: forRoutesMock }));
    const applyMock = jest.fn(() => ({ exclude: excludeMock }));

    const consumerMock = {
      apply: applyMock,
    };

    const module = new AppModule();
    module.configure(consumerMock as unknown as MiddlewareConsumer);

    expect(applyMock).toHaveBeenCalledWith(LoggerMiddleware);
    expect(excludeMock).toHaveBeenCalledWith({
      path: 'favicon.ico',
      method: RequestMethod.GET,
    });
    expect(forRoutesMock).toHaveBeenCalledWith('*');
  });
});
