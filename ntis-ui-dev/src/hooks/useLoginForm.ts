'use client';

/**
 * Custom hook for login form state management.
 * 
 * Following the pattern from useConstructionForm.ts for consistent
 * form handling across the application.
 * 
 * @module useLoginForm
 */

import {
  useState,
  useCallback,
  useMemo,
  type ChangeEvent,
  type FocusEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import {
  AUTH_CONSTRAINTS,
  USERNAME_SANITIZE,
  PASSWORD_SANITIZE,
  AUTH_ERROR_CODES,
} from '@/components/modules/login/constants';
import type { LoginFormData, LoginFormErrors, UseLoginFormOptions, UseLoginFormReturn } from '@/types/login.types';
export type { LoginFormData, LoginFormErrors, UseLoginFormOptions, UseLoginFormReturn } from '@/types/login.types';

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useLoginForm(options: UseLoginFormOptions = {}): UseLoginFormReturn {
  const { initialUsername = '' } = options;
  
  const t = useTranslations('login');
  
  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    username: initialUsername,
    password: '',
  });
  
  // Validation state
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  
  const validate = useCallback((data: LoginFormData): LoginFormErrors => {
    const errs: LoginFormErrors = {};
    
    // Username validation
    const trimmedUsername = data.username.trim();
    if (!trimmedUsername) {
      errs.username = t(`errors.${AUTH_ERROR_CODES.USERNAME_REQUIRED}`);
    } else if (trimmedUsername.length < AUTH_CONSTRAINTS.USERNAME_MIN_LENGTH) {
      errs.username = t(`errors.${AUTH_ERROR_CODES.USERNAME_TOO_SHORT}`);
    } else if (trimmedUsername.length > AUTH_CONSTRAINTS.USERNAME_MAX_LENGTH) {
      errs.username = t(`errors.${AUTH_ERROR_CODES.USERNAME_TOO_LONG}`);
    }
    
    // Password validation
    if (!data.password) {
      errs.password = t(`errors.${AUTH_ERROR_CODES.PASSWORD_REQUIRED}`);
    } else if (data.password.length > AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH) {
      errs.password = t(`errors.${AUTH_ERROR_CODES.PASSWORD_TOO_LONG}`);
    }
    
    return errs;
  }, [t]);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let sanitizedValue = value;
    
    if (name === 'username') {
      // Sanitize username - remove invalid characters
      sanitizedValue = value.replace(USERNAME_SANITIZE, '');
      // Enforce max length
      if (sanitizedValue.length > AUTH_CONSTRAINTS.USERNAME_MAX_LENGTH) {
        sanitizedValue = sanitizedValue.slice(0, AUTH_CONSTRAINTS.USERNAME_MAX_LENGTH);
      }
    } else if (name === 'password') {
      // Remove zero-width and control characters
      sanitizedValue = value.replace(PASSWORD_SANITIZE, '');
      // Enforce max length
      if (sanitizedValue.length > AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH) {
        sanitizedValue = sanitizedValue.slice(0, AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH);
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    
    // Clear error for this field on change
    if (errors[name as keyof LoginFormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof LoginFormErrors];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate this field
    const fieldErrors = validate(formData);
    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors[name as keyof LoginFormErrors],
    }));
  }, [formData, validate]);

  // ---------------------------------------------------------------------------
  // Utility Functions
  // ---------------------------------------------------------------------------

  const showError = useCallback((field: keyof LoginFormErrors): boolean => {
    return (submittedOnce || touched[field]) && !!errors[field];
  }, [submittedOnce, touched, errors]);

  const validateForm = useCallback((): boolean => {
    const allErrors = validate(formData);
    setErrors(allErrors);
    setSubmittedOnce(true);
    
    // Mark all fields as touched
    setTouched({
      username: true,
      password: true,
    });
    
    return Object.keys(allErrors).length === 0;
  }, [formData, validate]);

  const resetForm = useCallback(() => {
    setFormData({
      username: initialUsername,
      password: '',
    });
    setErrors({});
    setTouched({});
    setSubmittedOnce(false);
  }, [initialUsername]);

  const markSubmitted = useCallback(() => {
    setSubmittedOnce(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const canSubmit = useMemo(() => {
    const hasUsername = formData.username.trim().length >= AUTH_CONSTRAINTS.USERNAME_MIN_LENGTH;
    const hasPassword = formData.password.length > 0;
    return hasUsername && hasPassword;
  }, [formData]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    formData,
    errors,
    touched,
    submittedOnce,
    handleChange,
    handleBlur,
    showError,
    validateForm,
    resetForm,
    setFormData,
    markSubmitted,
    isValid,
    canSubmit,
  };
}
