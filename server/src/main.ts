/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";

import { envVars } from "./config/env";
import { AppModule } from "./app.module";
import { TransformInterceptor } from "./core/interceptors/transform.interceptor";
import { prisma } from "./libs/prisma";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Start");

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  await prisma.$connect();
  logger.log("Database Connected");
  logger.log(`Sever is runing on port http://localhost:${envVars.PORT}`);
  await app.listen(envVars.PORT);
}
bootstrap();
