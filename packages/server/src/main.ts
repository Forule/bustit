import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import type { Env } from './infrastructure/config/index.js';
import { createLogger } from './infrastructure/logging/index.js';

async function bootstrap() {
  /*
   * Log level and directory are part of the validated config, which only
   * exists once the app is created. Buffering holds back the startup logs
   * until the actual logger is attached instead of printing them twice.
   */
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get<ConfigService<Env, true>>(ConfigService);

  app.useLogger(
    createLogger({
      level: configService.get('LOG_LEVEL', { infer: true }),
      dir: configService.get('LOG_DIR', { infer: true }),
    }),
  );

  const port = configService.get('PORT', { infer: true });

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  await app.listen(port);

  new Logger('Bootstrap').log(`Listening on port ${port}`);
}

await bootstrap();
