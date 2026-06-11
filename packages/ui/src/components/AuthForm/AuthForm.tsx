import { useState } from 'react';
import { Alert, Box, CircularProgress, TextField, Typography } from '@mui/material';
import { Button } from '../Button';

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  name: string;
  password: string;
}

export interface AuthFormProps {
  mode: 'signIn' | 'signUp';
  onSubmit: (data: SignInData | SignUpData) => void;
  isLoading?: boolean;
  error?: string;
}

interface FormValues {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues, mode: 'signIn' | 'signUp'): FormErrors {
  const errors: FormErrors = {};

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (mode === 'signUp' && !values.name) {
    errors.name = 'Name is required';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (mode === 'signUp') {
    if (!values.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  return errors;
}

export function AuthForm({ mode, onSubmit, isLoading = false, error }: AuthFormProps) {
  const [values, setValues] = useState<FormValues>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});

  const isSignUp = mode === 'signUp';

  function handleChange(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [field]: e.target.value };
      setValues(next);
      if (touched[field]) {
        setErrors(validate(next, mode));
      }
    };
  }

  function handleBlur(field: keyof FormValues) {
    return () => {
      setTouched((t) => ({ ...t, [field]: true }));
      setErrors(validate(values, mode));
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched: Partial<Record<keyof FormValues, boolean>> = {
      email: true,
      password: true,
      ...(isSignUp && { name: true, confirmPassword: true }),
    };
    setTouched(allTouched);

    const validationErrors = validate(values, mode);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    if (isSignUp) {
      onSubmit({ email: values.email, name: values.name, password: values.password });
    } else {
      onSubmit({ email: values.email, password: values.password });
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}
    >
      <Typography variant="h5" component="h1" sx={{ textAlign: 'center' }}>
        {isSignUp ? 'Create account' : 'Sign in'}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        label="Email"
        type="email"
        value={values.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        error={!!errors.email}
        helperText={errors.email}
        required
        fullWidth
        disabled={isLoading}
      />

      {isSignUp && (
        <TextField
          label="Name"
          type="text"
          value={values.name}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          error={!!errors.name}
          helperText={errors.name}
          required
          fullWidth
          disabled={isLoading}
        />
      )}

      <TextField
        label="Password"
        type="password"
        value={values.password}
        onChange={handleChange('password')}
        onBlur={handleBlur('password')}
        error={!!errors.password}
        helperText={errors.password}
        required
        fullWidth
        disabled={isLoading}
      />

      {isSignUp && (
        <TextField
          label="Confirm password"
          type="password"
          value={values.confirmPassword}
          onChange={handleChange('confirmPassword')}
          onBlur={handleBlur('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          required
          fullWidth
          disabled={isLoading}
        />
      )}

      <Button
        label={isSignUp ? 'Create account' : 'Sign in'}
        type="submit"
        variant="contained"
        fullWidth
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
      />
    </Box>
  );
}
