'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, ShieldCheck, ShieldQuestion, X } from 'lucide-react';
import { Button, ValidationMessage } from '@/components/common';
import { CopyableKey, RecoveryCodesGrid, CodeConfirmForm } from '@/components/modules/account-security/TwoFactorSetupPrimitives';
import {
  beginUserTwoFactorSetupAction,
  enableUserTwoFactorAction,
  confirmUserTwoFactorEmailAction,
} from '@/app/[locale]/configuration-settings/user-management/actions.mutations';
import { endSecurityUpdateSessionAction } from '@/app/[locale]/account/security/actions';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import type { TwoFactorSetupResponse } from '@/types/two-factor.types';

type View =
  | { kind: 'prompt' }
  | { kind: 'loading' }
  | { kind: 'setup'; setup: TwoFactorSetupResponse }
  | { kind: 'emailVerify'; maskedEmail: string; lastTotpCode: string }
  | { kind: 'recoveryCodes'; codes: string[] }
  | { kind: 'error'; message: string };

function resolveError(
  t: (key: string) => string,
  message: string | undefined,
  fallbackKey: string
): string {
  if (!message) return t(fallbackKey);
  if (message.startsWith('messages.') || message.startsWith('errors.')) return t(message);
  return getCleanErrorMessage(message, t(fallbackKey));
}

/**
 * Admin-assisted TOTP enrollment: the QR/manual-key/confirm-code flow scanned in person with
 * the target user's own phone — either right after creating their account, or later from the
 * edit drawer. Mirrors the self-service /account/security setup view exactly.
 */
