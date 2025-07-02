import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';
import { SwaggerDoc } from './common/decorators/swagger.decorator';
import { APP_CONTROLLER_SCHEMA } from './schemas/appDecorator.schema';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SwaggerDoc(APP_CONTROLLER_SCHEMA.hello)
  getHello(): string {
    return this.appService.getHello();
  }
}
