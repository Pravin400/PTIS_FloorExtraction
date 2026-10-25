'use client';

/**
 * Citizen Auth - Step 1: Mobile & Profile Form
 * Path: src/components/modules/grievance/citizen/auth/MobileStepForm.tsx
 */

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Phone, User as UserIcon, CheckCircle2, ArrowRight, Clock, Loader2, AlertCircle } from 'lucide-react';
import {
  formatDigitalTimer,
  validateMobile,
  validateName,
} from '@/lib/utils/grievance/citizen-auth-helpers';

export interface MobileStepFormProps {
  mobileNo: string;
  setMobileNo: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  isRegisteredCitizen: boolean | null;
  isCheckingMobile: boolean;
  existingCitizenName: string | null;
  rateLimitSeconds: number;
  isLoading: boolean;
  onSubmit: (e: FormEvent) => void;
  onMobileChange: (val: string) => void;
  onGoToOtp?: () => void;
  locale?: string;
}

function getFieldBorder(touched: boolean, hasError: boolean, isValid: boolean): string {
  if (touched && hasError) return 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500/10';
  if (touched && isValid) return 'border-emerald-400 focus-within:border-emerald-600 focus-within:ring-emerald-500/10';
  return 'border-slate-200 focus-within:border-emerald-600 focus-within:ring-emerald-500/10';
}

export function MobileStepForm({
  mobileNo,
  name,
  setName,
  isRegisteredCitizen,
  isCheckingMobile,
  existingCitizenName,
  rateLimitSeconds,
  isLoading,
  onSubmit,
  onMobileChange,
  onGoToOtp,
}: MobileStepFormProps) {
  const t = useTranslations('grievance');
  const [mobileTouched, setMobileTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const cleanMobile = mobileNo.replace(/\D/g, '');
  const mobileError = validateMobile(cleanMobile);
  const nameError = validateName(name);

  const isMobileValid = cleanMobile.length === 10 && !mobileError;
  const isNameRequired = isRegisteredCitizen === false;
  const isNameValid = !isNameRequired || (name.trim().length >= 2 && !nameError);

  const isSubmitDisabled = isLoading || rateLimitSeconds > 0 || !isMobileValid || !isNameValid;

  const handleMobileChange = (val: string) => {
    onMobileChange(val);
    if (!mobileTouched) setMobileTouched(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!nameTouched) setNameTouched(true);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Title & Subtitle */}
      <div className="space-y-1">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {isRegisteredCitizen === true
            ? t('welcomeBack')
            : isRegisteredCitizen === false
              ? t('citizenRegistration')
              : t('citizenLogin')}
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          {t('enterMobileSubtitle')}
        </p>
      </div>

      {/* Mobile Input */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">
            {t('mobileNumber')}
            <span className="text-red-500 ml-0.5">{'*'}</span>
          </label>
          {isCheckingMobile && (
            <span className="text-[10.5px] text-slate-400 flex items-center gap-1 font-medium">
              <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
              <span>{t('checkingProfile')}</span>
            </span>
          )}
        </div>

        <div className={`relative flex items-center rounded-2xl border bg-slate-50/70 focus-within:bg-white focus-within:ring-4 transition-all overflow-hidden shadow-2xs ${getFieldBorder(mobileTouched, !!mobileError, isMobileValid)}`}>
          <div className="pl-3.5 pr-2.5 flex items-center gap-1.5 text-slate-400 select-none border-r border-slate-200/80 my-2">
            <Phone className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 font-mono">{'+91'}</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            value={mobileNo}
            onChange={(e) => handleMobileChange(e.target.value)}
            onBlur={() => setMobileTouched(true)}
            placeholder={t('mobileTenDigitLabel')}
            className="clean-field-input w-full h-11 px-3 bg-transparent text-sm font-mono tracking-wider font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:text-xs placeholder:font-normal border-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none"
            required
          />
          {mobileTouched && isMobileValid && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" />
          )}
        </div>

        {mobileTouched && mobileError && (
          <p className="flex items-center gap-1 text-[11px] font-medium text-red-600 animate-in fade-in duration-150">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{mobileError}</span>
          </p>
        )}
        {mobileTouched && !mobileError && cleanMobile.length > 0 && cleanMobile.length < 10 && (
          <p className="text-[11px] font-medium text-slate-400">
            {`${10 - cleanMobile.length} more digit${10 - cleanMobile.length === 1 ? '' : 's'} needed`}
          </p>
        )}
      </div>

      {/* Registered Citizen Chip */}
      {isRegisteredCitizen === true && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('registeredCitizen')}</span>
          </div>
          {(existingCitizenName || name) ? (
            <span className="font-bold text-[11px] text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
              {existingCitizenName || name}
            </span>
          ) : null}
        </div>
      )}

      {/* New Citizen Name Prompt */}
      {isRegisteredCitizen === false && (
        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              {t('yourFullName')}
              <span className="text-red-500 ml-0.5">{'*'}</span>
            </label>
            <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {t('newCitizen')}
            </span>
          </div>
          <div className={`relative flex items-center rounded-2xl border bg-slate-50/70 focus-within:bg-white focus-within:ring-4 transition-all overflow-hidden shadow-2xs ${getFieldBorder(nameTouched, !!nameError, isNameValid)}`}>
            <div className="pl-3.5 pr-2.5 flex items-center text-slate-400 select-none border-r border-slate-200/80 my-2">
              <UserIcon className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setNameTouched(true)}
              placeholder={t('enterFullNamePrompt')}
              className="clean-field-input w-full h-11 px-3 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal border-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none"
              required
            />
            {nameTouched && !nameError && name.trim().length >= 2 && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" />
            )}
          </div>

          {nameTouched && nameError && (
            <p className="flex items-center gap-1 text-[11px] font-medium text-red-600 animate-in fade-in duration-150">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{nameError}</span>
            </p>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`w-full h-12 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${isSubmitDisabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-[0.99] cursor-pointer'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('verifying')}</span>
            </>
          ) : rateLimitSeconds > 0 ? (
            <>
              <Clock className="w-4 h-4 text-amber-200 animate-pulse" />
              <span>
                {`${t('cooldown')} (${formatDigitalTimer(rateLimitSeconds)})`}
              </span>
            </>
          ) : (
            <>
              <span>
                {isRegisteredCitizen === false
                  ? t('registerAndSendOtp')
                  : t('sendOtp')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Direct link to enter OTP if citizen already received it */}
      {isMobileValid && onGoToOtp && (
        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={onGoToOtp}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer inline-flex items-center gap-1.5 transition-colors py-1 px-2 rounded-lg hover:bg-emerald-50"
          >
            <span>{t('alreadyHaveOtp')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </form>
  );
}

export default MobileStepForm;

