'use client';

import { useActionState, useState, type FormEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { AnimatedDigitInput, Button, ValidationMessage } from '@/components/common';

import {
  verifyForgotPasswordOtpFormAction,
  cancelForgotPasswordAction,
} from '@/app/[locale]/login/forgot-password/actions';
import { useLoginErrorMessages } from '@/hooks/useLoginErrorMessages';
import type { ForgotPasswordMethod } from '@/types/login.types';
import { LOGIN_PRIMARY_SUBMIT_CLASS } from '@/components/modules/login/constants';

const OTP_LENGTH = 6;
const OTP_PATTERN = /^[0-9]$/;

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={LOGIN_PRIMARY_SUBMIT_CLASS}>
      {pending ? <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden /> : children}
    </Button>
  );
}

export function VerifyForgotPasswordOtpFormClient({
  locale,
  method,
}: {
  locale: string;
  method: ForgotPasswordMethod;
}) {
  const t = useTranslations('login');
  const { getLocalizedError } = useLoginErrorMessages();
  const [state, formAction] = useActionState(verifyForgotPasswordOtpFormAction, null);
  const [code, setCode] = useState('');

  const displayError = state?.rawMessage || getLocalizedError(state?.message);

  return (
    <form
      key={state?.resetKey ?? 'idle'}
      action={formAction}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        if (code.trim().length === 0) {
          e.preventDefault();
        }
      }}
      className="space-y-4"
    >
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

      <p className="text-center text-sm text-gray-600">
        {method === 'Authenticator' ? t('enterAuthenticatorCode') : t('enterOtp')}
      </p>

      <AnimatedDigitInput
        name="code"
        value={code}
        onChange={setCode}
        maxLength={OTP_LENGTH}
        allowedPattern={OTP_PATTERN}
        placeholder="••••••"
        inputMode="numeric"
        autoFocus
        className="h-14 text-center text-lg"
        charClassName="text-xl"
      />

      <div className="flex justify-center pt-2">
        <SubmitButton>{t('verifyToken')}</SubmitButton>
      </div>

      <div className="flex flex-col items-center gap-2 pt-1 text-sm">
        <button
          type="button"
          onClick={() => cancelForgotPasswordAction(locale)}
          className="text-gray-500 hover:text-gray-700 hover:underline"
        >
          {t('back')}
        </button>
      </div>
    </form>
  );
}
