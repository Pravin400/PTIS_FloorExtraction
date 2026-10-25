'use client';

import React, { useState, useTransition, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Loader2, ArrowLeft, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label, ValidationMessage } from '@/components/common';
import { changePasswordAction } from '@/app/[locale]/account/change-password.action';
import { useLoginErrorMessages } from '@/hooks/useLoginErrorMessages';
import { useCapsLock } from '@/hooks/useCapsLock';
import {
  LOGIN_PRIMARY_SUBMIT_CLASS,
  LOGIN_FIELD_INPUT_CLASS,
  LOGIN_PASSWORD_INPUT_CLASS,
  LOGIN_FIELD_ICON_CLASS,
  LOGIN_USERNAME_ICON_ACCENT,
  LOGIN_PASSWORD_ICON_ACCENT,
  AUTH_ERROR_CODES,
  AUTH_CONSTRAINTS,
} from './constants';

export interface InlineChangePasswordFormProps {
  initialUsername?: string;
  onBackToLogin: () => void;
  onSuccess: (message: string) => void;
}

export function InlineChangePasswordForm({
  initialUsername = '',
  onBackToLogin,
  onSuccess,
}: InlineChangePasswordFormProps) {
  const t = useTranslations('login');
  const { getLocalizedError } = useLoginErrorMessages();

  const [userName, setUserName] = useState(initialUsername);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { isCapsLockOn, checkCapsLock, handleBlur: handleCapsLockBlur } = useCapsLock();
  const labelCapsLockOn = t('capsLockOn');

  const usernameId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const isLengthValid =
    newPassword.length >= AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH &&
    newPassword.length <= AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = userName.trim();
    if (!trimmedUser) {
      setErrorMessage(getLocalizedError(AUTH_ERROR_CODES.USERNAME_REQUIRED));
      return;
    }

    if (!currentPassword) {
      setErrorMessage(getLocalizedError(AUTH_ERROR_CODES.CURRENT_PASSWORD_REQUIRED));
      return;
    }

    if (!newPassword) {
      setErrorMessage(getLocalizedError(AUTH_ERROR_CODES.NEW_PASSWORD_REQUIRED));
      return;
    }

    if (newPassword.length < AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH) {
      setErrorMessage(getLocalizedError(AUTH_ERROR_CODES.PASSWORD_TOO_SHORT));
      return;
    }

    if (newPassword.length > AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH) {
      setErrorMessage(getLocalizedError(AUTH_ERROR_CODES.PASSWORD_TOO_LONG));
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage(getLocalizedError(AUTH_ERROR_CODES.PASSWORDS_MISMATCH));
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage(getLocalizedError(AUTH_ERROR_CODES.PASSWORD_DIFFERENT_REQUIRED));
      return;
    }

    startTransition(async () => {
      const result = await changePasswordAction({
        userName: trimmedUser,
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!result.success) {
        const localized = getLocalizedError(result.errorCode || result.error);
        setErrorMessage(localized || t('errors.changePasswordFailed'));
      } else {
        onSuccess(t('changePasswordSuccess'));
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-800">{t('changePassword')}</h2>
          <p className="text-xs text-gray-500">{t('changePasswordSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={onBackToLogin}
          className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{t('backToLogin')}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ValidationMessage
              type="error"
              message={errorMessage}
              visible
              className="!mt-0 w-full justify-center rounded-lg px-3 py-2.5 text-center text-xs font-medium [&_svg]:shrink-0"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Username */}
        <div className="space-y-1">
          <Label htmlFor={usernameId} className="ml-1 text-xs font-semibold text-gray-700">
            {t('username')} <span className="text-red-500">*</span>
          </Label>
          <div className="group relative w-full">
            <User
              size={18}
              className={`${LOGIN_FIELD_ICON_CLASS} ${LOGIN_USERNAME_ICON_ACCENT} transition-all duration-300 drop-shadow-[0_0_5px_rgba(6,182,212,0.3)] group-focus-within:text-cyan-500`}
            />
            <Input
              id={usernameId}
              name="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={t('usernamePlaceholder')}
              disabled={isPending}
              className={LOGIN_FIELD_INPUT_CLASS}
              fullWidth
              autoComplete="username"
              required
            />
          </div>
        </div>

        {/* Current Password */}
        <div className="space-y-1">
          <Label htmlFor={currentPasswordId} className="ml-1 text-xs font-semibold text-gray-700">
            {t('currentPassword')} <span className="text-red-500">*</span>
          </Label>
          <div className="group relative w-full">
            <Lock
              size={18}
              className={`${LOGIN_FIELD_ICON_CLASS} ${LOGIN_PASSWORD_ICON_ACCENT} transition-all duration-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)] group-focus-within:text-amber-500`}
            />
            <Input
              id={currentPasswordId}
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onKeyDown={checkCapsLock}
              onKeyUp={checkCapsLock}
              onClick={checkCapsLock}
              onBlur={handleCapsLockBlur}
              placeholder={t('enterCurrentPassword')}
              disabled={isPending}
              maxLength={AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH}
              className={LOGIN_PASSWORD_INPUT_CLASS}
              fullWidth
              autoComplete="current-password"
              required
            />
            {currentPassword.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? t('hidePassword') : t('showPassword')}
                className="absolute right-1 top-[22px] z-10 -translate-y-1/2 p-1 text-gray-400 hover:text-cyan-600"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={18} className="text-cyan-600" /> : <Eye size={18} className="text-cyan-500" />}
              </Button>
            )}
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1">
          <Label htmlFor={newPasswordId} className="ml-1 text-xs font-semibold text-gray-700">
            {t('newPassword')} <span className="text-red-500">*</span>
          </Label>
          <div className="group relative w-full">
            <Lock
              size={18}
              className={`${LOGIN_FIELD_ICON_CLASS} ${LOGIN_PASSWORD_ICON_ACCENT} transition-all duration-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)] group-focus-within:text-amber-500`}
            />
            <Input
              id={newPasswordId}
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={checkCapsLock}
              onKeyUp={checkCapsLock}
              onClick={checkCapsLock}
              onBlur={handleCapsLockBlur}
              placeholder={t('enterNewPassword')}
              disabled={isPending}
              minLength={AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH}
              maxLength={AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH}
              className={LOGIN_PASSWORD_INPUT_CLASS}
              fullWidth
              autoComplete="new-password"
              required
            />
            {newPassword.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? t('hidePassword') : t('showPassword')}
                className="absolute right-1 top-[22px] z-10 -translate-y-1/2 p-1 text-gray-400 hover:text-cyan-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={18} className="text-cyan-600" /> : <Eye size={18} className="text-cyan-500" />}
              </Button>
            )}
          </div>
          {newPassword.length > 0 && (
            <p className={`ml-1 text-[11px] font-medium ${isLengthValid ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isLengthValid ? t('minCharsMet') : t('minCharsShort')}
            </p>
          )}
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1">
          <Label htmlFor={confirmPasswordId} className="ml-1 text-xs font-semibold text-gray-700">
            {t('confirmPassword')} <span className="text-red-500">*</span>
          </Label>
          <div className="group relative w-full">
            <Lock
              size={18}
              className={`${LOGIN_FIELD_ICON_CLASS} ${LOGIN_PASSWORD_ICON_ACCENT} transition-all duration-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)] group-focus-within:text-amber-500`}
            />
            <Input
              id={confirmPasswordId}
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={checkCapsLock}
              onKeyUp={checkCapsLock}
              onClick={checkCapsLock}
              onBlur={handleCapsLockBlur}
              placeholder={t('reEnterNewPassword')}
              disabled={isPending}
              minLength={AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH}
              maxLength={AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH}
              className={`${LOGIN_PASSWORD_INPUT_CLASS} ${
                confirmPassword.length > 0
                  ? passwordsMatch
                    ? 'border-emerald-400 focus:border-emerald-500'
                    : 'border-red-400 focus:border-red-500'
                  : ''
              }`}
              fullWidth
              autoComplete="new-password"
              required
            />
            {confirmPassword.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? t('hidePassword') : t('showPassword')}
                className="absolute right-1 top-[22px] z-10 -translate-y-1/2 p-1 text-gray-400 hover:text-cyan-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={18} className="text-cyan-600" /> : <Eye size={18} className="text-cyan-500" />}
              </Button>
            )}
          </div>
          {confirmPassword.length > 0 && (
            <p className={`ml-1 text-[11px] font-medium ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
              {passwordsMatch ? t('passwordsMatch') : t('passwordsDoNotMatch')}
            </p>
          )}
        </div>

        {isCapsLockOn && (
          <div className="flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-300/80 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-xs" role="status" aria-live="polite">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-200/80 text-amber-800">
              <ArrowUp size={11} className="stroke-[3]" />
            </span>
            <span>{labelCapsLockOn}</span>
          </div>
        )}

        {/* Submit Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex justify-center pt-3"
        >
          <Button
            type="submit"
            disabled={isPending || !userName || !currentPassword || !newPassword || !confirmPassword || !passwordsMatch || !isLengthValid}
            className={`${LOGIN_PRIMARY_SUBMIT_CLASS} flex items-center justify-center gap-2`}
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{t('updatingPassword')}</span>
              </>
            ) : (
              <span>{t('updatePassword')}</span>
            )}
          </Button>
        </motion.div>

        {/* Back Link */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            {t('cancelReturnToSignIn')}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
