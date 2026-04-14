/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';

import { envVars } from './config/env';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Start');
  logger.log(`Sever is runing on port http://localhost:${envVars.PORT}`);
  await app.listen(envVars.PORT);
}
bootstrap();
