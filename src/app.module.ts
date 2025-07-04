import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { typeOrmConfig } from './config/typeorm.config';
import { DocumentModule } from './document/document.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { UserModule } from './user/user.module';
import { AppShutdownService } from './utils/application.shutdown';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UserModule,
    DocumentModule,
    IngestionModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppShutdownService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(LoggerMiddleware)
      .exclude({ path: 'favicon.ico', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
