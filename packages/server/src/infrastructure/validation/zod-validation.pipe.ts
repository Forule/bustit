import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';

/**
 * Validates and normalizes a request part with a schema from
 * `@bustit/shared`, e.g. `@Body(new ZodValidationPipe(loginRequestSchema))`.
 */
export class ZodValidationPipe<
  TSchema extends z.ZodType,
> implements PipeTransform<unknown, z.output<TSchema>> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Invalid request',
        issues: result.error.issues.map(({ path, message }) => ({
          path: path.join('.'),
          message,
        })),
      });
    }

    return result.data;
  }
}
