import type { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { AuthTokenService } from '../../src/auth/auth-token.service.js';
import type { Env } from '../../src/infrastructure/config/index.js';

const SECRET = 'a'.repeat(32);
const USER = { id: '01a15552-772a-72cd-bf4e-a335c827c943', tokenVersion: 3 };

function createService(): AuthTokenService {
  const config = {
    get: (key: keyof Env) => (key === 'JWT_SECRET' ? SECRET : undefined),
  } as unknown as ConfigService<Env, true>;

  return new AuthTokenService(config);
}

function sign(payload: Record<string, unknown>, secret = SECRET) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));
}

describe('AuthTokenService', () => {
  it('reads back the user and token version of its own tokens', async () => {
    const service = createService();

    const { token } = await service.createToken(USER);

    await expect(service.verifyToken(token)).resolves.toEqual({
      userId: USER.id,
      tokenVersion: 3,
    });
  });

  it('rejects a token signed with another secret', async () => {
    const token = await sign({ sub: USER.id, tv: 0 }, 'b'.repeat(32));

    await expect(createService().verifyToken(token)).resolves.toBeNull();
  });

  it('rejects a changed token', async () => {
    const service = createService();
    const [header, , signature] = (await service.createToken(USER)).token.split(
      '.',
    );
    const forged = Buffer.from(
      JSON.stringify({ sub: 'someone-else', tv: 3 }),
    ).toString('base64url');

    await expect(
      service.verifyToken(`${header}.${forged}.${signature}`),
    ).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await new SignJWT({ sub: USER.id, tv: 0 })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SECRET));

    await expect(createService().verifyToken(token)).resolves.toBeNull();
  });

  it.each([
    ['without a subject', { tv: 0 }],
    ['without a token version', { sub: USER.id }],
    ['with a token version of the wrong type', { sub: USER.id, tv: '0' }],
  ])('rejects a token %s', async (_, payload) => {
    const token = await sign(payload);

    await expect(createService().verifyToken(token)).resolves.toBeNull();
  });

  it('rejects garbage', async () => {
    await expect(
      createService().verifyToken('not-a-token'),
    ).resolves.toBeNull();
  });

  it('expires after 30 days', async () => {
    const before = Date.now();
    const { expiresAt } = await createService().createToken(USER);
    const days = (expiresAt.getTime() - before) / (24 * 60 * 60 * 1000);

    expect(days).toBeCloseTo(30, 3);
  });
});
