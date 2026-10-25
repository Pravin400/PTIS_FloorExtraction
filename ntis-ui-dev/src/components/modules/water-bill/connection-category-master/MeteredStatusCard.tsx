"use client";

import { Gauge } from "lucide-react";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { cn } from "@/lib/utils/cn";

export interface MeteredStatusCardProps {
  isMetered: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  onLabel: string;
  offLabel: string;
}

export function MeteredStatusCard({
  isMetered,
  onChange,
  title,
  onLabel,
  offLabel,
}: Readonly<MeteredStatusCardProps>) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-white p-4">
      <div
        className={cn(
          "rounded-xl p-3 flex items-center justify-between",
          isMetered ? "border border-blue-200 bg-[#F0F6FF]" : "border border-amber-200 bg-amber-50/50"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-full",
              isMetered ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
            )}
          >
            <Gauge size={18} />
          </div>
          <div>
            <div className="font-medium text-gray-900">{title}</div>
            <div className="text-sm text-gray-500">{isMetered ? onLabel : offLabel}</div>
          </div>
        </div>
        <ToggleSwitch checked={isMetered} onChange={onChange} showPopup={false} />
      </div>
    </div>
  );
}
