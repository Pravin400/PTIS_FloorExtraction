"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Smartphone, CheckCircle2, UserPlus } from "lucide-react";
import { Input, Button, Label, ValidationMessage } from "@/components/common";
import { CitizenAuthCard } from "./CitizenAuthCard";
import { CitizenOtpStep } from "./CitizenOtpStep";
import { showCitizenOtpToast } from "@/lib/utils/fire-audit";
import {
  checkFireCitizenMobileAction,
  sendFireCitizenOtpAction,
  resendFireCitizenOtpAction,
  verifyFireCitizenOtpAction,
} from "@/lib/actions/fire-audit/citizen";

interface FireAuditCitizenLoginViewProps {
  locale?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

/**
 * Citizen Login View for Fire Audit:
 * Follows the UI design from Image 1 and Image 3:
 * - Mobile Number entry with "+91" prefix and Send OTP button
 * - Verifies if the mobile number is already registered in CitizenMaster
 * - If NOT registered: displays error and provides a direct "Create a new account" action
 * - If registered: dispatches OTP via CitizenAuth API and presents notification above card
 * - Seamless transition to 6-digit OTP verification view
 * - On verification, redirects to the Fire Audit Citizen Dashboard sidebar page
 */
export function FireAuditCitizenLoginView({
  locale = "en",
  onSuccess,
  onClose,
}: FireAuditCitizenLoginViewProps) {
  const t = useTranslations("fireAudit.citizen.auth");
  const router = useRouter();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
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
  const [isNotRegistered, setIsNotRegistered] = useState<boolean>(false);
  const [debugOtp, setDebugOtp] = useState<string | undefined>(undefined);
  const [fillValue] = useState<string | undefined>(undefined);
  const [registeredName, setRegisteredName] = useState<string | undefined>(undefined);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);

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
    setIsNotRegistered(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cleanMobile.length !== 10) {
      setErrorMsg(t("errValidMobile"));
      setIsNotRegistered(false);
      return;
    }

    if (!/^[6-9]/.test(cleanMobile)) {
      setErrorMsg(t("errMobilePrefix"));
      setIsNotRegistered(false);
      return;
    }

    setIsSendingOtp(true);
    setErrorMsg(null);
    setIsNotRegistered(false);

    try {
      // 1. Check if the citizen is already registered in the database
      const checkRes = await checkFireCitizenMobileAction(cleanMobile);
      const exists = checkRes.success && checkRes.data && (checkRes.data.id || checkRes.data.name);

      if (!exists) {
        setIsSendingOtp(false);
        setIsNotRegistered(true);
        setErrorMsg(t("errNotRegistered"));
        return;
      }

      const citizenName = checkRes.data?.name;
      setRegisteredName(citizenName);

      // 2. Mobile is registered -> Send Login OTP
      const sendRes = await sendFireCitizenOtpAction({
        mobileNo: cleanMobile,
        name: citizenName,
        purpose: "LOGIN",
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
    setLoginSuccess(true);
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
      {loginSuccess ? (
        <div className="py-8 text-center animate-in fade-in duration-300">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[#16324F]">{t("signedInSuccessTitle")}</h2>
          <p className="mt-2 text-sm text-[#64748B]">
            {t("signedInSuccessDesc")}
          </p>
        </div>
      ) : step === "otp" ? (
        <CitizenOtpStep
          mobileNumber={mobileNumber}
          mode="login"
          locale={locale}
          fillValue={fillValue}
          expectedOtp={debugOtp}
          onChangeMobile={() => setStep("mobile")}
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
              name: registeredName,
              purpose: "LOGIN",
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
              name: registeredName,
              purpose: "LOGIN",
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
              {t("signInTitle")}
            </h1>
            <p className="mx-auto mt-2 max-w-[320px] text-[13px] leading-relaxed text-[#64748B] sm:text-sm">
              {t("signInSubtitle")}
            </p>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSendOtp} className="mt-6 space-y-5">
            {/* Mobile Number Field using common Label and Input */}
            <div>
              <Label
                htmlFor="mobile-input"
                required
                className="text-xs sm:text-[13px] font-bold text-[#16324F] mb-1.5"
              >
                {t("mobileNumberLabel")}
              </Label>

              <div
                className={`flex h-11 sm:h-12 w-full items-center rounded-xl border bg-white shadow-xs transition-all overflow-hidden ${
                  errorMsg
                    ? "border-red-500 ring-2 ring-red-500/20"
                    : "border-[#38BDF8] ring-1 ring-[#38BDF8]/40 focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#0284C7]/20"
                }`}
              >
                {/* +91 Country Code prefix */}
                <div className="flex h-full select-none items-center justify-center border-r border-[#CBD5E1] bg-slate-50 px-3.5 text-sm font-bold text-[#16324F]">
                  +91
                </div>

                {/* Naked Input from common */}
                <Input
                  id="mobile-input"
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

              {/* Validation Message */}
              <ValidationMessage
                message={errorMsg || undefined}
                visible={!!errorMsg}
                type="error"
                className="mt-2"
              />

              {/* Unregistered helper callout */}
              {isNotRegistered && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 p-3 flex items-center">
                  <Link
                    href={`/${locale}/fire-audit/register?mobile=${cleanMobile}`}
                    className="inline-flex items-center gap-2 font-bold text-[#DC2626] hover:underline text-xs sm:text-sm"
                  >
                    <UserPlus className="h-4 w-4 text-[#DC2626]" />
                    <span>{t("createAccountNowLink")}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Send OTP Button */}
            <Button
              type="submit"
              variant="danger"
              size="lg"
              isLoading={isSendingOtp}
              icon={Smartphone}
              className="w-full rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold cursor-pointer shadow-md transition-all active:scale-[0.99]"
            >
              {t("btnSendOtp")}
            </Button>

            {/* Footer Link Divider */}
            <div className="flex items-center gap-3 pt-3">
              <div className="h-px flex-1 bg-[#E2E8F0]" />
              <p className="text-xs text-[#64748B] text-center">
                {t("newCitizenPrompt")}{" "}
                <Link
                  href={`/${locale}/fire-audit/register${cleanMobile.length === 10 ? `?mobile=${cleanMobile}` : ""}`}
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  {t("createAccountLink")}
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
