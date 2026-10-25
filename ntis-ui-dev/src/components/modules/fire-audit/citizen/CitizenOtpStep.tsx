"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Input, Button, ValidationMessage } from "@/components/common";

export interface CitizenOtpStepProps {
  mobileNumber: string;
  mode?: "login" | "register";
  locale?: string;
  fillValue?: string;
  expectedOtp?: string;
  onChangeMobile: () => void;
  onVerifySuccess: () => void;
  onVerifyOtp?: (otp: string) => Promise<{ success: boolean; message?: string }>;
  onResendOtp?: () => Promise<{ success: boolean; message?: string; debugOtp?: string } | void> | void;
}

/**
 * 6-digit OTP verification view:
 * - Uses Input, Button, and ValidationMessage from @/components/common
 * - 6 individual OTP inputs with auto-focus, paste-across, and auto-advance
 * - Resend countdown timer
 * - Red "Verify & Sign In" action button
 */
export function CitizenOtpStep({
  mobileNumber,
  mode = "login",
  locale = "en",
  fillValue,
  expectedOtp,
  onChangeMobile,
  onVerifySuccess,
  onVerifyOtp,
  onResendOtp,
}: CitizenOtpStepProps) {
  const t = useTranslations("fireAudit.citizen.auth");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fillOtp = (code: string) => {
    const clean = code.replace(/\D/g, "").slice(0, 6);
    if (!clean) return;
    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < clean.length; i++) {
      newDigits[i] = clean[i] || "";
    }
    setDigits(newDigits);
    setErrorMsg(null);
    inputRefs.current[Math.min(clean.length, 5)]?.focus();
    setActiveIndex(Math.min(clean.length, 5));
  };

  // Listen to fillValue changes from the above-card banner
  useEffect(() => {
    if (fillValue) {
      const timer = setTimeout(() => {
        fillOtp(fillValue);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [fillValue]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus the first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const cleanChar = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance to next input
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    fillOtp(pasteData);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setDigits(["", "", "", "", "", ""]);
    setErrorMsg(null);
    inputRefs.current[0]?.focus();
    setActiveIndex(0);
    if (onResendOtp) {
      try {
        const res = await onResendOtp();
        if (res && !res.success) {
          setErrorMsg(res.message || t("errOtpResendFailed"));
        }
      } catch (err: unknown) {
        setErrorMsg((err as Error)?.message || t("errOtpResendFailed"));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("").trim();
    if (otp.length < 6) {
      setErrorMsg(t("errOtpIncomplete"));
      return;
    }

    // Client-side validation: if expectedOtp (from debugOtp) is known, validate locally
    // This shows the error on screen immediately and avoids sending invalid OTP to the backend,
    // which prevents the backend debugger from breaking on ValidationException or crashing!
    if (expectedOtp && otp !== expectedOtp.trim()) {
      setIsVerifying(false);
      const invalidMsg = t("errOtpInvalid");
      setErrorMsg(invalidMsg);
      toast.error(invalidMsg);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setActiveIndex(0);
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    if (onVerifyOtp) {
      try {
        const res = await onVerifyOtp(otp);
        setIsVerifying(false);
        if (res.success) {
          toast.success(t("otpVerifySuccess"));
          onVerifySuccess();
        } else {
          const failMsg = res.message || t("errOtpInvalidRetry");
          setErrorMsg(failMsg);
          toast.error(failMsg);
          setDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
          setActiveIndex(0);
        }
      } catch (err: unknown) {
        setIsVerifying(false);
        const failMsg = (err as Error)?.message || t("errOtpVerifyFailed");
        setErrorMsg(failMsg);
        toast.error(failMsg);
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setActiveIndex(0);
      }
    } else {
      setTimeout(() => {
        setIsVerifying(false);
        onVerifySuccess();
      }, 600);
    }
  };

  const isLogin = mode === "login";

  return (
    <div>
      {/* Title & Subtitle */}
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-[#16324F] sm:text-[26px]">
          {isLogin ? t("signInTitle") : t("registerTitle")}
        </h1>
        <p className="mx-auto mt-2 max-w-[320px] text-[13px] leading-relaxed text-[#64748B] sm:text-sm">
          {t("otpSubtitle", { mobileNumber })}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* 6 OTP Inputs using common Input component */}
        <div className="grid grid-cols-6 gap-2 sm:gap-2.5 pt-2">
          {digits.map((digit, idx) => {
            const isHighlighted = activeIndex === idx;
            return (
              <Input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                naked
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                onFocus={() => setActiveIndex(idx)}
                aria-label={t("digitAriaLabel", { index: idx + 1 })}
                className={`h-12 w-full rounded-xl border text-center text-lg font-bold sm:h-14 sm:text-xl transition-all outline-none ${
                  errorMsg
                    ? "border-red-500 bg-red-50/60 text-red-700 ring-2 ring-red-500/30"
                    : digit
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 font-extrabold"
                    : isHighlighted
                    ? "border-emerald-500 ring-2 ring-emerald-500/25 bg-white"
                    : "border-[#CBD5E1] bg-white text-[#16324F] hover:border-slate-400"
                }`}
              />
            );
          })}
        </div>

        {/* Common Validation Message */}
        <ValidationMessage
          id="otp-error-message"
          message={errorMsg || undefined}
          visible={!!errorMsg}
          type="error"
          className="mt-1"
        />

        {/* Action Row: Change mobile & Resend */}
        <div className="flex items-center justify-between pt-1 pb-1 text-xs sm:text-[13px]">
          <button
            type="button"
            onClick={onChangeMobile}
            className="font-medium text-[#2563EB] underline hover:text-[#1D4ED8] transition-colors cursor-pointer"
          >
            {t("changeMobile")}
          </button>

          {resendTimer > 0 ? (
            <span className="font-medium text-[#64748B]">
              {t("resendCountdown", { seconds: resendTimer })}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-semibold text-[#DC2626] hover:underline transition-colors cursor-pointer"
            >
              {t("btnResendOtp")}
            </button>
          )}
        </div>

        {/* Verify & Sign In Button using common Button component */}
        <Button
          type="submit"
          variant="danger"
          size="lg"
          isLoading={isVerifying}
          icon={CheckCircle2}
          className="w-full rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold cursor-pointer shadow-md transition-all active:scale-[0.99]"
        >
          {t("btnVerifySignIn")}
        </Button>

        {/* Footer Link Divider */}
        <div className="flex items-center gap-3 pt-4">
          <div className="h-px flex-1 bg-[#E2E8F0]" />
          <div className="text-xs text-[#64748B]">
            {isLogin ? (
              <span>
                {t("newCitizenPrompt")}{" "}
                <Link
                  href={`/${locale}/fire-audit/register`}
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  {t("createAccountLink")}
                </Link>
              </span>
            ) : (
              <span>
                {t("alreadyRegisteredPrompt")}{" "}
                <Link
                  href={`/${locale}/fire-audit/login`}
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  {t("signInMobileLink")}
                </Link>
              </span>
            )}
          </div>
          <div className="h-px flex-1 bg-[#E2E8F0]" />
        </div>
      </form>
    </div>
  );
}
