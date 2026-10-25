'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Lock, Loader2, ArrowUp } from 'lucide-react';
import { Input, Label, Button, ValidationMessage } from '@/components/common';

import { resetPasswordFormAction } from '@/app/[locale]/login/forgot-password/actions';
import { useLoginErrorMessages } from '@/hooks/useLoginErrorMessages';
import { useCapsLock } from '@/hooks/useCapsLock';
import {
  LOGIN_PRIMARY_SUBMIT_CLASS,
  LOGIN_PASSWORD_INPUT_CLASS,
  LOGIN_FIELD_ICON_CLASS,
  LOGIN_PASSWORD_ICON_ACCENT,
  AUTH_CONSTRAINTS,
} from '@/components/modules/login/constants';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={LOGIN_PRIMARY_SUBMIT_CLASS}>
      {pending ? <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden /> : children}
    </Button>
  );
}

// On success, the server action redirects to the SSR success page
// (`/login/forgot-password/success`) — there is no client-managed success state here.
export function ResetPasswordFormClient({ locale }: { locale: string }) {
  const t = useTranslations('login');
  const { getLocalizedError } = useLoginErrorMessages();
  const [state, formAction] = useActionState(resetPasswordFormAction, null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { isCapsLockOn, checkCapsLock, handleBlur: handleCapsLockBlur } = useCapsLock();
  const labelCapsLockOn = t('capsLockOn');

  const displayError = state?.rawMessage || getLocalizedError(state?.message);

  return (
    <form key={state?.resetKey ?? 'idle'} action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <AnimatePresence mode="wait">
        {displayError ? (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            role="status"
            aria-live="polite"
          >
            <ValidationMessage
              type="error"
              message={displayError}
              visible
              className="!mt-0 w-full justify-center rounded-lg px-3 py-3 text-center text-sm font-medium"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword" className="ml-1 text-sm font-semibold text-gray-700">
          {t('newPassword')}
        </Label>
        <div className="group relative w-full">
          <Lock
            size={20}
            className={`${LOGIN_FIELD_ICON_CLASS} ${LOGIN_PASSWORD_ICON_ACCENT} transition-all duration-300 group-focus-within:text-amber-500`}
          />
          <Input
            id="newPassword"
            name="newPassword"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={checkCapsLock}
            onKeyUp={checkCapsLock}
            onClick={checkCapsLock}
            onBlur={handleCapsLockBlur}
            placeholder={t('enterNewPassword')}
            minLength={AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH}
            maxLength={AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH}
            className={LOGIN_PASSWORD_INPUT_CLASS}
            fullWidth
            autoComplete="new-password"
            autoFocus
          />
          {newPassword.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="ml-1 text-sm font-semibold text-gray-700">
          {t('confirmPassword')}
        </Label>
        <div className="group relative w-full">
          <Lock
            size={20}
            className={`${LOGIN_FIELD_ICON_CLASS} ${LOGIN_PASSWORD_ICON_ACCENT} transition-all duration-300 group-focus-within:text-amber-500`}
          />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={checkCapsLock}
            onKeyUp={checkCapsLock}
            onClick={checkCapsLock}
            onBlur={handleCapsLockBlur}
            placeholder={t('reEnterNewPassword')}
            minLength={AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH}
            maxLength={AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH}
            className={LOGIN_PASSWORD_INPUT_CLASS}
            fullWidth
            autoComplete="new-password"
          />
        </div>
      </div>

      {isCapsLockOn && (
        <div className="flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-300/80 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-xs" role="status" aria-live="polite">
          <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-200/80 text-amber-800">
            <ArrowUp size={11} className="stroke-[3]" />
          </span>
          <span>{labelCapsLockOn}</span>
        </div>
      )}

      <div className="flex justify-center pt-2">
        <SubmitButton>{t('resetPasswordButton')}</SubmitButton>
      </div>
    </form>
  );
}
