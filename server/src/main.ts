/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { envVars } from './config/env';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { prisma } from './libs/prisma';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Start');

  app.use(cookieParser());

  app.useGlobalInterceptors(new TransformInterceptor());
  await prisma.$connect();
  logger.log('Database Connected');
  logger.log(`Sever is runing on port http://localhost:${envVars.PORT}`);
  await app.listen(envVars.PORT);
}
bootstrap();
