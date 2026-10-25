'use client';

import React, { useState, useTransition } from 'react';
import { Lock, KeyRound, Eye, EyeOff, Check, X, AlertCircle, CheckCircle2, Loader2, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common';
import { changePasswordAction } from '@/app/[locale]/account/change-password.action';
import { useLoginErrorMessages } from '@/hooks/useLoginErrorMessages';
import { AUTH_ERROR_CODES, AUTH_CONSTRAINTS } from '@/components/modules/login/constants';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userName?: string;
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess, userName }: ChangePasswordModalProps) {
  const t = useTranslations('login');
  const { getLocalizedError } = useLoginErrorMessages();

  const [usernameInput, setUsernameInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Password rules validation - 6 to 25 characters
  const isLengthValid =
    newPassword.length >= AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH &&
    newPassword.length <= AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleResetForm = () => {
    setUsernameInput('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const effectiveUsername = (usernameInput || userName || '').trim();

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
        userName: effectiveUsername || undefined,
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!result.success) {
        const localized = getLocalizedError(result.errorCode || result.error);
        setErrorMessage(localized || t('errors.changePasswordFailed'));
      } else {
        setSuccessMessage(t('changePasswordSuccessModal'));
        if (onSuccess) {
          onSuccess();
        }
      }
    });
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2 text-gray-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <KeyRound className="h-4 w-4" />
          </div>
          <span>{t('changePassword')}</span>
        </div>
      }
      subtitle={t('changePasswordModalSubtitle')}
    >
      {successMessage ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm animate-in zoom-in-50 duration-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{t('passwordChangedSuccessTitle')}</h3>
          <p className="mt-2 max-w-sm text-sm text-gray-600">
            {successMessage}
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="primary"
              onClick={handleClose}
              className="px-6"
            >
              {t('done')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span className="flex-1 font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Username / Email (if not fixed) */}
          {!userName && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                {t('usernameOrEmail')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder={t('usernameOrEmailPlaceholder')}
                  disabled={isPending}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 transition-all"
                />
              </div>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              {t('currentPassword')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('enterCurrentPassword')}
                disabled={isPending}
                maxLength={AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH}
                required
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? t('hidePassword') : t('showPassword')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              {t('newPassword')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('enterNewPassword')}
                disabled={isPending}
                minLength={AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH}
                maxLength={AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH}
                required
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? t('hidePassword') : t('showPassword')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Hint */}
            {newPassword.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                {isLengthValid ? (
                  <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                )}
                <span className={isLengthValid ? 'text-green-700 font-medium' : 'text-red-600'}>
                  {t('minCharsRequirement')}
                </span>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              {t('confirmPassword')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('reEnterNewPassword')}
                disabled={isPending}
                minLength={AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH}
                maxLength={AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH}
                required
                className={`w-full rounded-lg border bg-white py-2 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:bg-gray-100 transition-all ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-green-400 focus:border-green-500 focus:ring-green-500/20'
                      : 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? t('hidePassword') : t('showPassword')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-[11px] text-red-600 font-medium">
                {t('errors.passwordsMismatch')}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClose}
              disabled={isPending}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isPending || !currentPassword || !newPassword || !confirmPassword || !passwordsMatch || !isLengthValid}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isPending ? t('updatingPassword') : t('updatePassword')}</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
