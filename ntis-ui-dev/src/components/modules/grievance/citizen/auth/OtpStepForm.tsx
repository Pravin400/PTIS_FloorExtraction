'use client';

/**
 * Citizen Auth - Step 2: 6-Digit OTP Verification Form
 * Path: src/components/modules/grievance/citizen/auth/OtpStepForm.tsx
 */

import { useRef, useEffect, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Phone, CheckCircle2, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { formatDigitalTimer } from '@/lib/utils/grievance/citizen-auth-helpers';

export interface OtpStepFormProps {
  mobileNo: string;
  maskedMobileNo: string;
  otpDigits: string[];
  setOtpDigits: (digits: string[]) => void;
  onVerify: (e: FormEvent) => void;
  onResendOtp: () => void;
  resendTimer: number;
  rateLimitSeconds: number;
  isLoading: boolean;
  clearError: () => void;
  locale?: string;
}

export function OtpStepForm({
  mobileNo,
  maskedMobileNo,
  otpDigits,
  setOtpDigits,
  onVerify,
  onResendOtp,
  resendTimer,
  rateLimitSeconds,
  isLoading,
  clearError,
}: OtpStepFormProps) {
  const t = useTranslations('grievance');
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input box on render
  useEffect(() => {
    setTimeout(() => {
      digitRefs.current[0]?.focus();
    }, 150);
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    clearError();

    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        digitRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    clearError();

    const nextIndex = Math.min(pasted.length, 5);
    digitRefs.current[nextIndex]?.focus();
  };

  const isFullOtpEntered = otpDigits.join('').length === 6;

  return (
    <form onSubmit={onVerify} className="space-y-5">
      {/* Title & Sent Notice */}
      <div className="space-y-1">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {t('enterOtpTitle')}
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          {t('sentCodeNotice')}
        </p>
        <div className="pt-0.5 flex items-center gap-1.5 font-bold text-sm text-slate-900">
          <Phone className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-mono">{maskedMobileNo || `+91 ${mobileNo}`}</span>
        </div>
      </div>

      {/* 6 Individual Digit Input Boxes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 sm:gap-2.5">
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                digitRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className="clean-field-input w-12 h-13 sm:w-13 sm:h-14 text-center text-xl font-mono font-black rounded-2xl border-2 border-slate-200 bg-slate-50/80 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 outline-none focus:outline-none focus-visible:outline-none transition-all shadow-2xs"
              required
            />
          ))}
        </div>

        {/* Resend OTP Status */}
        <div className="flex items-center justify-center pt-1">
          {rateLimitSeconds > 0 ? (
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>
                {`${t('cooldownWait')} (${formatDigitalTimer(rateLimitSeconds)})`}
              </span>
            </span>
          ) : resendTimer > 0 ? (
            <span className="text-xs font-medium text-slate-500">
              <span>{t('resendOtpIn')}</span>
              <span className="font-mono font-bold text-emerald-700">{`${resendTimer}s`}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onResendOtp}
              disabled={isLoading || rateLimitSeconds > 0}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('resendOtp')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading || !isFullOtpEntered}
          className={`w-full h-12 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer ${
            isLoading || !isFullOtpEntered
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('verifying')}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('verifyAndSignIn')}</span>
            </>
          )}
        </button>
      </div>

      {/* Municipal Footer */}
      <p className="text-center text-[10.5px] text-slate-400 font-medium pt-1">
        {t('allRightsReserved', { year: new Date().getFullYear() })}
      </p>
    </form>
  );
}

export default OtpStepForm;
