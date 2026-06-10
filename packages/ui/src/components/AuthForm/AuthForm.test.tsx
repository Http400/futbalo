import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthForm } from './AuthForm';

// MUI Required TextFields render an aria-hidden asterisk inside the label,
// so testing-library computes label text as e.g. "Password  *".
// Use /^password/i (start-anchored only) to match "Password *" without matching "Confirm password *".
const passwordLabel = /^password/i;

describe('AuthForm — signIn mode', () => {
  it('renders email and password inputs', () => {
    render(<AuthForm mode="signIn" onSubmit={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(passwordLabel)).toBeInTheDocument();
  });

  it('does not render name or confirm password inputs', () => {
    render(<AuthForm mode="signIn" onSubmit={vi.fn()} />);
    expect(screen.queryByRole('textbox', { name: /name/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    render(<AuthForm mode="signIn" onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows email format error for invalid email', async () => {
    render(<AuthForm mode="signIn" onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows password length error when too short', async () => {
    render(<AuthForm mode="signIn" onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(passwordLabel), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('calls onSubmit with email and password on valid submit', async () => {
    const onSubmit = vi.fn();
    render(<AuthForm mode="signIn" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(passwordLabel), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
    });
  });

  it('displays external error message', () => {
    render(<AuthForm mode="signIn" onSubmit={vi.fn()} error="Invalid credentials" />);
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('disables inputs and button when isLoading', () => {
    render(<AuthForm mode="signIn" onSubmit={vi.fn()} isLoading />);
    expect(screen.getByRole('textbox', { name: /email/i })).toBeDisabled();
    expect(screen.getByLabelText(passwordLabel)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('AuthForm — signUp mode', () => {
  it('renders email, name, password and confirm password inputs', () => {
    render(<AuthForm mode="signUp" onSubmit={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^name$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(passwordLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows all validation errors when submitted empty', async () => {
    render(<AuthForm mode="signUp" onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<AuthForm mode="signUp" onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(passwordLabel), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls onSubmit WITHOUT confirmPassword on valid submit', async () => {
    const onSubmit = vi.fn();
    render(<AuthForm mode="signUp" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /^name$/i }), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(passwordLabel), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        name: 'John Doe',
        password: 'password123',
      });
    });
  });

  it('does not call onSubmit when passwords do not match', async () => {
    const onSubmit = vi.fn();
    render(<AuthForm mode="signUp" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /^name$/i }), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(passwordLabel), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
