'use client';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_PATTERN,
} from '@bustit/shared';
import { useFormik } from 'formik';
import { ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/atoms/TextField';
import { textFieldProps, zodValidate } from '@/lib/formik';

const USERNAME_RULE = '3 bis 20 Zeichen: Buchstaben, Ziffern und Unterstriche.';
const PASSWORD_RULE = `Mindestens ${PASSWORD_MIN_LENGTH} Zeichen.`;

/*
 * Applies the server's rules from @bustit/shared with messages for people.
 * The invite code is only checked for presence; whether it is valid only the
 * server can tell.
 */
const registerFormSchema = z
  .object({
    inviteCode: z
      .string()
      .trim()
      .min(1, 'Bitte gib deinen Einladungscode ein.'),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(USERNAME_PATTERN, USERNAME_RULE),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, PASSWORD_RULE)
      .max(PASSWORD_MAX_LENGTH, `Höchstens ${PASSWORD_MAX_LENGTH} Zeichen.`),
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Die Passwörter stimmen nicht überein.',
  });

type RegisterFormValues = z.input<typeof registerFormSchema>;

export function RegisterForm() {
  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      inviteCode: '',
      username: '',
      password: '',
      passwordConfirmation: '',
    },
    validate: zodValidate(registerFormSchema),
    // Sent to the API in a later step.
    onSubmit: () => undefined,
  });

  return (
    <Form onSubmit={formik.handleSubmit} validationBehavior="aria">
      <TextField
        {...textFieldProps(formik, 'inviteCode')}
        label="Einladungscode"
        placeholder="BJ-XXXX-XXXX-XXXX"
        autoComplete="off"
        isRequired
      />
      <TextField
        {...textFieldProps(formik, 'username')}
        label="Benutzername"
        description={USERNAME_RULE}
        autoComplete="username"
        isRequired
      />
      <TextField
        {...textFieldProps(formik, 'password')}
        label="Passwort"
        description={PASSWORD_RULE}
        type="password"
        autoComplete="new-password"
        isRequired
      />
      <TextField
        {...textFieldProps(formik, 'passwordConfirmation')}
        label="Passwort wiederholen"
        type="password"
        autoComplete="new-password"
        isRequired
      />
      <Button
        type="submit"
        className="mt-2 h-11 w-full font-semibold"
        isPending={formik.isSubmitting}
      >
        Konto erstellen
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </Form>
  );
}
