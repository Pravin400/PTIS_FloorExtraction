
'use client';

/**
 * Citizen Authentication Modal
 * Modern responsive dialog for Citizen Phone + OTP verification before grievance submission.
 * Path: src/components/modules/grievance/citizen/CitizenAuthModal.tsx
 */

import { ShieldCheck, ArrowLeft, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { VerifyOtpResponse } from '@/types/grievance/citizen-auth.types';
import { useCitizenAuthModal } from '@/hooks/grievance/citizen';
import { formatDigitalTimer } from '@/lib/utils/grievance/citizen-auth-helpers';
import { clearPendingCitizenOtp } from '@/lib/services/grievance/citizen-auth-session.service';
import { GrievanceModalShell } from '../shared/GrievanceModalShell';
import {
  MobileStepForm,
  OtpStepForm,
} from './auth';

export interface CitizenAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (authData: VerifyOtpResponse) => void;
  initialMobileNo?: string;
  initialName?: string;
  purpose?: string;
  moduleCode?: string;
  referenceId?: string;
}

export function CitizenAuthModal(props: CitizenAuthModalProps) {
  if (!props.isOpen) return null;
  return <CitizenAuthModalContent {...props} />;
}

function CitizenAuthModalContent(props: CitizenAuthModalProps) {
  const { isOpen } = props;

  const {
    step, setStep, mobileNo, setMobileNo, name, setName, otpDigits, setOtpDigits,
    maskedMobileNo, isRegisteredCitizen, isCheckingMobile, existingCitizenName,
    isLoading, errorMsg, setErrorMsg, resendTimer, rateLimitSeconds,
    handleMobileChange, handleSendOtp, handleResendOtp, handleVerifyOtp,
    handleCloseModal, handleGoToOtp, t,
  } = useCitizenAuthModal({
    ...props,
    onVerified: props.onVerified || (() => {}),
  });

  return (
    <GrievanceModalShell
      isOpen={isOpen}
      onClose={handleCloseModal}
      maxWidth="sm"
      zIndex="z-[200]"
      showDragHandle={true}
    >
      {/* Subtle decorative background gradient accent */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />

      {/* Modal Top Actions */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between z-10">
          {step === 'otp' ? (
            <button
              type="button"
              onClick={() => {
                clearPendingCitizenOtp();
                setOtpDigits(['', '', '', '', '', '']);
                setStep('input');
                setErrorMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100/80"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('changeNumber')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 leading-tight block">
                  {t('amcAuthority')}
                </span>
                <span className="text-[10.5px] font-semibold text-emerald-700 block">
                  {t('citizenCivicPortal')}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleCloseModal}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 pt-3 space-y-4 z-10">
          {/* Status Message / Rate-limit Banner */}
          {rateLimitSeconds > 0 ? (
            <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-medium flex items-start justify-between gap-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2 flex-1">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  {errorMsg || t('rateLimitBannerText')}
                </p>
              </div>
              <span className="font-mono font-bold text-amber-900 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded text-[11px] shrink-0 self-start">
                {formatDigitalTimer(rateLimitSeconds)}
              </span>
            </div>
          ) : errorMsg ? (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          ) : null}

          {step === 'input' && (
            <MobileStepForm
              mobileNo={mobileNo}
              setMobileNo={setMobileNo}
              name={name}
              setName={setName}
              isRegisteredCitizen={isRegisteredCitizen}
              isCheckingMobile={isCheckingMobile}
              existingCitizenName={existingCitizenName}
              rateLimitSeconds={rateLimitSeconds}
              isLoading={isLoading}
              onSubmit={handleSendOtp}
              onMobileChange={handleMobileChange}
              onGoToOtp={handleGoToOtp}
            />
          )}

          {step === 'otp' && (
            <OtpStepForm
              mobileNo={mobileNo}
              maskedMobileNo={maskedMobileNo}
              otpDigits={otpDigits}
              setOtpDigits={setOtpDigits}
              onVerify={handleVerifyOtp}
              onResendOtp={handleResendOtp}
              resendTimer={resendTimer}
              rateLimitSeconds={rateLimitSeconds}
              isLoading={isLoading}
              clearError={() => setErrorMsg(null)}
            />
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">{t('verificationSuccessful')}</h4>
              <p className="text-xs text-slate-500 font-medium">{t('submittingGrievanceNow')}</p>
            </div>
          )}
        </div>
    </GrievanceModalShell>
  );
}

export default CitizenAuthModal;
