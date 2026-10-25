"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, X, AlertCircle } from "lucide-react";
import { Input, ToggleSwitch, ValidationMessage } from "@/components/common";
import { Label } from "@/components/common/label";
import { cn } from "@/lib/utils/cn";
import { ZONE_WARD_NO_MAX_LENGTH, ZONE_WARD_NAME_MAX_LENGTH } from "../constants";
import { CODE_SANITIZE, DESCRIPTION_SANITIZE, POSITIVE_INTEGER_REGEX } from "@/lib/utils/validation-rules";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export interface WardFormState {
  wardNo: string;
  description: string;
  sequenceNo: string;
  isActive: boolean;
}

export interface WardFormErrors {
  wardNo?: string;
  description?: string;
  sequenceNo?: string;
}

interface WardFormFieldsProps {
  data: WardFormState;
  onChange: (v: WardFormState) => void;
  disabled?: boolean;
  mode: "add" | "edit";
  errors?: WardFormErrors;
  onBlur?: (field: keyof WardFormState) => void;
  duplicateWarning?: string;
  showSequence?: boolean;
  showBasicFields?: boolean;
  showActiveStatus?: boolean;
}

export function WardFormFields({
  data,
  onChange,
  disabled,
  errors = {},
  onBlur,
  duplicateWarning,
  showSequence = true,
  showBasicFields = true,
  showActiveStatus = true,
}: WardFormFieldsProps) {
  const t = useTranslations("zoneMaster");
  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));

  const sanitizeCode = (value: string) => {
    return value.replace(CODE_SANITIZE, '');
  };

  const sanitizeRegionalText = (value: string) => {
    return value.replace(DESCRIPTION_SANITIZE, '');
  };

  const sanitizeNumber = (value: string) => {
    return value.replace(/[^0-9]/g, '');
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
      {showBasicFields && (
        <>
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
                      {t("wardForm.activeStatus")}
                    </div>
                    <div className={cn("text-sm", isActive ? "text-gray-500" : "text-gray-400")}>
                      {isActive ? t("wardForm.statusActive", { ward: wardAlias }) : t("wardForm.statusInactive", { ward: wardAlias })}
                    </div>
                  </div>
                </div>

                <ToggleSwitch checked={isActive} onChange={handleToggleActive} showPopup={false} />
              </div>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md border-2 border-[#6F8EC0]/40 p-3">
            <Label required>{t("wardForm.wardNo", { ward: wardAlias })}</Label>
            <Input
              placeholder={t("wardForm.placeholders.wardNo")}
              disabled={disabled}
              value={data.wardNo}
              maxLength={ZONE_WARD_NO_MAX_LENGTH}
              onChange={(e) => {
                const sanitized = sanitizeCode(e.target.value.toUpperCase());
                onChange({ ...data, wardNo: sanitized });
              }}
              onBlur={() => onBlur?.("wardNo")}
              className={errors.wardNo || duplicateWarning ? "border-red-500 focus:ring-red-500" : ""}
            />
            <ValidationMessage message={errors.wardNo} />
            {duplicateWarning && (
              <ValidationMessage message={duplicateWarning} type="warning" />
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md border-2 border-[#6F8EC0]/40 p-3">
            <Label required>{t("wardForm.wardName", { ward: wardAlias })}</Label>
            <Input
              placeholder={t("wardForm.placeholders.wardName")}
              disabled={disabled}
              value={data.description}
              maxLength={ZONE_WARD_NAME_MAX_LENGTH}
              onChange={(e) => {
                const sanitized = sanitizeRegionalText(e.target.value);
                onChange({ ...data, description: sanitized });
              }}
              onBlur={() => onBlur?.("description")}
              className={errors.description ? "border-red-500 focus:ring-red-500" : ""}
            />
            <ValidationMessage message={errors.description} />
          </div>
        </>
      )}

      {showSequence && (
        <div className="bg-white rounded-lg shadow-md border-2 border-[#6F8EC0]/40 p-3">
          <Label required>{t("wardForm.sequenceNo")}</Label>
          <Input
            placeholder={t("wardForm.placeholders.sequenceNo")}
            disabled={disabled}
            value={data.sequenceNo}
            maxLength={3}
            onChange={(e) => {
              const sanitized = sanitizeNumber(e.target.value);
              // Only accept if it matches POSITIVE_INTEGER_REGEX and is <= 999
              if (sanitized === "" || (POSITIVE_INTEGER_REGEX.test(sanitized) && parseInt(sanitized, 10) <= 999)) {
                onChange({ ...data, sequenceNo: sanitized });
              }
            }}
            onBlur={() => onBlur?.("sequenceNo")}
            className={errors.sequenceNo ? "border-red-500 focus:ring-red-500" : ""}
          />
          <ValidationMessage message={errors.sequenceNo} />
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
        <AlertCircle size={16} />
        <span>
          {t("wardForm.mandatoryFields")}
        </span>
      </div>
    </div>
  );
}
