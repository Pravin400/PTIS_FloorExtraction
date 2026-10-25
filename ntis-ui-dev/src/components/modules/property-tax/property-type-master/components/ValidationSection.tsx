"use client";

import { AlertCircle } from "lucide-react";

interface ValidationSectionProps {
  tCommon: (key: string) => string;
}

export const ValidationSection = ({ tCommon }: ValidationSectionProps) => {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 mt-4 text-sm text-orange-700">
      <AlertCircle size={16} />
      <span>{tCommon("note.mandatory")}</span>
    </div>
  );
};
