'use client';

import React, { useId, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Eye, EyeOff, User, Lock, Loader2, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Input, Button, Label } from '@/components/common';
import { useCapsLock } from '@/hooks/useCapsLock';

import type { UseLoginFormReturn } from '@/hooks/useLoginForm';
import type { LoginFormCopy } from '@/types/login.types';

import {
  AUTH_CONSTRAINTS,
  LOGIN_PRIMARY_SUBMIT_CLASS,
  LOGIN_FIELD_INPUT_CLASS,
  LOGIN_PASSWORD_INPUT_CLASS,
  LOGIN_FIELD_ICON_CLASS,
  LOGIN_USERNAME_ICON_ACCENT,
  LOGIN_PASSWORD_ICON_ACCENT,
} from './constants';

// Re-export for consumers that import from this file
export { LOGIN_PRIMARY_SUBMIT_CLASS };
export { useLoginErrorMessages } from '@/hooks/useLoginErrorMessages';

// ---------------------------------------------------------------------------
// Form Components
// ---------------------------------------------------------------------------

/**
 * Submit button that integrates with React form status.
 * Shows loading state during form submission.
 */
function FormSubmitButton({
  children,
  className,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} className={className}>
      {children}
    </Button>
  );
}

/**
 * Full-form loading overlay while the server action is in flight (useFormStatus).
 * Must be rendered inside a <form>.
 */
export function FormLoadingOverlay() {
  const { pending } = useFormStatus();
  const t = useTranslations('login');

  if (!pending) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-transparent"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{t('pageLoading.message')}</span>
      <Loader2 className="h-8 w-8 shrink-0 animate-spin text-cyan-600" aria-hidden />
    </div>
  );
}

/**
 * Login credential input fields — uses {@link useLoginForm} for state and validation.
 */
export function LoginCredentialFields({
  loginForm,
  locale,
  copy,
}: {
  loginForm: UseLoginFormReturn;
  locale: string;
  copy?: LoginFormCopy;
}) {
  const t = useTranslations('login');
  const { formData, errors, handleChange, handleBlur, showError } = loginForm;
  const { isCapsLockOn, checkCapsLock, handleBlur: handleCapsLockBlur } = useCapsLock();
  const [showPassword, setShowPassword] = useState(false);
  const usernameId = useId();
  const passwordId = useId();

  // Automatically hide/unview password after 5 seconds for security
  useEffect(() => {
    if (!showPassword) return;

    const timer = setTimeout(() => {
      setShowPassword(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [showPassword]);

  // Reset password visibility if password field is cleared
  if (showPassword && formData.password.length === 0) {
    setShowPassword(false);
  }

  const labelUsername = t('username') || copy?.username;
  const placeholderUsername = t('usernamePlaceholder') || copy?.usernamePlaceholder;
  const labelPassword = t('password') || copy?.password;
  const placeholderPassword = t('passwordPlaceholder') || copy?.passwordPlaceholder;
  const labelShowPassword = t('showPassword') || copy?.showPassword;
  const labelHidePassword = t('hidePassword') || copy?.hidePassword;
  const labelSignIn = t('signIn') || copy?.signIn;
  const labelForgotPassword = (t('forgotPassword') || copy?.forgotPassword || 'Forgot Password').replace('?', '');
  const labelCapsLockOn = t('capsLockOn') || copy?.capsLockOn || 'Caps Lock is on';

  const handlePasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    handleCapsLockBlur();
    handleBlur(e);
  };

  return (
    <>
      <Input type="hidden" name="locale" value={locale} />
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor={usernameId} className="ml-1 text-sm font-semibold text-gray-700">
            {labelUsername}
          </Label>
          <div className="group relative w-full">
            <User
              size={20}
              className={`${LOGIN_FIELD_ICON_CLASS} ${LOGIN_USERNAME_ICON_ACCENT} transition-all duration-300 drop-shadow-[0_0_5px_rgba(6,182,212,0.3)] group-focus-within:text-cyan-500`}
            />
            <Input
              id={usernameId}
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholderUsername}
              maxLength={AUTH_CONSTRAINTS.USERNAME_MAX_LENGTH}
              className={LOGIN_FIELD_INPUT_CLASS}
              error={showError('username') ? errors.username : undefined}
              fullWidth
              autoComplete="username"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={passwordId} className="ml-1 text-sm font-semibold text-gray-700">
            {labelPassword}
          </Label>
          <div className="group relative w-full">
            <Lock
              size={20}
              className={`${LOGIN_FIELD_ICON_CLASS} ${LOGIN_PASSWORD_ICON_ACCENT} transition-all duration-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)] group-focus-within:text-amber-500`}
            />
            <Input
              id={passwordId}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              onBlur={handlePasswordBlur}
              onKeyDown={checkCapsLock}
              onKeyUp={checkCapsLock}
              onClick={checkCapsLock}
              placeholder={placeholderPassword}
              maxLength={AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH}
              className={LOGIN_PASSWORD_INPUT_CLASS}
              error={showError('password') ? errors.password : undefined}
              fullWidth
              autoComplete="new-password"
            />
            {formData.password.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? labelHidePassword : labelShowPassword}
                className="absolute right-1 top-[22px] z-10 -translate-y-1/2 p-1 text-gray-400 hover:text-cyan-600"
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-cyan-600" />
                ) : (
                  <Eye size={20} className="text-cyan-500" />
                )}
              </Button>
            ) : null}
          </div>
          <div className="flex items-center justify-between pt-1 min-h-[24px]">
            {isCapsLockOn ? (
              <motion.div
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-300/80 px-2 py-0.5 text-xs font-semibold text-amber-800 shadow-xs"
                role="status"
                aria-live="polite"
                data-testid="caps-lock-warning"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-200/80 text-amber-800">
                  <ArrowUp size={11} className="stroke-[3]" />
                </span>
                <span>{labelCapsLockOn}</span>
              </motion.div>
            ) : (
              <div />
            )}
            <a
              href={`/${locale}/login/forgot-password`}
              className="text-sm font-semibold text-cyan-600 hover:text-cyan-800 hover:underline transition-colors ml-auto"
            >
              {labelForgotPassword}
            </a>
          </div>
        </div>
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex justify-center pt-1"
      >
        <FormSubmitButton className={LOGIN_PRIMARY_SUBMIT_CLASS}>{labelSignIn}</FormSubmitButton>
      </motion.div>
    </>
  );
}
