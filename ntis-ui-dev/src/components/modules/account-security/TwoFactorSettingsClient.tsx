'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, ShieldOff, KeyRound, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, ValidationMessage } from '@/components/common';
import { CopyableKey, RecoveryCodesGrid, CodeConfirmForm, TwoFactorSetupManual } from './TwoFactorSetupPrimitives';

import {
  beginTwoFactorSetupAction,
  enableTwoFactorAction,
  confirmTwoFactorEmailAction,
  regenerateRecoveryCodesAction,
  disableTwoFactorAction,
  resetTwoFactorAction,
  endSecurityUpdateSessionAction,
  type TwoFactorActionResult,
  type TwoFactorActionErrorCode,
} from '@/app/[locale]/account/security/actions';
import type { TwoFactorStatusResponse, TwoFactorSetupResponse } from '@/types/two-factor.types';

type View =
  | { kind: 'idle' }
  | { kind: 'setup'; setup: TwoFactorSetupResponse }
  | { kind: 'emailVerify'; maskedEmail: string; lastTotpCode: string }
  | { kind: 'recoveryCodes'; codes: string[]; forcesReSignIn: boolean }
  | { kind: 'disable' }
  | { kind: 'reset' }
  | { kind: 'resetDone'; setup: TwoFactorSetupResponse }
  | { kind: 'regenerate' };

function errorMessageKey(errorCode: TwoFactorActionErrorCode): string {
  switch (errorCode) {
    case 'ALREADY_ENABLED':
      return 'errors.alreadyEnabled';
    case 'NOT_ENABLED':
      return 'errors.notEnabled';
    case 'SETUP_NOT_STARTED':
      return 'errors.setupNotStarted';
    case 'EMAIL_NOT_ON_FILE':
      return 'errors.emailNotOnFile';
    case 'INVALID_CODE':
      return 'errors.invalidCode';
    case 'USER_NOT_FOUND':
      return 'errors.userNotFound';
    default:
      return 'errors.genericError';
  }
}

