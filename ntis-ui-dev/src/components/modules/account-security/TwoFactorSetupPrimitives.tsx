'use client';

import { useState, type ReactNode, type ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy,
  Check,
  Download,
  Smartphone,
  ScanLine,
  Hash,
  ShieldCheck,
  LogIn,
  Lightbulb,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { SiGoogleplay, SiApple } from 'react-icons/si';
import { Input, Button, ValidationMessage, Card, CardHeader, CardContent } from '@/components/common';

/** Official, stable public store listings for Google Authenticator. */
const GOOGLE_AUTHENTICATOR_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2';
const GOOGLE_AUTHENTICATOR_APP_STORE_URL = 'https://apps.apple.com/app/google-authenticator/id388497605';

/**
 * Shared building blocks for TOTP setup/enable UI — used by both the self-service
 * /account/security page and the admin-assisted setup wizard on User Management, so the two
 * flows look identical to whoever's holding the phone.
 */

export function CopyableKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value.replace(/\s+/g, ''));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard unavailable — key is still visible to copy manually */
        }
      }}
      className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left font-mono text-sm tracking-wider text-gray-800 hover:border-gray-300"
    >
      <span className="break-all">{value}</span>
      {copied ? (
        <Check className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 shrink-0 text-gray-400" />
      )}
    </button>
  );
}

/** One store card: a large scannable QR code, a scan hint, and the branded badge below it. */
function StoreBadge({
  href,
  ariaLabel,
  icon: Icon,
  eyebrow,
  brand,
  scanLabel,
}: {
  href: string;
  ariaLabel: string;
  icon: ComponentType<{ className?: string }>;
  eyebrow: string;
  brand: string;
  scanLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-center">
      <div className="rounded-md border border-gray-200 bg-white p-2">
        <QRCodeSVG value={href} size={120} />
      </div>
      <p className="text-xs text-gray-500">{scanLabel}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className="flex items-center gap-2 rounded-lg bg-black px-3 py-1.5 hover:bg-gray-800"
      >
        <Icon className="h-6 w-6 shrink-0 text-white" />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[9px] uppercase tracking-wide text-gray-300">{eyebrow}</span>
          <span className="text-sm font-semibold text-white">{brand}</span>
        </span>
      </a>
    </div>
  );
}

/**
 * Cards (with large scannable QR codes) to install Google Authenticator, for users who don't
 * already have it. Scanning takes a phone straight to the store listing — faster than typing a URL.
 */
export function AuthenticatorAppLinks({
  playStoreLabel,
  appStoreLabel,
  scanLabel,
}: {
  playStoreLabel: string;
  appStoreLabel: string;
  scanLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
      <StoreBadge
        href={GOOGLE_AUTHENTICATOR_PLAY_STORE_URL}
        ariaLabel={playStoreLabel}
        icon={SiGoogleplay}
        eyebrow="GET IT ON"
        brand="Google Play"
        scanLabel={scanLabel}
      />
      <StoreBadge
        href={GOOGLE_AUTHENTICATOR_APP_STORE_URL}
        ariaLabel={appStoreLabel}
        icon={SiApple}
        eyebrow="Download on the"
        brand="App Store"
        scanLabel={scanLabel}
      />
    </div>
  );
}

export function RecoveryCodesGrid({ codes }: { codes: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:grid-cols-3">
      {codes.map((code) => (
        <span
          key={code}
          className="rounded-md bg-white px-2 py-1.5 text-center font-mono text-sm tracking-wide text-gray-800 shadow-sm"
        >
          {code}
        </span>
      ))}
    </div>
  );
}

export function CodeConfirmForm({
  label,
  submitLabel,
  onSubmit,
  onCancel,
  cancelLabel,
  error,
  pending,
  danger = false,
}: {
  label: string;
  submitLabel: string;
  onSubmit: (code: string) => void;
  onCancel: () => void;
  cancelLabel: string;
  error?: string;
  pending: boolean;
  danger?: boolean;
}) {
  const [code, setCode] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (code.trim()) onSubmit(code.trim());
      }}
      className="space-y-3"
    >
      <ValidationMessage type="error" message={error} visible={!!error} />
      <Input
        label={label}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="123456"
        maxLength={20}
        autoFocus
        fullWidth
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" variant={danger ? 'danger' : 'primary'} isLoading={pending} disabled={!code.trim()}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * Static reference guide for setting up an authenticator app — pure documentation, no state, no
 * actions. The actual setup flow (Enable button → QR → confirm code) lives entirely in
 * TwoFactorSettingsClient; this component never changes based on it and never triggers anything.
 */
export function TwoFactorSetupManual() {
  const t = useTranslations('twoFactorSettings');

  const steps: { icon: LucideIcon; title: string; description: string; extra?: ReactNode }[] = [
    {
      icon: Download,
      title: t('manualStep1Title'),
      description: t('manualStep1Description'),
      extra: (
        <AuthenticatorAppLinks
          playStoreLabel={t('playStoreLabel')}
          appStoreLabel={t('appStoreLabel')}
          scanLabel={t('scanToInstallLabel')}
        />
      ),
    },
    { icon: Smartphone, title: t('manualStep2Title'), description: t('manualStep2Description') },
    { icon: ScanLine, title: t('manualStep3Title'), description: t('manualStep3Description') },
    { icon: Hash, title: t('manualStep4Title'), description: t('manualStep4Description') },
    { icon: ShieldCheck, title: t('manualStep5Title'), description: t('manualStep5Description') },
  ];

  const howItWorks: { icon: LucideIcon; text: string }[] = [
    { icon: LogIn, text: t('howItWorks1') },
    { icon: Smartphone, text: t('howItWorks2') },
    { icon: Hash, text: t('howItWorks3') },
    { icon: ShieldCheck, text: t('howItWorks4') },
  ];

  const tips = [t('tip1'), t('tip2'), t('tip3'), t('tip4')];

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">{t('manualTitle')}</h2>
        <p className="mt-1 text-sm text-gray-500">{t('manualDescription')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <ol className="ml-3 space-y-6 border-l-2 border-gray-200">
          {steps.map((step, index) => (
            <li key={step.title} className="relative pl-6">
              <span className="absolute -left-[15px] flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white ring-4 ring-white">
                {index + 1}
              </span>
              <div className="flex items-center gap-2">
                <step.icon className="h-4 w-4 shrink-0 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">{step.description}</p>
              {step.extra ? <div className="mt-2.5">{step.extra}</div> : null}
            </li>
          ))}
        </ol>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('howItWorksTitle')}</h3>
          <div className="space-y-2">
            {howItWorks.map((item, index) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-gray-600">
                <item.icon className="h-4 w-4 shrink-0 text-blue-500" />
                <span>
                  {index + 1}. {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 shrink-0 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">{t('tipsTitle')}</h3>
          </div>
          <ul className="space-y-1.5">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-amber-800">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
