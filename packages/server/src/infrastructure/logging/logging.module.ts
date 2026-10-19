import {
  Global,
  Logger,
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { RequestLoggingMiddleware } from './request-logging.middleware.js';

@Global()
@Module({
  providers: [Logger],
  exports: [Logger],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('{*path}');
  }
}
