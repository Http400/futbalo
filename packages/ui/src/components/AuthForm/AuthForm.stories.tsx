import type { Meta, StoryObj } from '@storybook/react';
import { AuthForm } from './AuthForm';

const meta: Meta<typeof AuthForm> = {
  title: 'UI/AuthForm',
  component: AuthForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['signIn', 'signUp'],
    },
    isLoading: {
      control: 'boolean',
    },
    error: {
      control: 'text',
    },
    onSubmit: { action: 'onSubmit' },
  },
};

export default meta;
type Story = StoryObj<typeof AuthForm>;

export const SignIn: Story = {
  args: {
    mode: 'signIn',
  },
};

export const SignUp: Story = {
  args: {
    mode: 'signUp',
  },
};

export const WithError: Story = {
  args: {
    mode: 'signIn',
    error: 'Invalid email or password.',
  },
};

export const Loading: Story = {
  args: {
    mode: 'signIn',
    isLoading: true,
  },
};

export const SignUpWithError: Story = {
  args: {
    mode: 'signUp',
    error: 'An account with this email already exists.',
  },
};
