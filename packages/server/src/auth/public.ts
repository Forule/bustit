import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Opens a route to requests without a login; all others require one. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
