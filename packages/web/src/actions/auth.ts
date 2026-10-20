'use server';

import type { LoginRequest } from '@bustit/shared';
import { AuthError } from 'next-auth';
import { signIn } from '@/lib/server/auth';

export type LoginResult = { success: true } | { error: 'invalidCredentials' };

/**
 * Starts a session. The input is checked by `authorize`, which every sign-in
 * goes through. Failures other than wrong credentials are thrown, so they get
 * logged instead of being passed off as a wrong password.
 */
export async function loginAction(data: LoginRequest): Promise<LoginResult> {
  try {
    await signIn('credentials', { ...data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError && error.type === 'CredentialsSignin') {
      return { error: 'invalidCredentials' };
    }

    throw error;
  }

  return { success: true };
}
