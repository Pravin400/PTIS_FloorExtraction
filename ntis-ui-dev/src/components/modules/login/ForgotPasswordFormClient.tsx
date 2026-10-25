'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Loader2, User, Mail, MessageSquare, ShieldCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Input, Label, Button, ValidationMessage } from '@/components/common';

import {
  checkForgotPasswordMethodsFormAction,
  forgotPasswordFormAction,
} from '@/app/[locale]/login/forgot-password/actions';
import { useLoginErrorMessages } from '@/hooks/useLoginErrorMessages';
import type { ForgotPasswordMethod } from '@/types/login.types';
import {
  LOGIN_PRIMARY_SUBMIT_CLASS,
  LOGIN_FIELD_INPUT_CLASS,
  LOGIN_FIELD_ICON_CLASS,
  LOGIN_USERNAME_ICON_ACCENT,
  AUTH_CONSTRAINTS,
} from '@/components/modules/login/constants';

function SubmitButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} className={LOGIN_PRIMARY_SUBMIT_CLASS}>
      {pending ? <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden /> : children}
    </Button>
  );
}

const METHOD_ICONS: Record<ForgotPasswordMethod, React.ElementType> = {
  Email: Mail,
  Sms: MessageSquare,
  Authenticator: ShieldCheck,
};

function MethodOption({
  method,
  label,
  hint,
  selected,
  onSelect,
}: {
  method: ForgotPasswordMethod;
  label: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = METHOD_ICONS[method];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
        selected
          ? 'border-cyan-500 bg-cyan-50/80 ring-2 ring-cyan-500/20'
          : 'border-gray-200 bg-gray-50/50 hover:border-cyan-300'
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          selected ? 'bg-cyan-500 text-white' : 'bg-white text-cyan-600'
        )}
        aria-hidden
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-800">{label}</span>
        {hint ? <span className="block truncate text-xs text-gray-500">{hint}</span> : null}
      </span>
      {selected ? <Check size={18} className="shrink-0 text-cyan-600" aria-hidden /> : null}
    </button>
  );
}

/**
 * Two-stage form: (1) enter username/email, look up which OTP methods are actually available for
 * that account; (2) pick one of the returned methods and request the OTP. Both stages live on
 * this one route/page — nothing sensitive is being guarded yet, so no separate SSR page is needed
 * (unlike verify-otp/reset, which each guard a server-issued challenge/token).
 */
export function ForgotPasswordFormClient({ locale }: { locale: string }) {
  const t = useTranslations('login');
  const { getLocalizedError } = useLoginErrorMessages();

  const [checkState, checkAction] = useActionState(checkForgotPasswordMethodsFormAction, null);
  const [sendState, sendAction] = useActionState(forgotPasswordFormAction, null);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<ForgotPasswordMethod | null>(null);

  const hasCheckedMethods = Boolean(checkState?.methods);
  const methods = checkState?.methods ?? [];

  const checkError = getLocalizedError(checkState?.errorCode);
  const sendError = sendState?.rawMessage || getLocalizedError(sendState?.message);
  const noMethodsMessage = hasCheckedMethods && methods.length === 0 ? checkState?.message : undefined;

  // Stage 1: username entry.
  if (!hasCheckedMethods) {
    return (
      <form key={checkState?.resetKey ?? 'idle'} action={checkAction} className="space-y-4">
        <AnimatePresence mode="wait">
          {checkError ? (
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
                message={checkError}
                visible
                className="!mt-0 w-full justify-center rounded-lg px-3 py-3 text-center text-sm font-medium"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <p className="text-center text-sm text-gray-600">{t('enterUsername')}</p>

        <div className="space-y-1.5">
          <Label htmlFor="usernameOrEmail" className="ml-1 text-sm font-semibold text-gray-700">
            {t('username')}
          </Label>
          <div className="group relative w-full">
            <User
              size={20}
              className={`${LOGIN_FIELD_ICON_CLASS} ${LOGIN_USERNAME_ICON_ACCENT} transition-all duration-300 group-focus-within:text-cyan-500`}
            />
            <Input
              id="usernameOrEmail"
              name="usernameOrEmail"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder={t('usernamePlaceholder')}
              maxLength={AUTH_CONSTRAINTS.USERNAME_MAX_LENGTH}
              className={LOGIN_FIELD_INPUT_CLASS}
              fullWidth
              autoComplete="username"
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <SubmitButton>{t('proceed')}</SubmitButton>
        </div>

        <div className="flex justify-center pt-1 text-sm">
          <a href={`/${locale}/login`} className="text-gray-500 hover:text-gray-700 hover:underline">
            {t('backToLogin')}
          </a>
        </div>
      </form>
    );
  }

  // Stage 1 result: no methods available for this account — same generic, enumeration-safe
  // message shown regardless of why (account not found, no channel configured, feature off).
  if (methods.length === 0) {
    return (
      <div className="space-y-4">
        <ValidationMessage
          type="info"
          message={noMethodsMessage}
          visible={Boolean(noMethodsMessage)}
          className="!mt-0 w-full justify-center rounded-lg px-3 py-3 text-center text-sm font-medium"
        />
        <div className="flex justify-center pt-1 text-sm">
          <a href={`/${locale}/login`} className="text-gray-500 hover:text-gray-700 hover:underline">
            {t('backToLogin')}
          </a>
        </div>
      </div>
    );
  }

  // Stage 2: pick a method and request the OTP.
  return (
    <form key={sendState?.resetKey ?? 'idle'} action={sendAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="usernameOrEmail" value={checkState?.usernameOrEmail ?? usernameOrEmail} />
      <input type="hidden" name="method" value={selectedMethod ?? ''} />

      <AnimatePresence mode="wait">
        {sendError ? (
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
              message={sendError}
              visible
              className="!mt-0 w-full justify-center rounded-lg px-3 py-3 text-center text-sm font-medium"
            />
          </motion.div>
        ) : null}
        {!sendError && sendState?.info ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <ValidationMessage
              type="info"
              message={sendState.info}
              visible
              className="!mt-0 w-full justify-center rounded-lg px-3 py-3 text-center text-sm font-medium !border-emerald-200 !bg-emerald-50 !text-emerald-800"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p className="text-center text-sm text-gray-600">{t('chooseVerificationMethod')}</p>

      <div className="space-y-2">
        {methods.includes('Email') ? (
          <MethodOption
            method="Email"
            label={t('methodEmail')}
            hint={checkState?.maskedEmail}
            selected={selectedMethod === 'Email'}
            onSelect={() => setSelectedMethod('Email')}
          />
        ) : null}
        {methods.includes('Sms') ? (
          <MethodOption
            method="Sms"
            label={t('methodSms')}
            hint={checkState?.maskedMobile}
            selected={selectedMethod === 'Sms'}
            onSelect={() => setSelectedMethod('Sms')}
          />
        ) : null}
        {methods.includes('Authenticator') ? (
          <MethodOption
            method="Authenticator"
            label={t('methodAuthenticator')}
            selected={selectedMethod === 'Authenticator'}
            onSelect={() => setSelectedMethod('Authenticator')}
          />
        ) : null}
      </div>

      <div className="flex justify-center pt-2">
        <SubmitButton disabled={!selectedMethod}>{t('proceed')}</SubmitButton>
      </div>

      <div className="flex justify-center pt-1 text-sm">
        <a href={`/${locale}/login`} className="text-gray-500 hover:text-gray-700 hover:underline">
          {t('backToLogin')}
        </a>
      </div>
    </form>
  );
}
