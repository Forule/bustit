import { createdInviteSchema, inviteSchema } from '@bustit/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RegistrationService } from '../../src/auth/index.js';
import {
  TEST_PASSWORD,
  authorizationFor,
  createPlayer,
  getAdmin,
  uniqueUsername,
} from '../utils/factories.js';
import { type TestApp, createTestApp } from '../utils/test-app.js';

describe('/api/boc/invites (e2e)', () => {
  let app: TestApp;
  let adminId: string;
  let asAdmin: string;

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await getAdmin(app);
    adminId = admin.id;
    asAdmin = await authorizationFor(app, admin);
  });

  afterAll(async () => {
    await app.close();
  });

  function createInvite(authorization = asAdmin) {
    return request(app.http)
      .post('/api/boc/invites')
      .set('Authorization', authorization);
  }

  function listInvites() {
    return request(app.http)
      .get('/api/boc/invites')
      .set('Authorization', asAdmin);
  }

  function revoke(id: string) {
    return request(app.http)
      .post(`/api/boc/invites/${id}/revoke`)
      .set('Authorization', asAdmin);
  }

  async function statusOf(id: string): Promise<string | undefined> {
    const response = await listInvites().expect(200);
    return inviteSchema
      .array()
      .parse(response.body)
      .find((invite) => invite.id === id)?.status;
  }

  describe('access', () => {
    it('requires a login', async () => {
      await request(app.http).get('/api/boc/invites').expect(401);
      await request(app.http).post('/api/boc/invites').expect(401);
    });

    it('is forbidden for players', async () => {
      const asPlayer = await authorizationFor(app, await createPlayer(app));

      await request(app.http)
        .get('/api/boc/invites')
        .set('Authorization', asPlayer)
        .expect(403);
      await createInvite(asPlayer).expect(403);
    });
  });

  describe('POST /api/boc/invites', () => {
    it('creates an open invite and returns its code once', async () => {
      const response = await createInvite().expect(201);
      const { invite, code } = createdInviteSchema.parse(response.body);

      expect(code).toMatch(/^BJ-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
      expect(invite).toMatchObject({
        status: 'open',
        createdBy: adminId,
        usedAt: null,
        usedBy: null,
        revokedAt: null,
      });
    });

    it('creates an invite a new user can register with', async () => {
      const { code } = createdInviteSchema.parse(
        (await createInvite().expect(201)).body,
      );

      await expect(
        app.get(RegistrationService).register({
          inviteCode: code,
          username: uniqueUsername(),
          password: TEST_PASSWORD,
        }),
      ).resolves.toMatchObject({ role: 'player' });
    });
  });

  describe('GET /api/boc/invites', () => {
    it('lists invites newest first without codes or hashes', async () => {
      const first = createdInviteSchema.parse(
        (await createInvite().expect(201)).body,
      );
      const second = createdInviteSchema.parse(
        (await createInvite().expect(201)).body,
      );

      const response = await listInvites().expect(200);
      const ids = (response.body as { id: string }[]).map(({ id }) => id);

      expect(ids.indexOf(second.invite.id)).toBeLessThan(
        ids.indexOf(first.invite.id),
      );
      expect(JSON.stringify(response.body)).not.toContain(first.code);
      expect(JSON.stringify(response.body)).not.toMatch(/codeHash|code_hash/);
      expect(() => inviteSchema.array().parse(response.body)).not.toThrow();
    });
  });

  describe('POST /api/boc/invites/:id/revoke', () => {
    it('revokes an open invite', async () => {
      const { invite } = createdInviteSchema.parse(
        (await createInvite().expect(201)).body,
      );

      await revoke(invite.id).expect(204);

      expect(await statusOf(invite.id)).toBe('revoked');
    });

    it('accepts revoking again', async () => {
      const { invite } = createdInviteSchema.parse(
        (await createInvite().expect(201)).body,
      );
      await revoke(invite.id).expect(204);

      await revoke(invite.id).expect(204);
    });

    it('rejects a used invite', async () => {
      const { invite, code } = createdInviteSchema.parse(
        (await createInvite().expect(201)).body,
      );
      await app.get(RegistrationService).register({
        inviteCode: code,
        username: uniqueUsername(),
        password: TEST_PASSWORD,
      });

      await revoke(invite.id).expect(409);
      expect(await statusOf(invite.id)).toBe('used');
    });

    it('answers an unknown invite with 404', async () => {
      await revoke('00000000-0000-7000-8000-000000000000').expect(404);
    });

    it('rejects an id that is no uuid', async () => {
      await revoke('not-a-uuid').expect(400);
    });
  });
});
