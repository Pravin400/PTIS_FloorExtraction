import React from "react";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export const InlineError: React.FC<{ message: string }> = ({ message }) => {
  const t = useTranslations("quickDataEntry");
  const displayMessage = message && message.includes(".") ? t(message as unknown as Parameters<typeof t>[0]) : message;

  return (
    <div className="flex items-start gap-2 mt-1 px-2 py-1.5 bg-red-50 border border-red-200 rounded animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle className="w-4 h-4 text-[#D32F2F] flex-shrink-0 mt-0.5" />
      <span className="text-xs text-[#D32F2F] leading-tight">{displayMessage}</span>
    </div>
  );
};
