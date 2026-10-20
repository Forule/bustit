import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TextField } from './TextField';

const meta = {
  title: 'Atoms/TextField',
  component: TextField,
  parameters: {
    layout: 'centered',
  },
  args: {
    label: 'Username',
    placeholder: 'jane',
    isDisabled: false,
    isInvalid: false,
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    description: 'Between 3 and 32 characters.',
  },
};

export const Invalid: Story = {
  args: {
    description: 'Between 3 and 32 characters.',
    isInvalid: true,
    errorMessage: 'The username is too short.',
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    placeholder: undefined,
    type: 'password',
  },
};
