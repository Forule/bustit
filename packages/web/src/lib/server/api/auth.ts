import 'server-only';

import {
  type LoginRequest,
  type LoginResponse,
  loginResponseSchema,
} from '@bustit/shared';
import { HttpStatusCode, isAxiosError } from 'axios';
import { api } from './client';

/** Returns `null` for wrong credentials; anything else is unexpected. */
export async function login(body: LoginRequest): Promise<LoginResponse | null> {
  try {
    const { data } = await api.post<unknown>('/auth/login', body);

    return loginResponseSchema.parse(data);
  } catch (error) {
    if (
      isAxiosError(error) &&
      error.response?.status === HttpStatusCode.Unauthorized
    ) {
      return null;
    }

    throw error;
  }
}
