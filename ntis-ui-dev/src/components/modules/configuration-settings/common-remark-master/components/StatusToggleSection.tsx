"use client";

import { CheckCircle2, X } from "lucide-react";
import { ToggleSwitch } from "@/components/common";
import { cn } from "@/lib/utils/cn";

interface StatusToggleSectionProps {
  isEdit: boolean;
  isActive: boolean;
  handleToggleStatus: () => void;
  t: (key: string) => string;
}

export function StatusToggleSection({
  isEdit,
  isActive,
  handleToggleStatus,
  t,
}: StatusToggleSectionProps) {
  if (!isEdit) return null;

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4 space-y-4">
      <div
        className={cn(
          "rounded-xl p-2 flex items-center justify-between transition-colors",
          isActive ? "border border-blue-200 bg-[#F0F6FF]" : "border border-gray-200 bg-gray-50"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              isActive ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"
            )}
          >
            {isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
          </div>

          <div>
            <div className={cn("font-medium", isActive ? "text-[#1E3A8A]" : "text-gray-700")}>
              {t("form.activeStatusTitle")}
            </div>
            <div className={cn("text-sm", isActive ? "text-gray-500" : "text-gray-400")}>
              {isActive ? t("form.activeStatusOn") : t("form.activeStatusOff")}
            </div>
          </div>
        </div>

        <ToggleSwitch checked={isActive} onChange={handleToggleStatus} showPopup={false} />
      </div>
    </div>
  );
}
