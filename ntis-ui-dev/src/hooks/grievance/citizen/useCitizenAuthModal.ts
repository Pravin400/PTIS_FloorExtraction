'use client';

/**
 * Hook for Citizen Auth Modal state, actions, and API orchestration
 * Path: src/hooks/grievance/citizen/useCitizenAuthModal.ts
 * Strictly under 200 lines.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  sendCitizenOtpAction, resendCitizenOtpAction, verifyCitizenOtpAction, checkCitizenByMobileAction,
} from '@/lib/actions/grievance/citizen/citizen-auth.actions';
import { parseRateLimitInfo, formatHumanDuration } from '@/lib/utils/grievance/citizen-auth-helpers';
import {
  saveCitizenAuthSession, savePendingCitizenOtp, getPendingCitizenOtp, clearPendingCitizenOtp,
  type UseCitizenAuthModalProps,
} from '@/lib/services/grievance/citizen-auth-session.service';
import { useAuthTimers } from './useAuthTimers';

export function useCitizenAuthModal({
  isOpen, onClose, onVerified, initialMobileNo = '', initialName = '',
  purpose = 'LOGIN', moduleCode = 'GRV', referenceId,
}: UseCitizenAuthModalProps) {
  const t = useTranslations('grievance');

  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [mobileNo, setMobileNo] = useState('');
  const [name, setName] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [maskedMobileNo, setMaskedMobileNo] = useState('');
  const [isRegisteredCitizen, setIsRegisteredCitizen] = useState<boolean | null>(null);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [existingCitizenName, setExistingCitizenName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasInvalidOtpAttempt, setHasInvalidOtpAttempt] = useState(false);

  const {
    resendTimer, setResendTimer, rateLimitSeconds, initialTotalSeconds, setCooldown, resetCooldown,
  } = useAuthTimers(() => setErrorMsg(null));

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const pending = !hasInvalidOtpAttempt ? getPendingCitizenOtp() : null;
      if (pending?.mobileNo) {
        setMobileNo(pending.mobileNo);
        setMaskedMobileNo(pending.maskedMobileNo || `+91 ******${pending.mobileNo.slice(-4)}`);
        if (pending.name) setName(pending.name);
        setStep('otp'); setErrorMsg(null);
      } else {
        setStep('input');
        setMobileNo(initialMobileNo.replace(/\D/g, '').slice(-10));
        setName(initialName || '');
        setOtpDigits(['', '', '', '', '', '']);
        setErrorMsg(null);
        setIsRegisteredCitizen(null); setExistingCitizenName(null); setHasInvalidOtpAttempt(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, initialMobileNo, initialName, hasInvalidOtpAttempt]);

  const checkMobileRegistration = useCallback(async (num: string) => {
    const cleaned = num.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) return;
    setIsCheckingMobile(true);
    try {
      const res = await checkCitizenByMobileAction(cleaned);
      if (res.success && res.data?.id) {
        setIsRegisteredCitizen(true);
        if (res.data.name) {
          setExistingCitizenName(res.data.name);
          setName((prev) => prev || res.data!.name);
        }
      } else setIsRegisteredCitizen(false);
    } catch {
      setIsRegisteredCitizen(false);
    } finally {
      setIsCheckingMobile(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || mobileNo.length !== 10) return;
    const timer = setTimeout(() => { void checkMobileRegistration(mobileNo); }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, mobileNo, checkMobileRegistration]);

  const handleMobileChange = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setMobileNo(cleaned);
    setErrorMsg(null);
    if (rateLimitSeconds > 0) resetCooldown();
    if (cleaned.length === 10) checkMobileRegistration(cleaned);
    else { setIsRegisteredCitizen(null); setExistingCitizenName(null); }
  }, [rateLimitSeconds, resetCooldown, checkMobileRegistration]);

  const handleSendOtp = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = mobileNo.replace(/\D/g, '');
    if (cleaned.length !== 10) return setErrorMsg(t('mobileValidError'));
    if (rateLimitSeconds > 0) return;
    if (isRegisteredCitizen === false && !name.trim()) return setErrorMsg(t('enterNameRegister'));

    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await sendCitizenOtpAction({
        mobileNo: cleaned,
        name: name.trim() || existingCitizenName || '',
        purpose,
        moduleCode,
        referenceId,
      });
      if (res.success && res.data) {
        const masked = res.data.maskedMobileNo || `+91 ******${cleaned.slice(-4)}`;
        setMaskedMobileNo(masked);
        setResendTimer(res.data.resendInSeconds && res.data.resendInSeconds > 0 ? res.data.resendInSeconds : 30);
        resetCooldown();
        savePendingCitizenOtp({
          mobileNo: cleaned,
          maskedMobileNo: masked,
          name: name.trim() || existingCitizenName || undefined,
          purpose,
          moduleCode,
          referenceId,
          sentAt: Date.now(),
        });
        if (res.data.debugOtp) {
          const currentPurpose = res.data.purpose || purpose || 'LOGIN';
          const currentModule = res.data.moduleCode || moduleCode || 'GRV';
          const currentRef = res.data.referenceId || referenceId;
          const metaParts = [`Purpose: ${currentPurpose}`, `Module: ${currentModule}`];
          if (currentRef) metaParts.push(`Ref: ${currentRef}`);

          toast.info(t('devOtpNotice', { otp: res.data.debugOtp }), {
            description: metaParts.join(' • '),
            duration: 15000,
            action: {
              label: t('copyOtp'),
              onClick: () => {
                if (res.data?.debugOtp) {
                  navigator.clipboard.writeText(res.data.debugOtp);
                  toast.success(t('otpCopied'));
                }
              },
            },
          });
        }
        setStep('otp');
      } else {
        const parsed = parseRateLimitInfo(res.error || res.message || res);
        if (parsed.isRateLimited) {
          setCooldown(parsed.seconds);
          toast.warning(t('securityCooldownNotice', { duration: formatHumanDuration(parsed.seconds) }));
        } else toast.error(parsed.cleanMsg || t('otpSendFailed'));
        setErrorMsg(parsed.cleanMsg || t('otpSendFailed'));
      }
    } catch (err) {
      const parsed = parseRateLimitInfo((err as Error)?.message || err);
      if (parsed.isRateLimited) setCooldown(parsed.seconds);
      setErrorMsg(parsed.cleanMsg || t('otpSendFailed'));
    } finally { setIsLoading(false); }
  }, [mobileNo, name, rateLimitSeconds, isRegisteredCitizen, existingCitizenName, resetCooldown, setCooldown, setResendTimer, t, purpose, moduleCode, referenceId]);

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0 || rateLimitSeconds > 0 || isLoading) return;
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const pending = getPendingCitizenOtp();
      const activePurpose = pending?.purpose || purpose;
      const activeModuleCode = pending?.moduleCode || moduleCode;
      const activeRefId = pending?.referenceId || referenceId;

      const res = await resendCitizenOtpAction({
        mobileNo: mobileNo.replace(/\D/g, ''),
        name: name.trim() || existingCitizenName || '',
        purpose: activePurpose,
        moduleCode: activeModuleCode,
        referenceId: activeRefId,
      });
      if (res.success && res.data) {
        setResendTimer(res.data.resendInSeconds && res.data.resendInSeconds > 0 ? res.data.resendInSeconds : 30);
        if (res.data.debugOtp) {
          const currentPurpose = res.data.purpose || activePurpose || 'LOGIN';
          const currentModule = res.data.moduleCode || activeModuleCode || 'GRV';
          const currentRef = res.data.referenceId || activeRefId;
          const metaParts = [`Purpose: ${currentPurpose}`, `Module: ${currentModule}`];
          if (currentRef) metaParts.push(`Ref: ${currentRef}`);

          toast.info(t('devOtpNotice', { otp: res.data.debugOtp }), {
            description: metaParts.join(' • '),
            duration: 15000,
            action: {
              label: t('copyOtp'),
              onClick: () => {
                if (res.data?.debugOtp) {
                  navigator.clipboard.writeText(res.data.debugOtp);
                  toast.success(t('otpCopied'));
                }
              },
            },
          });
        }
      } else {
        const parsed = parseRateLimitInfo(res.error || res.message || res);
        if (parsed.isRateLimited) { setCooldown(parsed.seconds); setResendTimer(parsed.seconds); }
        setErrorMsg(parsed.cleanMsg || t('otpSendFailed'));
      }
    } catch (err) {
      const parsed = parseRateLimitInfo((err as Error)?.message || err);
      if (parsed.isRateLimited) { setCooldown(parsed.seconds); setResendTimer(parsed.seconds); }
      setErrorMsg(parsed.cleanMsg || t('otpSendFailed'));
    } finally { setIsLoading(false); }
  }, [mobileNo, name, existingCitizenName, resendTimer, rateLimitSeconds, isLoading, setCooldown, setResendTimer, t, purpose, moduleCode, referenceId]);

  const handleVerifyOtp = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const cleanedOtp = otpDigits.join('').trim();
    if (cleanedOtp.length !== 6) return setErrorMsg(t('otpInvalidError'));
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const pending = getPendingCitizenOtp();
      const activePurpose = pending?.purpose || purpose;
      const activeModuleCode = pending?.moduleCode || moduleCode;
      const activeRefId = pending?.referenceId || referenceId;

      const res = await verifyCitizenOtpAction({
        mobileNo: mobileNo.replace(/\D/g, ''),
        otp: cleanedOtp,
        name: name.trim() || existingCitizenName || '',
        purpose: activePurpose,
        moduleCode: activeModuleCode,
        referenceId: activeRefId,
      });
      if (res.success && res.data) {
        clearPendingCitizenOtp();
        setHasInvalidOtpAttempt(false);
        setStep('success');
        saveCitizenAuthSession(res.data);
        setTimeout(() => { onVerified(res.data!); onClose(); }, 600);
      } else {
        setHasInvalidOtpAttempt(true);
        const errText = res.message || res.error || t('otpInvalidError');
        setErrorMsg(errText);
        setOtpDigits(['', '', '', '', '', '']);
        if (/maximum|exceeded|expired|locked/i.test(errText)) clearPendingCitizenOtp();
      }
    } catch (err) {
      setHasInvalidOtpAttempt(true);
      setErrorMsg((err as Error).message || t('otpInvalidError'));
      setOtpDigits(['', '', '', '', '', '']);
    } finally { setIsLoading(false); }
  }, [mobileNo, otpDigits, name, existingCitizenName, t, onVerified, onClose, purpose, moduleCode, referenceId]);

  const handleCloseModal = useCallback(() => {
    if (hasInvalidOtpAttempt || errorMsg || step === 'otp') {
      clearPendingCitizenOtp(); setStep('input');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMsg(null); setHasInvalidOtpAttempt(false);
    }
    onClose();
  }, [hasInvalidOtpAttempt, errorMsg, step, onClose]);

  return {
    step, setStep, mobileNo, setMobileNo, name, setName, otpDigits, setOtpDigits, maskedMobileNo,
    isRegisteredCitizen, isCheckingMobile, existingCitizenName, isLoading, errorMsg, setErrorMsg,
    resendTimer, rateLimitSeconds, initialTotalSeconds, handleMobileChange, handleSendOtp,
    handleResendOtp, handleVerifyOtp, handleCloseModal, handleGoToOtp: () => setStep('otp'), t,
  };
}
