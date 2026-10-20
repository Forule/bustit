import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TextField as RACTextField } from 'react-aria-components/TextField';
import { Description, FieldError, Input, Label } from './Field';

// The parts read their state from a field, so each story wraps them in an
// unstyled React Aria text field.
const meta = {
  title: 'Atoms/Field',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Placeholder',
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <RACTextField className="flex flex-col gap-1">
      <Label>Label</Label>
      <Input {...args} />
      <Description>Description</Description>
    </RACTextField>
  ),
};

export const Invalid: Story = {
  render: (args) => (
    <RACTextField isInvalid className="flex flex-col gap-1">
      <Label>Label</Label>
      <Input {...args} />
      <FieldError>Error message</FieldError>
    </RACTextField>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <RACTextField isDisabled className="flex flex-col gap-1">
      <Label>Label</Label>
      <Input {...args} />
    </RACTextField>
  ),
};
