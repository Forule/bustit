import { z } from 'zod';
import { userProfileSchema } from './users.js';

/**
 * Usernames are compared case-insensitively, so they are stored in lower case.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9_]{3,20}$/,
    'Use 3 to 20 characters: letters, digits and underscores',
  );

/*
 * Length is the only rule, as complexity rules don't make passwords safer.
 * The upper bound keeps hashing a request cheap.
 */
export const passwordSchema = z.string().min(10).max(256);

/**
 * Login only normalizes the username instead of validating it, so a wrong one
 * fails like any other wrong credentials.
 */
export const loginRequestSchema = z.object({
  username: z.string().trim().toLowerCase().max(256),
  password: z.string().max(256),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  /** Sent as `Authorization: Bearer <accessToken>` with every request. */
  accessToken: z.string(),
  /** ISO 8601; the token has to be replaced by logging in again by then. */
  expiresAt: z.iso.datetime(),
  user: userProfileSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
