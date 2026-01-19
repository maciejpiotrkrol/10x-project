/**
 * Typy dla komponentów autentykacji
 */

// ============================================================================
// State interfejsy dla formularzy
// ============================================================================

export interface SignupFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
}

export interface LoginFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}

export interface ForgotPasswordFormState {
  email: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  errors: {
    email?: string;
    general?: string;
  };
}

export interface ResetPasswordFormState {
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  errors: {
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
  token: string | null;
}
