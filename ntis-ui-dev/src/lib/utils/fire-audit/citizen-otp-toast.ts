"use client";

import { toast } from "sonner";

/**
 * Displays a toast notification showing the OTP and a "Copy OTP" action button.
 */
export function showCitizenOtpToast(otp: string) {
  if (!otp) return;
  toast.success(`OTP: ${otp}`, {
    id: `citizen-otp-${otp}`,
    description: "Verification code received. Click Copy OTP to copy to clipboard.",
    duration: 15000,
    action: {
      label: "Copy OTP",
      onClick: () => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(otp);
        }
        toast.success("OTP copied to clipboard!");
      },
    },
  });
}
