"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Smartphone, Loader2, CheckCircle2, LogIn } from "lucide-react";
import { Input } from "@/components/common";
import { CitizenAuthCard } from "./CitizenAuthCard";
import { CitizenOtpStep } from "./CitizenOtpStep";
import { showCitizenOtpToast } from "@/lib/utils/fire-audit";
import {
  checkFireCitizenMobileAction,
  sendFireCitizenOtpAction,
  resendFireCitizenOtpAction,
  verifyFireCitizenOtpAction,
} from "@/lib/actions/fire-audit/citizen";

interface FireAuditCitizenRegisterViewProps {
  locale?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

/**
 * Citizen Registration View for Fire Audit:
 * Follows the UI design from Image 2:
 * - Full Name *
 * - Mobile Number * with "+91" prefix
 * - Red "Send OTP" button
 * - Pre-flight check to verify if mobile is already registered
 * - Notification of generated OTP displayed ABOVE the registration card with Copy OTP option
 * - Seamless transition to 6-digit OTP verification view
 * - Auto-inserts citizen into CitizenMaster on verification and redirects to sidebar dashboard
 */
export function FireAuditCitizenRegisterView({
  locale = "en",
  onSuccess,
  onClose,
}: FireAuditCitizenRegisterViewProps) {
  const t = useTranslations("fireAudit.citizen.auth");
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [fullName, setFullName] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlMobile = params.get("mobile");
      if (urlMobile) {
        return urlMobile.replace(/\D/g, "").slice(0, 10);
      }
    }
    return "";
  });
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState<boolean>(false);
  const [debugOtp, setDebugOtp] = useState<string | undefined>(undefined);
  const [fillValue] = useState<string | undefined>(undefined);
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);

  const cleanMobile = mobileNumber.replace(/\D/g, "");

  // Clean up error parameter from URL if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("error")) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  const handleMobileChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(digitsOnly);
    setErrorMsg(null);
    setIsAlreadyRegistered(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg(t("errFullName"));
      setIsAlreadyRegistered(false);
      return;
    }

    if (cleanMobile.length !== 10) {
      setErrorMsg(t("errValidMobile"));
      setIsAlreadyRegistered(false);
      return;
    }

    if (!/^[6-9]/.test(cleanMobile)) {
      setErrorMsg(t("errMobilePrefix"));
      setIsAlreadyRegistered(false);
      return;
    }

    setIsSendingOtp(true);
    setErrorMsg(null);
    setIsAlreadyRegistered(false);

    try {
      // 1. Check if user already exists
      const checkRes = await checkFireCitizenMobileAction(cleanMobile);
      const exists = checkRes.success && checkRes.data && (checkRes.data.id || checkRes.data.name);

      if (exists) {
        setIsSendingOtp(false);
        setIsAlreadyRegistered(true);
        setErrorMsg(t("errAlreadyRegistered"));
        return;
      }

      // 2. Dispatch registration OTP via SMS/challenge
      const sendRes = await sendFireCitizenOtpAction({
        mobileNo: cleanMobile,
        name: fullName.trim(),
        purpose: "REGISTER",
        moduleCode: "FIRE_AUDIT",
      });

      setIsSendingOtp(false);

      if (sendRes.success) {
        if (sendRes.data?.debugOtp) {
          setDebugOtp(sendRes.data.debugOtp);
          showCitizenOtpToast(sendRes.data.debugOtp);
        }
        setStep("otp");
      } else {
        setErrorMsg(sendRes.message || t("errOtpSendFailed"));
      }
    } catch (err: unknown) {
      setIsSendingOtp(false);
      setErrorMsg((err as Error)?.message || t("errGenericSend"));
    }
  };

  const handleVerifySuccess = () => {
    // Set citizen session cookie valid across the site
    document.cookie = "fire_audit_citizen_session=true; path=/; max-age=86400; SameSite=Lax";
    setRegisterSuccess(true);
    setTimeout(() => {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/${locale}/fire-audit/citizen`);
        router.refresh();
      }
    }, 800);
  };

  return (
    <CitizenAuthCard
      locale={locale}
      onClose={onClose}
    >
      {registerSuccess ? (
        <div className="py-8 text-center animate-in fade-in duration-300">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[#16324F]">{t("registeredSuccessTitle")}</h2>
          <p className="mt-2 text-sm text-[#64748B]">
            {t("registeredSuccessDesc")}
          </p>
        </div>
      ) : step === "otp" ? (
        <CitizenOtpStep
          mobileNumber={mobileNumber}
          mode="register"
          locale={locale}
          fillValue={fillValue}
          expectedOtp={debugOtp}
          onChangeMobile={() => setStep("form")}
          onVerifySuccess={handleVerifySuccess}
          onVerifyOtp={async (otp) => {
            // Guard: prevent calling backend with wrong OTP if debugOtp is known
            if (debugOtp && otp.trim() !== debugOtp.trim()) {
              return {
                success: false,
                message: t("errOtpInvalid"),
              };
            }
            const res = await verifyFireCitizenOtpAction({
              mobileNo: cleanMobile,
              otp,
              name: fullName.trim(),
              purpose: "REGISTER",
              moduleCode: "FIRE_AUDIT",
            });
            const errMsg = res.error || res.message;
            return {
              success: res.success,
              message: res.success ? undefined : (errMsg || t("errOtpInvalidRetry")),
            };
          }}
          onResendOtp={async () => {
            const res = await resendFireCitizenOtpAction({
              mobileNo: cleanMobile,
              name: fullName.trim(),
              purpose: "REGISTER",
              moduleCode: "FIRE_AUDIT",
            });
            if (res.success && res.data?.debugOtp) {
              setDebugOtp(res.data.debugOtp);
              showCitizenOtpToast(res.data.debugOtp);
            }
            return {
              success: res.success,
              message: res.message || res.error,
              debugOtp: res.data?.debugOtp,
            };
          }}
        />
      ) : (
        <div>
          {/* Title & Subtitle */}
          <div className="text-center pt-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#16324F] sm:text-[26px]">
              {t("registerTitle")}
            </h1>
            <p className="mx-auto mt-2 max-w-[320px] text-[13px] leading-relaxed text-[#64748B] sm:text-sm">
              {t("registerSubtitle")}
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
            {/* Full Name Field */}
            <div>
              <label
                htmlFor="name-input"
                className="block text-xs sm:text-[13px] font-bold text-[#16324F] mb-1.5"
              >
                {t("fullNameLabel")} <span className="text-[#DC2626]">*</span>
              </label>
              <div className="flex h-11 sm:h-12 w-full items-center rounded-xl border border-[#38BDF8] ring-1 ring-[#38BDF8]/40 bg-white px-3.5 shadow-xs transition-all focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#0284C7]/20">
                <Input
                  id="name-input"
                  naked
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrorMsg(null);
                    setIsAlreadyRegistered(false);
                  }}
                  placeholder={t("fullNamePlaceholder")}
                  className="h-full w-full bg-transparent text-sm text-[#16324F] placeholder:text-[#94A3B8] placeholder:font-normal outline-none border-none ring-0 focus:ring-0 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Mobile Number Field */}
            <div>
              <label
                htmlFor="register-mobile-input"
                className="block text-xs sm:text-[13px] font-bold text-[#16324F] mb-1.5"
              >
                {t("mobileNumberLabel")} <span className="text-[#DC2626]">*</span>
              </label>

              <div className="flex h-11 sm:h-12 w-full items-center rounded-xl border border-[#CBD5E1] bg-white shadow-xs transition-all overflow-hidden focus-within:border-[#38BDF8] focus-within:ring-1 focus-within:ring-[#38BDF8]/40">
                {/* +91 Country Code prefix */}
                <div className="flex h-full select-none items-center justify-center border-r border-[#CBD5E1] px-3.5 text-sm font-bold text-[#16324F]">
                  +91
                </div>

                {/* Naked Input */}
                <Input
                  id="register-mobile-input"
                  naked
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder={t("mobileNumberPlaceholder")}
                  className="h-full w-full bg-transparent px-3 text-sm text-[#16324F] placeholder:text-[#94A3B8] placeholder:font-normal outline-none border-none ring-0 focus:ring-0 focus:outline-none"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-red-600 animate-in fade-in duration-150">
                {errorMsg}
              </p>
            )}

            {/* Already registered callout banner */}
            {isAlreadyRegistered && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-3 flex items-center">
                <Link
                  href={`/${locale}/fire-audit/login?mobile=${cleanMobile}`}
                  className="inline-flex items-center gap-2 font-bold text-[#2563EB] hover:underline text-xs sm:text-sm"
                >
                  <LogIn className="h-4 w-4 text-[#2563EB]" />
                  <span>{t("signInNumberLink")}</span>
                </Link>
              </div>
            )}

            {/* Send OTP Button */}
            <button
              type="submit"
              disabled={isSendingOtp}
              className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-4 text-sm sm:text-base font-semibold text-white shadow-xs transition-all hover:bg-[#B91C1C] active:bg-[#991B1B] disabled:opacity-70 cursor-pointer pt-1"
            >
              {isSendingOtp ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t("btnSendingOtp")}</span>
                </>
              ) : (
                <>
                  <Smartphone className="h-5 w-5" aria-hidden="true" />
                  <span>{t("btnSendOtp")}</span>
                </>
              )}
            </button>

            {/* Footer Link Divider */}
            <div className="flex items-center gap-3 pt-3">
              <div className="h-px flex-1 bg-[#E2E8F0]" />
              <p className="text-xs text-[#64748B] text-center">
                {t("alreadyRegisteredPrompt")}{" "}
                <Link
                  href={`/${locale}/fire-audit/login${cleanMobile.length === 10 ? `?mobile=${cleanMobile}` : ""}`}
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  {t("signInMobileLink")}
                </Link>
              </p>
              <div className="h-px flex-1 bg-[#E2E8F0]" />
            </div>
          </form>
        </div>
      )}
    </CitizenAuthCard>
  );
}
