'use client';

import { useFormik } from 'formik';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/atoms/TextField';
import { textFieldProps, zodValidate } from '@/lib/formik';

interface LoginFormValues {
  username: string;
  password: string;
}

export function LoginForm() {
  const t = useTranslations('components.loginForm');

  /*
   * Login only checks that something was entered. Whether it is valid is up
   * to the server, which answers every wrong login alike.
   */
  const schema = useMemo(
    () =>
      z.object({
        username: z.string().trim().min(1, t('errors.usernameRequired')),
        password: z.string().min(1, t('errors.passwordRequired')),
      }),
    [t],
  );

  const formik = useFormik<LoginFormValues>({
    initialValues: { username: '', password: '' },
    validate: zodValidate(schema),
    // Sent to the API in a later step.
    onSubmit: () => undefined,
  });

  return (
    <Form onSubmit={formik.handleSubmit} validationBehavior="aria">
      <TextField
        {...textFieldProps(formik, 'username')}
        label={t('username')}
        autoComplete="username"
        isRequired
      />
      <TextField
        {...textFieldProps(formik, 'password')}
        label={t('password')}
        type="password"
        autoComplete="current-password"
        isRequired
      />
      <Button
        type="submit"
        className="mt-2 h-11 w-full font-semibold"
        isPending={formik.isSubmitting}
      >
        {t('submit')}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </Form>
  );
}
