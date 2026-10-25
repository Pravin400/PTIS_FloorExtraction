"use client";

import React from "react";
import { CheckCircle2, X } from "lucide-react";
import { ToggleSwitch, ValidationMessage } from "@/components/common";
import { cn } from "@/lib/utils/cn";

export interface StatusToggleSectionProps {
  isEdit: boolean;
  isActive: boolean;
  handleToggleStatus: (newVal?: boolean) => void;
  error?: string;
  label?: string;
  description?: string;
  t?: (key: string) => string;
  tCommon?: (key: string) => string;
}

export function StatusToggleSection({
  isEdit,
  isActive,
  handleToggleStatus,
  error,
  label = "Active Status",
  description = "Penalty Rule is currently",
  t,
  tCommon,
}: StatusToggleSectionProps): React.ReactElement | null {
  if (!isEdit) return null;

  const displayLabel = (t && t("form.status.label")) || label;
  const baseDesc = (t && t("form.status.description")) || description;
  const activeWord = (tCommon && tCommon("status.active")) || "Active";
  const inactiveWord = (tCommon && tCommon("status.inactive")) || "Inactive";
  const statusWord = isActive ? activeWord : inactiveWord;

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
      <div
        className={cn(
          "rounded-xl p-3 flex items-center justify-between",
          isActive ? "border border-blue-200 bg-[#F0F6FF]" : "border border-gray-200 bg-gray-50"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-full",
              isActive ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-900"
            )}
          >
            {isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
          </div>
          <div>
            <div className="font-medium text-gray-900">{displayLabel}</div>
            <div className="text-sm text-gray-500">
              {baseDesc} {statusWord}
            </div>
          </div>
        </div>

        <ToggleSwitch
          id="penalty-rule-is-active-toggle"
          checked={isActive}
          onChange={(newChecked) => handleToggleStatus(newChecked)}
          showPopup={false}
        />
      </div>

      {error ? <ValidationMessage message={error} visible={!!error} className="mt-2 text-center" /> : null}
    </div>
  );
}
