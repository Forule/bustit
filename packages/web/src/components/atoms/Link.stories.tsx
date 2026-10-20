import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Link } from './Link';

const meta = {
  title: 'Atoms/Link',
  component: Link,
  parameters: {
    layout: 'centered',
  },
  args: {
    href: '#',
    isDisabled: false,
    children: 'Link',
  },
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};
