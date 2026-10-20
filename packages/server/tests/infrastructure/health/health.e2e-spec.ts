import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { type TestApp, createTestApp } from '../../utils/test-app.js';

describe('Health (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health answers without a login', () => {
    return request(app.http)
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
