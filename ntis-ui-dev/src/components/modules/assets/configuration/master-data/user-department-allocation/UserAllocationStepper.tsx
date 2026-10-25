"use client";

import { memo } from "react";
import { Building2, MapPin, GitBranch } from "lucide-react";
import { Card, Badge, Button } from "@/components/common";

interface UserAllocationStepperProps {
  currentStep: 1 | 2 | 3;
  handleBackToDepartments: () => void;
  handleProceedToZones: () => void;
  handleProceedToStages: () => void;
  selectedDeptIds: number[];
  totalSelectedWardsCount: number;
  selectedStageCount: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const UserAllocationStepper = memo(function UserAllocationStepper({
  currentStep,
  handleBackToDepartments,
  handleProceedToZones,
  handleProceedToStages,
  selectedDeptIds,
  totalSelectedWardsCount,
  selectedStageCount,
  t,
}: UserAllocationStepperProps) {
  return (
    <Card
      variant="default"
      padding="none"
      className="bg-white rounded-xl border border-slate-200/90 p-1.5 shadow-2xs mt-1"
    >
      <div className="grid grid-cols-3 gap-1.5">
        {/* TAB 1: Department */}
        <Button
          type="button"
          variant="ghost"
          onClick={handleBackToDepartments}
          className={`!w-full !flex !items-center !justify-center !py-2 sm:!py-2.5 !px-1.5 sm:!px-3 !rounded-lg !text-xs sm:!text-sm !font-semibold transition-all cursor-pointer !min-w-0 !h-auto !border-transparent focus:!ring-0 focus:!ring-offset-0 focus:!outline-none [&>span]:inline-flex [&>span]:items-center [&>span]:justify-center [&>span]:gap-1 sm:[&>span]:gap-2 [&>span]:w-full [&>span]:min-w-0 ${
            currentStep === 1
              ? "!bg-[#0f3d8a] !text-white shadow-2xs ring-1 ring-[#0f3d8a] hover:!bg-[#0f3d8a]"
              : "!bg-slate-50 !text-slate-600 hover:!text-slate-900 hover:!bg-slate-100"
          }`}
        >
          <Building2
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
              currentStep === 1 ? "text-white" : "text-[#0f3d8a]"
            }`}
          />
          <span className="inline-flex items-center truncate">
            <span className="truncate">{t("drawer.step1Title")}</span>
            <span
              className={`${
                currentStep === 1 ? "text-red-300" : "text-red-500"
              } font-bold ml-0.5 leading-none shrink-0`}
            >
              *
            </span>
          </span>
          {selectedDeptIds.length > 0 && (
            <Badge
              variant={currentStep === 1 ? "secondary" : "default"}
              size="sm"
              className={`shrink-0 ml-0.5 sm:ml-1 !px-1.5 !py-0.5 !text-[10px] !font-bold ${
                currentStep === 1 ? "!bg-white/20 !text-white !border-transparent" : "!bg-blue-100 !text-[#0f3d8a] !border-transparent"
              }`}
            >
              {selectedDeptIds.length}
            </Badge>
          )}
        </Button>

        {/* TAB 2: Zone & Ward */}
        <Button
          type="button"
          variant="ghost"
          onClick={handleProceedToZones}
          className={`!w-full !flex !items-center !justify-center !py-2 sm:!py-2.5 !px-1.5 sm:!px-3 !rounded-lg !text-xs sm:!text-sm !font-semibold transition-all cursor-pointer !min-w-0 !h-auto !border-transparent focus:!ring-0 focus:!ring-offset-0 focus:!outline-none [&>span]:inline-flex [&>span]:items-center [&>span]:justify-center [&>span]:gap-1 sm:[&>span]:gap-2 [&>span]:w-full [&>span]:min-w-0 ${
            currentStep === 2
              ? "!bg-[#0f3d8a] !text-white shadow-2xs ring-1 ring-[#0f3d8a] hover:!bg-[#0f3d8a]"
              : "!bg-slate-50 !text-slate-600 hover:!text-slate-900 hover:!bg-slate-100"
          }`}
        >
          <MapPin
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
              currentStep === 2 ? "text-white" : "text-[#0f3d8a]"
            }`}
          />
          <span className="truncate">{t("drawer.step2Title")}</span>
          {totalSelectedWardsCount > 0 && (
            <Badge
              variant={currentStep === 2 ? "secondary" : "default"}
              size="sm"
              className={`shrink-0 ml-0.5 sm:ml-1 !px-1.5 !py-0.5 !text-[10px] !font-bold ${
                currentStep === 2 ? "!bg-white/20 !text-white !border-transparent" : "!bg-blue-100 !text-[#0f3d8a] !border-transparent"
              }`}
            >
              {totalSelectedWardsCount}
            </Badge>
          )}
        </Button>

        {/* TAB 3: Grievance Stage Access */}
        <Button
          type="button"
          variant="ghost"
          onClick={handleProceedToStages}
          className={`!w-full !flex !items-center !justify-center !py-2 sm:!py-2.5 !px-1.5 sm:!px-3 !rounded-lg !text-xs sm:!text-sm !font-semibold transition-all cursor-pointer !min-w-0 !h-auto !border-transparent focus:!ring-0 focus:!ring-offset-0 focus:!outline-none [&>span]:inline-flex [&>span]:items-center [&>span]:justify-center [&>span]:gap-1 sm:[&>span]:gap-2 [&>span]:w-full [&>span]:min-w-0 ${
            currentStep === 3
              ? "!bg-[#0f3d8a] !text-white shadow-2xs ring-1 ring-[#0f3d8a] hover:!bg-[#0f3d8a]"
              : "!bg-slate-50 !text-slate-600 hover:!text-slate-900 hover:!bg-slate-100"
          }`}
        >
          <GitBranch
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
              currentStep === 3 ? "text-white" : "text-[#0f3d8a]"
            }`}
          />
          <span className="truncate">{t("drawer.step3Title")}</span>
          {selectedStageCount > 0 && (
            <Badge
              variant={currentStep === 3 ? "secondary" : "default"}
              size="sm"
              className={`shrink-0 ml-0.5 sm:ml-1 !px-1.5 !py-0.5 !text-[10px] !font-bold ${
                currentStep === 3 ? "!bg-white/20 !text-white !border-transparent" : "!bg-blue-100 !text-[#0f3d8a] !border-transparent"
              }`}
            >
              {selectedStageCount}
            </Badge>
          )}
        </Button>
      </div>
    </Card>
  );
});
