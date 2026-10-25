"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, X, AlertCircle } from "lucide-react";
import { Input, ToggleSwitch, ValidationMessage } from "@/components/common";
import { Label } from "@/components/common/label";
import { cn } from "@/lib/utils/cn";
import { ZONE_WARD_NO_MAX_LENGTH, ZONE_NAME_MAX_LENGTH, DESCRIPTION_ENGLISH_SANITIZE } from "../constants";
import { CODE_SANITIZE, DESCRIPTION_SANITIZE } from "@/lib/utils/validation-rules";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export interface ZoneFormState {
  zoneNo: string;
  description: string;
  descriptionEnglish: string;
  isActive: boolean;
}

export interface ZoneFormErrors {
  zoneNo?: string;
  description?: string;
  descriptionEnglish?: string;
}

interface ZoneFormFieldsProps {
  data: ZoneFormState;
  onChange: (v: ZoneFormState) => void;
  onBlur?: (fieldName: keyof ZoneFormState) => void;
  disabled?: boolean;
  errors?: ZoneFormErrors;
  showActiveStatus?: boolean;
}

export function ZoneFormFields({
  data,
  onChange,
  onBlur,
  disabled,
  errors = {},
  showActiveStatus = false,
}: ZoneFormFieldsProps) {
  const t = useTranslations("zoneMaster");
  const zoneAlias = useAliasLabel("Zone", t("defaults.zone"));

  const sanitizeCode = (value: string) => {
    return value.replace(CODE_SANITIZE, '');
  };

  const sanitizeEnglishText = (value: string) => {
    return value.replace(DESCRIPTION_ENGLISH_SANITIZE, '');
  };

  const sanitizeRegionalText = (value: string) => {
    return value.replace(DESCRIPTION_SANITIZE, '');
  };

  const isActive = Boolean(data.isActive);

  const handleToggleActive = () => {
    onChange({
      ...data,
      isActive: !isActive,
    });
  };

  return (
    <div className="space-y-5">
      {showActiveStatus && (
        <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
          <div className={cn("rounded-xl p-2 flex items-center justify-between transition-colors",
            isActive ? "border border-blue-200 bg-[#F0F6FF]" : "border border-gray-200 bg-gray-50"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-full",
                isActive ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"
              )}>
                {isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
              </div>
              <div>
                <div className={cn("font-medium", isActive ? "text-[#1E3A8A]" : "text-gray-700")}>
                  {t("zoneForm.activeStatus")}
                </div>
                <div className={cn("text-sm", isActive ? "text-gray-500" : "text-gray-400")}>
                  {isActive ? t("zoneForm.statusActive", { zone: zoneAlias }) : t("zoneForm.statusInactive", { zone: zoneAlias })}
                </div>
              </div>
            </div>

            <ToggleSwitch checked={isActive} onChange={handleToggleActive} showPopup={false} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border-2 border-[#6F8EC0]/40 p-3">
        <Label required>{t("zoneForm.zoneNo", { zone: zoneAlias })}</Label>
        <Input
          placeholder={t("zoneForm.placeholders.zoneNo")}
          disabled={disabled}
          value={data.zoneNo}
          maxLength={ZONE_WARD_NO_MAX_LENGTH}
          onChange={(e) => {
            const sanitized = sanitizeCode(e.target.value.toUpperCase());
            onChange({ ...data, zoneNo: sanitized });
          }}
          onBlur={() => onBlur?.("zoneNo")}
          className={errors.zoneNo ? "border-red-500 focus:ring-red-500" : ""}
        />
        <ValidationMessage message={errors.zoneNo} />
      </div>

      <div className="bg-white rounded-lg shadow-md border-2 border-[#6F8EC0]/40 p-3">
        <Label required>{t("zoneForm.zoneNameEn", { zone: zoneAlias })}</Label>
        <Input
          placeholder={t("zoneForm.placeholders.zoneNameEn")}
          disabled={disabled}
          value={data.descriptionEnglish}
          maxLength={ZONE_NAME_MAX_LENGTH}
          onChange={(e) => {
            const sanitized = sanitizeEnglishText(e.target.value);
            onChange({ ...data, descriptionEnglish: sanitized });
          }}
          onBlur={() => onBlur?.("descriptionEnglish")}
          className={errors.descriptionEnglish ? "border-red-500 focus:ring-red-500" : ""}
        />
        <ValidationMessage message={errors.descriptionEnglish} />
      </div>

      <div className="bg-white rounded-lg shadow-md border-2 border-[#6F8EC0]/40 p-3">
        <Label required>{t("zoneForm.zoneDescription", { zone: zoneAlias })}</Label>
        <Input
          placeholder={t("zoneForm.placeholders.zoneDescription")}
          disabled={disabled}
          value={data.description}
          maxLength={ZONE_NAME_MAX_LENGTH}
          onChange={(e) => {
            const sanitized = sanitizeRegionalText(e.target.value);
            onChange({ ...data, description: sanitized });
          }}
          onBlur={() => onBlur?.("description")}
          className={errors.description ? "border-red-500 focus:ring-red-500" : ""}
        />
        <ValidationMessage message={errors.description} />
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
        <AlertCircle size={16} />
        <span>
          {t("zoneForm.mandatoryFields")}
        </span>
      </div>
    </div>
  );
}
