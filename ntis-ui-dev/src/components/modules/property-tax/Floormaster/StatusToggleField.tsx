
"use client";

import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ToggleSwitch, ValidationMessage } from "@/components/common";

interface StatusToggleFieldProps {
  isActive: boolean;
  onChange: () => void;
  error?: string;
  labels: {
    title: string;  
    activeText: string;  
    inactiveText: string;
  };
  showPopup?: boolean;
}

export function StatusToggleField({
  isActive,
  onChange,
  error,
  labels,
  showPopup = false,
}: StatusToggleFieldProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
      <div
        className={cn(
          "rounded-xl p-3 flex items-center justify-between",
          isActive
            ? "border border-blue-200 bg-[#F0F6FF]"
            : "border border-gray-200 bg-gray-50"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-full",
              isActive
                ? "bg-green-100 text-green-600"
                : "bg-gray-200 text-gray-900"
            )}
          >
            {isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
          </div>

          <div>
            <div className="font-medium text-gray-900">{labels.title}</div>
            <div className="text-sm text-gray-500">
              {isActive ? labels.activeText : labels.inactiveText}
            </div>
          </div>
        </div>

        <ToggleSwitch
          checked={isActive}
          onChange={onChange}
          showPopup={showPopup}
        />
      </div>

      <ValidationMessage
        message={error}
        visible={!!error}
      />
    </div>
  );
}