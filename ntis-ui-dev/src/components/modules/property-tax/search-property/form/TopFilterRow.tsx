"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { Option } from "@/components/common";
import type { PropertyAssessmentStatusOption } from "@/types/property-assessment-status.types";
import type {
  PropertyDescriptionOption,
  SearchCriteria,
  WardOption,
  ZoneOption,
} from "@/types/property-search";
import type { PropertyWorkflowStageOption } from "@/types/property-workflow-stage-master.types";
import { FilterSelect } from "./FilterSelect";

interface TopFilterRowProps {
  formState: SearchCriteria;
  propertyTypeOptions: PropertyAssessmentStatusOption[];
  workflowStageOptions: PropertyWorkflowStageOption[];
  zoneOptions: ZoneOption[];
  wardOptions: WardOption[];
  propertyDescriptionOptions: PropertyDescriptionOption[];
  disabled: boolean;
  onSelectChange: (
    field: keyof SearchCriteria
  ) => (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
  onZoneChange: (
    e: React.ChangeEvent<HTMLSelectElement>,
    value: string
  ) => void;
  onWardChange: (
    e: React.ChangeEvent<HTMLSelectElement>,
    value: string
  ) => void;
  onClearField: (field: keyof SearchCriteria) => void;
}

const toOption = <T extends { id: number | string; label: string }>(
  item: T
): Option => ({ label: item.label, value: String(item.id) });

export function TopFilterRow({
  formState,
  propertyTypeOptions,
  workflowStageOptions,
  zoneOptions,
  wardOptions,
  propertyDescriptionOptions,
  disabled,
  onSelectChange,
  onZoneChange,
  onWardChange,
  onClearField,
}: TopFilterRowProps) {
  const t = useTranslations("propertySearch.form");

  const getTranslationKey = (stageName: string): string => {
    if (stageName === "ApprovalByULB") return "approvalByUlb";
    const words = stageName.split(/[^a-zA-Z0-9]/).filter(Boolean);
    if (words.length === 0) return "";
    return words
      .map((word, index) => {
        if (index === 0) {
          if (word === word.toUpperCase()) {
            return word.toLowerCase();
          }
          return word.charAt(0).toLowerCase() + word.slice(1);
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join("");
  };

  const propertyTypeSelectOptions: Option[] = propertyTypeOptions.map(toOption);
  const typeFilterSelectOptions: Option[] = workflowStageOptions.map((opt) => {
    const key = getTranslationKey(opt.stageName);
    let label = opt.description || opt.stageName;
    try {
      if (key && t.has(`options.typeFilter.${key}`)) {
        const translated = t(`options.typeFilter.${key}`);
        if (translated && !translated.startsWith("options.typeFilter.")) {
          label = translated;
        }
      }
    } catch {}
    return {
      label,
      value: String(opt.id),
    };
  });
  const propertyDescriptionSelectOptions: Option[] =
    propertyDescriptionOptions.map(toOption);
  const zoneSelectOptions: Option[] = zoneOptions.map(toOption);
  const wardSelectOptions: Option[] = wardOptions.map(toOption);

  const wardPlaceholder =
    formState.zoneId <= 0
      ? t("placeholders.wardSelectZoneFirst")
      : t("placeholders.ward");

  const clearLabel = t("actions.clear");

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 items-end">
      <FilterSelect
        label={t("fields.propertyType")}
        options={propertyTypeSelectOptions}
        placeholder={t("placeholders.propertyType")}
        value={formState.propertyType}
        onChange={onSelectChange("propertyType")}
        disabled={disabled}
        clearLabel={clearLabel}
        onClear={() => onClearField("propertyType")}
      />
      <FilterSelect
        label={t("fields.typeFilter")}
        options={typeFilterSelectOptions}
        placeholder={t("placeholders.typeFilter")}
        value={formState.typeFilter}
        onChange={onSelectChange("typeFilter")}
        disabled={disabled}
        clearLabel={clearLabel}
        onClear={() => onClearField("typeFilter")}
      />
      <FilterSelect
        label={t("fields.propertyDescription")}
        options={propertyDescriptionSelectOptions}
        placeholder={t("placeholders.propertyDescription")}
        value={formState.propertyDescription}
        onChange={onSelectChange("propertyDescription")}
        disabled={disabled}
        clearLabel={clearLabel}
        onClear={() => onClearField("propertyDescription")}
      />
      <FilterSelect
        label={t("fields.zone")}
        options={zoneSelectOptions}
        placeholder={t("placeholders.zone")}
        value={formState.zoneId > 0 ? String(formState.zoneId) : ""}
        onChange={onZoneChange}
        disabled={disabled}
        clearLabel={clearLabel}
        onClear={() => onClearField("zoneId")}
      />
      <FilterSelect
        key={`ward-select-${formState.zoneId}`}
        label={t("fields.ward")}
        options={wardSelectOptions}
        placeholder={wardPlaceholder}
        value={formState.wardId > 0 ? String(formState.wardId) : ""}
        onChange={onWardChange}
        disabled={disabled || formState.zoneId <= 0}
        clearLabel={clearLabel}
        onClear={() => onClearField("wardId")}
      />
    </div>
  );
}
