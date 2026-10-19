import { z } from 'zod';

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
