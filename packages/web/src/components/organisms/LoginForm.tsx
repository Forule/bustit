'use client';

import { useFormik } from 'formik';
import { ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/atoms/TextField';
import { textFieldProps, zodValidate } from '@/lib/formik';

/*
 * Login only checks that something was entered. Whether it is valid is up to
 * the server, which answers every wrong login alike.
 */
const loginFormSchema = z.object({
  username: z.string().trim().min(1, 'Bitte gib deinen Benutzernamen ein.'),
  password: z.string().min(1, 'Bitte gib dein Passwort ein.'),
});

type LoginFormValues = z.input<typeof loginFormSchema>;

export function LoginForm() {
  const formik = useFormik<LoginFormValues>({
    initialValues: { username: '', password: '' },
    validate: zodValidate(loginFormSchema),
    // Sent to the API in a later step.
    onSubmit: () => undefined,
  });

  return (
    <Form onSubmit={formik.handleSubmit} validationBehavior="aria">
      <TextField
        {...textFieldProps(formik, 'username')}
        label="Benutzername"
        autoComplete="username"
        isRequired
      />
      <TextField
        {...textFieldProps(formik, 'password')}
        label="Passwort"
        type="password"
        autoComplete="current-password"
        isRequired
      />
      <Button
        type="submit"
        className="mt-2 h-11 w-full font-semibold"
        isPending={formik.isSubmitting}
      >
        Anmelden
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </Form>
  );
}
