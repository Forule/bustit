import type { HealthResponse } from '@bustit/shared';

export function GET() {
  return Response.json({ status: 'ok' } satisfies HealthResponse);
}
