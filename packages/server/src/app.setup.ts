import type { INestApplication } from '@nestjs/common';

/**
 * Setup shared by the server and the e2e tests, which create the app without
 * going through `main.ts`.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
}
