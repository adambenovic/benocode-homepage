// utils/passwordValidation.ts
import { ValidationError } from './errors';

/**
 * Validates password strength according to specification:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordStrength(password: string): void {
  if (password.length < 12) {
    throw new ValidationError('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one special character');
  }
}