export function TwoFactorSettingsClient({
  locale,
  initialStatus,
  adminRequired = false,
}: {
  locale: string;
  initialStatus: TwoFactorStatusResponse;
  adminRequired?: boolean;
}) {
  const t = useTranslations('twoFactorSettings');
  const [status, setStatus] = useState(initialStatus);
  const [view, setView] = useState<View>({ kind: 'idle' });
  const [error, setError] = useState<string | undefined>(undefined);
  const [resent, setResent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runAction<T>(
    action: () => Promise<TwoFactorActionResult<T>>,
    onSuccess: (data: T) => void
  ) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(t(errorMessageKey(result.errorCode)));
        return;
      }
      onSuccess(result.data);
    });
  }

  function beginSetup() {
    runAction(beginTwoFactorSetupAction, (setup) => setView({ kind: 'setup', setup }));
  }

  function confirmEnable(code: string) {
    const fd = new FormData();
    fd.set('code', code);
    runAction(
      () => enableTwoFactorAction(fd),
      (data) => setView({ kind: 'emailVerify', maskedEmail: data.maskedEmail, lastTotpCode: code })
    );
  }

  function confirmEmail(code: string) {
    const fd = new FormData();
    fd.set('code', code);
    runAction(
      () => confirmTwoFactorEmailAction(fd),
      (data) => setView({ kind: 'recoveryCodes', codes: data.recoveryCodes, forcesReSignIn: true })
    );
  }

  function resendEmailCode() {
    if (view.kind !== 'emailVerify') return;
    const fd = new FormData();
    fd.set('code', view.lastTotpCode);
    setResent(false);
    runAction(
      () => enableTwoFactorAction(fd),
      (data) => {
        setView({ kind: 'emailVerify', maskedEmail: data.maskedEmail, lastTotpCode: view.lastTotpCode });
        setResent(true);
      }
    );
  }

  function confirmRegenerate(code: string) {
    const fd = new FormData();
    fd.set('code', code);
    runAction(
      () => regenerateRecoveryCodesAction(fd),
      (data) => setView({ kind: 'recoveryCodes', codes: data.recoveryCodes, forcesReSignIn: false })
    );
  }

  function confirmDisable(code: string) {
    const fd = new FormData();
    fd.set('code', code);
    runAction(
      () => disableTwoFactorAction(fd),
      () => {
        setStatus({ isEnabled: false, recoveryCodesRemaining: 0, hasAuthenticatorKey: false });
        void endSecurityUpdateSessionAction(locale);
      }
    );
  }

  function confirmReset(code: string) {
    const fd = new FormData();
    fd.set('code', code);
    runAction(
      () => resetTwoFactorAction(fd),
      (setup) => setView({ kind: 'resetDone', setup })
    );
  }

  function finishRecoveryCodes(codes: string[], forcesReSignIn: boolean) {
    if (forcesReSignIn) {
      void endSecurityUpdateSessionAction(locale);
      return;
    }
    setStatus((s) => ({ ...s, recoveryCodesRemaining: codes.length }));
    setView({ kind: 'idle' });
  }

  // The functional card: exactly the original state machine (click Enable → QR appears in this
  // same spot → confirm → email verify → recovery codes, etc.) — unchanged from before the
  // two-column layout existed. The manual on the right is pure reference and never affects this.
  let functionalCard: ReactNode;

  if (view.kind === 'setup') {
    functionalCard = (
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">{t('setupTitle')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('setupInstructions')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-4">
            <QRCodeSVG value={view.setup.authenticatorUri} size={192} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">{t('manualEntryLabel')}</p>
            <CopyableKey value={view.setup.sharedKey} />
          </div>
          <CodeConfirmForm
            label={t('confirmCodeLabel')}
            submitLabel={t('confirmButton')}
            cancelLabel={t('cancelButton')}
            onSubmit={confirmEnable}
            onCancel={() => setView({ kind: 'idle' })}
            error={error}
            pending={isPending}
          />
        </CardContent>
      </Card>
    );
  } else if (view.kind === 'emailVerify') {
    functionalCard = (
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">{t('emailVerifyTitle')}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('emailVerifyInstructions', { maskedEmail: view.maskedEmail })}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {resent ? <ValidationMessage type="info" message={t('emailCodeResent')} visible /> : null}
          <CodeConfirmForm
            label={t('emailCodeLabel')}
            submitLabel={t('confirmButton')}
            cancelLabel={t('cancelButton')}
            onSubmit={confirmEmail}
            onCancel={() => setView({ kind: 'idle' })}
            error={error}
            pending={isPending}
          />
          <button
            type="button"
            onClick={resendEmailCode}
            disabled={isPending}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('resendCodeButton')}
          </button>
        </CardContent>
      </Card>
    );
  } else if (view.kind === 'recoveryCodes') {
    functionalCard = (
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">{t('recoveryCodesTitle')}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValidationMessage type="warning" message={t('recoveryCodesWarning')} visible />
          <RecoveryCodesGrid codes={view.codes} />
          <Button onClick={() => finishRecoveryCodes(view.codes, view.forcesReSignIn)} variant="primary" isLoading={isPending}>
            {view.forcesReSignIn ? t('signInAgainButton') : t('doneButton')}
          </Button>
        </CardContent>
      </Card>
    );
  } else if (view.kind === 'disable') {
    functionalCard = (
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">{t('disableTitle')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('disableWarning')}</p>
        </CardHeader>
        <CardContent>
          <CodeConfirmForm
            label={t('codeOrRecoveryCodeLabel')}
            submitLabel={t('confirmDisableButton')}
            cancelLabel={t('cancelButton')}
            onSubmit={confirmDisable}
            onCancel={() => setView({ kind: 'idle' })}
            error={error}
            pending={isPending}
            danger
          />
        </CardContent>
      </Card>
    );
  } else if (view.kind === 'reset') {
    functionalCard = (
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">{t('resetTitle')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('resetWarning')}</p>
        </CardHeader>
        <CardContent>
          <CodeConfirmForm
            label={t('codeOrRecoveryCodeLabel')}
            submitLabel={t('confirmResetButton')}
            cancelLabel={t('cancelButton')}
            onSubmit={confirmReset}
            onCancel={() => setView({ kind: 'idle' })}
            error={error}
            pending={isPending}
            danger
          />
        </CardContent>
      </Card>
    );
  } else if (view.kind === 'resetDone') {
    functionalCard = (
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">{t('setupTitle')}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValidationMessage type="warning" message={t('resetSetupNotice')} visible />
          <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-4">
            <QRCodeSVG value={view.setup.authenticatorUri} size={192} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">{t('manualEntryLabel')}</p>
            <CopyableKey value={view.setup.sharedKey} />
          </div>
          <Button
            onClick={() => void endSecurityUpdateSessionAction(locale)}
            variant="primary"
            isLoading={isPending}
          >
            {t('signInAgainButton')}
          </Button>
        </CardContent>
      </Card>
    );
  } else if (view.kind === 'regenerate') {
    functionalCard = (
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">{t('regenerateTitle')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('regenerateWarning')}</p>
        </CardHeader>
        <CardContent>
          <CodeConfirmForm
            label={t('confirmCodeOnlyLabel')}
            submitLabel={t('confirmRegenerateButton')}
            cancelLabel={t('cancelButton')}
            onSubmit={confirmRegenerate}
            onCancel={() => setView({ kind: 'idle' })}
            error={error}
            pending={isPending}
          />
        </CardContent>
      </Card>
    );
  } else {
    // idle
    functionalCard = (
      <Card variant="elevated" padding="lg">
        <CardContent className="space-y-4">
          {adminRequired && !status.isEnabled ? (
            <ValidationMessage type="warning" message={t('adminRequiredNotice')} visible />
          ) : null}
          {error ? <ValidationMessage type="error" message={error} visible /> : null}

          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            {status.isEnabled ? (
              <ShieldCheck className="h-8 w-8 shrink-0 text-green-600" />
            ) : (
              <ShieldOff className="h-8 w-8 shrink-0 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">{t('statusLabel')}</p>
              <p className="text-base font-semibold text-gray-900">
                {status.isEnabled ? t('statusEnabled') : t('statusDisabled')}
              </p>
              {status.isEnabled ? (
                <p className="text-sm text-gray-500">
                  {t('recoveryCodesRemaining', { count: status.recoveryCodesRemaining })}
                </p>
              ) : null}
            </div>
          </div>

          {isPending ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
            </div>
          ) : status.isEnabled ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button variant="secondary" icon={RefreshCw} onClick={() => setView({ kind: 'regenerate' })}>
                {t('regenerateButton')}
              </Button>
              <Button variant="secondary" icon={KeyRound} onClick={() => setView({ kind: 'reset' })}>
                {t('resetButton')}
              </Button>
              <Button variant="danger" icon={ShieldOff} onClick={() => setView({ kind: 'disable' })}>
                {t('disableButton')}
              </Button>
            </div>
          ) : (
            <Button variant="primary" icon={ShieldCheck} onClick={beginSetup} isLoading={isPending}>
              {t('enableButton')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      {functionalCard}
      <TwoFactorSetupManual />
    </div>
  );
}
