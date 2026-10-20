import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';
import { Form } from './Form';
import { TextField } from './TextField';

const meta = {
  title: 'Atoms/Form',
  component: Form,
  parameters: {
    layout: 'centered',
  },
  args: {
    // Keeps Storybook from navigating away on submit.
    onSubmit: (event) => event.preventDefault(),
    className: 'w-72',
  },
  render: (args) => (
    <Form {...args}>
      <TextField name="username" label="Username" isRequired />
      <TextField name="password" label="Password" type="password" isRequired />
      <Button type="submit">Submit</Button>
    </Form>
  ),
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithServerErrors: Story = {
  args: {
    validationErrors: {
      username: 'This username is already taken.',
    },
  },
};
