"use client";

import { Briefcase, Settings2 } from "lucide-react";
import { DepartmentCardProps } from "@/types/departmentActivation.types";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { Button } from "@/components/common/ActionButton";
import { Badge } from "@/components/common/Badge";
import { useTranslations, useLocale } from "next-intl";

export function DepartmentCard({
  department,
  onToggle,
  onConfigure,
  configureButtonText,
}: DepartmentCardProps) {
  const t = useTranslations('departmentActivation');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const departmentName =
    locale === 'en' || !department.departmentNameLocal?.trim()
      ? department.departmentName
      : department.departmentNameLocal.trim();

  return (
    <div
      className={`relative p-4 rounded-xl border-2 transition-all ${
        department.isActive
          ? "bg-white dark:bg-white border-blue-100 dark:border-blue-100 shadow-sm hover:border-blue-200 dark:hover:border-blue-200"
          : "bg-slate-50 dark:bg-slate-50 border-gray-200 dark:border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${department.isActive ? "bg-blue-50 dark:bg-blue-50" : "bg-gray-100 dark:bg-gray-100"}`}>
          <Briefcase className={`w-5 h-5 ${department.isActive ? "text-blue-600 dark:text-blue-600" : "text-gray-400 dark:text-gray-400"}`} />
        </div>
        <ToggleSwitch
          checked={department.isActive}
          onChange={() => onToggle(department.departmentId, department)}
          showPopup={false}
          activeLabel={tCommon('status.active')}
          inactiveLabel={tCommon('status.inactive')}
        />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-bold truncate ${department.isActive ? "text-blue-900 dark:text-blue-900" : "text-gray-500 dark:text-gray-500"}`}>
            {departmentName}
          </h3>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {department.departmentCode}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 h-8">
          {department.departmentDescription || t('card.noDescription')}
        </p>
      </div>

      <div className="pt-3 border-t border-gray-100 dark:border-gray-100 mt-auto">
        <Button
          variant="secondary"
          size="sm"
          className="w-full bg-white dark:bg-white text-gray-700 dark:text-gray-700 border-gray-300 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-50"
          icon={Settings2}
          onClick={() => onConfigure(department)}
          disabled={!department.isActive}
        >
          {configureButtonText}
        </Button>
      </div>
    </div>
  );
}
