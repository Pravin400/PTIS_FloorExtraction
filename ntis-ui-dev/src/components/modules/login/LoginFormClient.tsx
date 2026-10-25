'use client';

import {
  useActionState,
  useEffect,
  useState,
  type FormEvent,
  type ComponentProps,
} from 'react';
import { clearLegacyAuthClientStorage } from '@/lib/utils/legacy-auth-storage';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ValidationMessage, Button } from '@/components/common';

import { loginCredentialsFormAction } from '@/app/[locale]/login/actions';
import { useLoginForm } from '@/hooks/useLoginForm';
import { useLoginErrorMessages } from '@/hooks/useLoginErrorMessages';
import {
  AUTH_ERROR_CODES,
  RATE_LIMIT_COUNTDOWN_INITIAL_SECONDS,
} from '@/components/modules/login/constants';
import type { LoginFormProps } from '@/types/login.types';

import { FormLoadingOverlay, LoginCredentialFields } from './LoginFormParts';
import { InlineChangePasswordForm } from './InlineChangePasswordForm';
import { VerifyTwoFactorFormClient } from './VerifyTwoFactorFormClient';
import { KeyRound, X } from 'lucide-react';

function LoginRateLimitHint() {
  const t = useTranslations('login');
  const [seconds, setSeconds] = useState(RATE_LIMIT_COUNTDOWN_INITIAL_SECONDS);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="mt-1 text-center text-xs font-medium text-amber-800" aria-live="polite">
      {t('errors.retryInSeconds', { seconds })}
    </p>
  );
}

/**
 * Renders the credentials form; remount when {@link loginCredentialsFormAction} returns
 * a new `resetKey` so the hook state clears (including the password) after a failed sign-in.
 */
type LoginFormElementProps = ComponentProps<'form'>;

function LoginFormCredentialsBody({
  initialUsername,
  locale,
  copy,
  formAction,
}: {
  initialUsername: string;
  locale: string;
  copy: LoginFormProps['copy'];
  formAction: NonNullable<LoginFormElementProps['action']>;
}) {
  const login = useLoginForm({ initialUsername });

  return (
    <motion.form
      id="login-credentials-form"
      autoComplete="off"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      action={formAction}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        if (!login.validateForm()) {
          e.preventDefault();
        } else {
          try {
            sessionStorage.setItem('is_tab_active_session', 'true');
          } catch {}
        }
      }}
      className="relative space-y-4"
    >
      <FormLoadingOverlay />
      <LoginCredentialFields loginForm={login} locale={locale} copy={copy} />
    </motion.form>
  );
}

/** Client island: progressive enhancement for login action state, field interactivity, and motion. */
export function LoginFormClient({
  username,
  locale,
  errorMessage = '',
  infoMessage = '',
  copy,
}: LoginFormProps) {
  const { getLocalizedError } = useLoginErrorMessages();
  const t = useTranslations('login');

  const [viewMode, setViewMode] = useState<'login' | 'changePassword'>('login');
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [dismissedChallengeKey, setDismissedChallengeKey] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState(false);

  const [credState, credAction] = useActionState(loginCredentialsFormAction, null);

  const isTwoFactorActive = Boolean(
    credState?.requiresTwoFactor && credState.resetKey !== dismissedChallengeKey
  );

  useEffect(() => {
    clearLegacyAuthClientStorage();

    // Clean up lingering ?error= or ?message= query params from address bar so it doesn't get stuck
    if (typeof window !== 'undefined' && (window.location.search.includes('error=') || window.location.search.includes('message='))) {
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('message');
      const cleanUrl = url.pathname + (url.search ? url.search : '');
      window.history.replaceState(null, '', cleanUrl);
    }

    const handlePageShow = () => {
      clearLegacyAuthClientStorage();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const credentialFieldsKey = credState?.resetKey ?? 'idle';
  const initialUsernameForFields = credState?.message ? '' : (username ?? '');

  const lastErrorCode = credState?.message;
  const isPasswordChangeRequired = lastErrorCode === AUTH_ERROR_CODES.PASSWORD_CHANGE_REQUIRED;
  const rawError =
    lastErrorCode === AUTH_ERROR_CODES.INVALID_CREDENTIALS && credState?.remainingAttempts != null
      ? t('errors.invalidCredentialsWithAttempts', { remaining: credState.remainingAttempts })
      : getLocalizedError(credState?.message) || errorMessage;
  const displayError = dismissedError ? '' : rawError;
  const showRateLimit = lastErrorCode === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS;
  const showTimeoutRetry = lastErrorCode === AUTH_ERROR_CODES.REQUEST_TIMEOUT;

  if (viewMode === 'changePassword') {
    return (
      <InlineChangePasswordForm
        initialUsername={username}
        onBackToLogin={() => setViewMode('login')}
        onSuccess={(msg) => {
          setSuccessInfo(msg);
          setViewMode('login');
        }}
      />
    );
  }

  if (isTwoFactorActive) {
    return (
      <VerifyTwoFactorFormClient
        locale={locale}
        method={credState?.twoFactorMethod || 'totp'}
        username={credState?.twoFactorUsername || username || ''}
        challengeId={credState?.challengeId}
        onBackToLogin={() => {
          setDismissedChallengeKey(credState?.resetKey ?? 'dismissed');
        }}
      />
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {successInfo || infoMessage ? (
          <motion.div
            key="login-info"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full"
            aria-live="polite"
          >
            <ValidationMessage
              type="info"
              message={successInfo || infoMessage}
              visible
              className="!mt-0 w-full justify-center rounded-lg px-3 py-3 text-center text-sm font-medium !border-emerald-200 !bg-emerald-50 !text-emerald-800"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {displayError ? (
          <motion.div
            key="login-error"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full"
            role="status"
            aria-live="polite"
          >
            {isPasswordChangeRequired ? (
              <div className="rounded-xl border border-red-200 bg-red-50/95 p-3.5 text-center shadow-sm space-y-2">
                <p className="text-xs font-semibold text-red-700 leading-relaxed">
                  {t('errors.passwordChangeRequired')}
                </p>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setViewMode('changePassword')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3.5 py-1.5 text-xs font-bold text-white shadow transition-all duration-200 hover:scale-[1.02]"
                  >
                    <KeyRound size={13} />
                    <span>{t('changePassword')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <ValidationMessage
                  type="error"
                  message={displayError}
                  visible={Boolean(displayError)}
                  className="!mt-0 w-full justify-center rounded-lg px-3 py-3 text-center text-sm font-medium [&_svg]:shrink-0 pr-8"
                />
                {displayError ? (
                  <button
                    type="button"
                    onClick={() => setDismissedError(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:text-red-700 cursor-pointer rounded-md transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            )}
            {showRateLimit && credState?.resetKey ? (
              <LoginRateLimitHint key={credState.resetKey} />
            ) : null}
            {showTimeoutRetry ? (
              <div className="mt-3 flex justify-center">
                <Button
                  type="submit"
                  form="login-credentials-form"
                  variant="secondary"
                  size="sm"
                  className="font-medium"
                >
                  {t('pageError.tryAgain')}
                </Button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <LoginFormCredentialsBody
        key={credentialFieldsKey}
        initialUsername={initialUsernameForFields}
        formAction={credAction}
        locale={locale}
        copy={copy}
      />
    </>
  );
}
