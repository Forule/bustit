'use client';

import {
  type FieldErrorProps,
  FieldError as RACFieldError,
} from 'react-aria-components/FieldError';
import {
  type InputProps,
  Input as RACInput,
} from 'react-aria-components/Input';
import {
  type LabelProps,
  Label as RACLabel,
} from 'react-aria-components/Label';
import { Text, type TextProps } from 'react-aria-components/Text';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';
import { composeTailwindRenderProps } from './utils';

export function Label(props: LabelProps) {
  return (
    <RACLabel
      {...props}
      className={twMerge(
        'w-fit cursor-default text-sm font-medium text-foreground',
        props.className,
      )}
    />
  );
}

export function Description(props: TextProps) {
  return (
    <Text
      {...props}
      slot="description"
      className={twMerge('text-sm text-muted-foreground', props.className)}
    />
  );
}

export function FieldError(props: FieldErrorProps) {
  return (
    <RACFieldError
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'text-sm text-destructive forced-colors:text-[Mark]',
      )}
    />
  );
}

export const fieldBorderStyles = tv({
  base: 'transition',
  variants: {
    isFocusWithin: {
      false:
        'border-input hover:border-ring forced-colors:border-[ButtonBorder]',
      true: 'border-foreground forced-colors:border-[Highlight]',
    },
    isInvalid: {
      // Hovering would otherwise turn an invalid field's border neutral.
      true: 'border-destructive hover:border-destructive forced-colors:border-[Mark]',
    },
    isDisabled: {
      true: 'border-muted forced-colors:border-[GrayText]',
    },
  },
});

export function Input(props: InputProps) {
  return (
    <RACInput
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'min-h-9 min-w-0 flex-1 border-0 bg-transparent px-3 py-0 text-sm text-foreground outline-0 [-webkit-tap-highlight-color:transparent] placeholder:text-muted-foreground disabled:text-muted-foreground',
      )}
    />
  );
}
