/** Reads the token of an `Authorization: Bearer <token>` header. */
export function bearerTokenOf(header: string | undefined): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}
