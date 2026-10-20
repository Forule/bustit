import type { Preview } from '@storybook/nextjs-vite';
import { NextIntlClientProvider } from 'next-intl';
import defaultMessages from '../messages/en.json';

import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={defaultMessages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;