export function TwoFactorSetupWizard({
  userId,
  userName,
  askFirst = false,
  isSelfTarget = false,
  onCancel,
  onEnabled,
}: {
  userId: number;
  userName: string;
  /** When true, opens on a "Set up 2FA now?" prompt instead of starting setup immediately. */
  askFirst?: boolean;
  /**
   * True when the admin is setting up 2FA on their OWN account. Enabling always rotates the
   * target's security stamp — for a self-targeted enable that invalidates the admin's own
   * active session, so instead of the normal "Done" flow this forces a graceful sign-out
   * (matching the self-service /account/security page) instead of an abrupt session-expired
   * redirect on whatever request happens to run next.
   */
  isSelfTarget?: boolean;
  onCancel: () => void;
  onEnabled: (recoveryCodes: string[]) => void;
}) {
  const t = useTranslations('userManagement');
  const { locale: localeParam } = useParams();
  const locale = typeof localeParam === 'string' ? localeParam : 'en';
  const [view, setView] = useState<View>(askFirst ? { kind: 'prompt' } : { kind: 'loading' });
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);
  const [emailConfirmError, setEmailConfirmError] = useState<string | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  async function startSetup() {
    setView({ kind: 'loading' });
    const res = await beginUserTwoFactorSetupAction(userId);
    if (res.success && res.data) {
      setView({ kind: 'setup', setup: res.data });
    } else {
      setView({ kind: 'error', message: resolveError(t, res.message, 'twoFactorSetup.beginError') });
    }
  }

  // `t` intentionally excluded: useTranslations returns a new reference every render,
  // but re-calling beginSetup generates a new TOTP secret, invalidating any QR code the user already scanned.
  useEffect(() => {
    if (askFirst) return;
    let active = true;
    (async () => {
      const res = await beginUserTwoFactorSetupAction(userId);
      if (!active) return;
      if (res.success && res.data) {
        setView({ kind: 'setup', setup: res.data });
      } else {
        setView({ kind: 'error', message: resolveError(t, res.message, 'twoFactorSetup.beginError') });
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, askFirst]);

  async function confirmEnable(code: string) {
    setIsPending(true);
    setConfirmError(undefined);
    const res = await enableUserTwoFactorAction(userId, code);
    setIsPending(false);
    if (res.success && res.data) {
      setEmailConfirmError(undefined);
      setView({ kind: 'emailVerify', maskedEmail: res.data.maskedEmail, lastTotpCode: code });
    } else {
      setConfirmError(resolveError(t, res.message, 'twoFactorSetup.invalidCode'));
    }
  }

  async function confirmEmail(code: string) {
    setIsPending(true);
    setEmailConfirmError(undefined);
    const res = await confirmUserTwoFactorEmailAction(userId, code);
    setIsPending(false);
    if (res.success && res.data) {
      setView({ kind: 'recoveryCodes', codes: res.data.recoveryCodes });
    } else {
      setEmailConfirmError(resolveError(t, res.message, 'twoFactorSetup.invalidEmailCode'));
    }
  }

  async function resendEmailCode() {
    if (view.kind !== 'emailVerify') return;
    setIsResending(true);
    setEmailConfirmError(undefined);
    setResent(false);
    const res = await enableUserTwoFactorAction(userId, view.lastTotpCode);
    setIsResending(false);
    if (res.success && res.data) {
      setView({ kind: 'emailVerify', maskedEmail: res.data.maskedEmail, lastTotpCode: view.lastTotpCode });
      setResent(true);
    } else {
      setEmailConfirmError(resolveError(t, res.message, 'twoFactorSetup.invalidEmailCode'));
    }
  }

  useEffect(() => {
    if (!mounted) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view.kind !== 'recoveryCodes') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mounted, view.kind, onCancel]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={view.kind !== 'recoveryCodes' ? onCancel : undefined}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] border border-gray-200"
      >
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-blue-500" />

        {view.kind !== 'recoveryCodes' && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-3 top-4 rounded-full p-2 hover:bg-gray-100 text-gray-600"
            aria-label={t('twoFactorSetup.cancelButton')}
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="p-6 space-y-4">
          {view.kind === 'prompt' && (
            <>
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
                  <ShieldQuestion className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('twoFactorSetup.promptTitle')}
                </h2>
                <p className="text-sm text-gray-500">
                  {t('twoFactorSetup.promptDescription', { userName })}
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="primary" onClick={startSetup}>
                  {t('twoFactorSetup.setUpNowButton')}
                </Button>
                <Button variant="secondary" onClick={onCancel}>
                  {t('twoFactorSetup.skipForNowButton')}
                </Button>
              </div>
            </>
          )}

          {view.kind === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
              <p className="text-sm text-gray-500">{t('twoFactorSetup.startingSetup')}</p>
            </div>
          )}

          {view.kind === 'error' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">{t('twoFactorSetup.title')}</h2>
              <ValidationMessage type="error" message={view.message} visible />
              <Button variant="secondary" onClick={onCancel}>
                {t('twoFactorSetup.cancelButton')}
              </Button>
            </>
          )}

          {view.kind === 'setup' && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('twoFactorSetup.title')}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('twoFactorSetup.instructions', { userName })}
                </p>
              </div>
              <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-4">
                <QRCodeSVG value={view.setup.authenticatorUri} size={192} />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700">
                  {t('twoFactorSetup.manualEntryLabel')}
                </p>
                <CopyableKey value={view.setup.sharedKey} />
              </div>
              <CodeConfirmForm
                label={t('twoFactorSetup.confirmCodeLabel')}
                submitLabel={t('twoFactorSetup.confirmButton')}
                cancelLabel={t('twoFactorSetup.cancelButton')}
                onSubmit={confirmEnable}
                onCancel={onCancel}
                error={confirmError}
                pending={isPending}
              />
            </>
          )}

          {view.kind === 'emailVerify' && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('twoFactorSetup.emailVerifyTitle')}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('twoFactorSetup.emailVerifyInstructions', { maskedEmail: view.maskedEmail })}
                </p>
              </div>
              {resent && (
                <ValidationMessage type="info" message={t('twoFactorSetup.emailCodeResent')} visible />
              )}
              <CodeConfirmForm
                label={t('twoFactorSetup.emailCodeLabel')}
                submitLabel={t('twoFactorSetup.confirmButton')}
                cancelLabel={t('twoFactorSetup.cancelButton')}
                onSubmit={confirmEmail}
                onCancel={onCancel}
                error={emailConfirmError}
                pending={isPending}
              />
              <button
                type="button"
                onClick={resendEmailCode}
                disabled={isResending || isPending}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? t('twoFactorSetup.resendingCode') : t('twoFactorSetup.resendCodeButton')}
              </button>
            </>
          )}

          {view.kind === 'recoveryCodes' && (
            <>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('twoFactorSetup.recoveryCodesTitle')}
                </h2>
              </div>
              <ValidationMessage
                type="warning"
                message={t('twoFactorSetup.recoveryCodesWarning')}
                visible
              />
              <RecoveryCodesGrid codes={view.codes} />
              {isSelfTarget && (
                <ValidationMessage
                  type="warning"
                  message={t('twoFactorSetup.selfSignInAgainNotice')}
                  visible
                />
              )}
              <Button
                variant="primary"
                onClick={() =>
                  isSelfTarget ? void endSecurityUpdateSessionAction(locale) : onEnabled(view.codes)
                }
              >
                {isSelfTarget ? t('twoFactorSetup.signInAgainButton') : t('twoFactorSetup.doneButton')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
