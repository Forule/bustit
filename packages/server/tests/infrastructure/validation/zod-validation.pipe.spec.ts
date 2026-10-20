import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../src/infrastructure/validation/index.js';

const pipe = new ZodValidationPipe(
  z.object({ name: z.string().trim(), age: z.number().int() }),
);

describe('ZodValidationPipe', () => {
  it('returns the parsed value', () => {
    expect(pipe.transform({ name: ' Max ', age: 30 })).toEqual({
      name: 'Max',
      age: 30,
    });
  });

  it('rejects an invalid value with the issues', () => {
    let error: unknown;

    try {
      pipe.transform({ name: 'Max', age: 'old' });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      message: 'Invalid request',
      issues: [{ path: 'age' }],
    });
  });
});
