'use client';

import {
  Link as RACLink,
  type LinkProps as RACLinkProps,
} from 'react-aria-components/Link';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { tv } from 'tailwind-variants';
import { focusRing } from './utils';

const link = tv({
  extend: focusRing,
  base: 'cursor-pointer rounded-xs font-medium text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary [-webkit-tap-highlight-color:transparent]',
  variants: {
    isDisabled: {
      true: 'cursor-default text-muted-foreground no-underline forced-colors:text-[GrayText]',
    },
  },
});

export function Link(props: RACLinkProps) {
  return (
    <RACLink
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        link({ ...renderProps, className }),
      )}
    />
  );
}
