"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Card } from "@/components/common";

interface CitizenAuthCardProps {
  children: React.ReactNode;
  aboveCardContent?: React.ReactNode;
  locale?: string;
  onClose?: () => void;
}

/**
 * Centered card wrapper for Fire Audit Citizen Authentication (Login, Register, OTP).
 * Uses common Card component from @/components/common.
 */
export function CitizenAuthCard({
  children,
  aboveCardContent,
  locale = "en",
  onClose,
}: CitizenAuthCardProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push(`/${locale}/fire-audit/login`);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-4 py-6 sm:p-6 lg:py-10">
      {aboveCardContent && (
        <div className="w-full max-w-[440px] mb-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
          {aboveCardContent}
        </div>
      )}
      <Card
        variant="elevated"
        padding="none"
        className="relative w-full max-w-[440px] rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-2xl backdrop-blur-md sm:p-8 transition-all"
      >
        {/* Top Right Close Button - shown only when onClose handler is provided */}
        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute right-5 top-5 rounded-lg p-1 text-[#94A3B8] transition-colors hover:bg-slate-100 hover:text-[#475569] focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        {children}
      </Card>
    </div>
  );
}
