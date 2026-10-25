"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type {
  SearchCriteria,
  SearchFieldErrorMap,
} from "@/types/property-search";
import { ValueFilterGroup } from "./ValueFilterGroup";
import type { Option } from "@/components/common";
import { Button, Label } from "@/components/common";
import { SearchSelect } from "@/components/common/SearchSelect";
import { Search, RotateCcw } from "lucide-react";
import { SEARCH_BRAND_BUTTON, SEARCH_RESET_BUTTON, COMPACT_LABEL_CLASS } from "../form-field-styles";

interface ValuesDuesPanelProps {
  formState: SearchCriteria;
  fieldErrors: SearchFieldErrorMap;
  disabled: boolean;
  onSelectChange: (
    field: keyof SearchCriteria
  ) => (_: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
  onInputChange: (
    field: keyof SearchCriteria
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputBlur: (
    field: keyof SearchCriteria
  ) => (e: React.FocusEvent<HTMLInputElement>) => void;
  searchPending: boolean;
  isSubmitDisabled: boolean;
  onReset: () => void;
  onClearField: (field: keyof SearchCriteria) => void;
}

export function ValuesDuesPanel({
  formState,
  fieldErrors,
  disabled,
  onSelectChange,
  onInputChange,
  onInputBlur,
  searchPending,
  isSubmitDisabled,
  onReset,
  onClearField,
}: ValuesDuesPanelProps) {
  const t = useTranslations("propertySearch.form");
  const tCommon = useTranslations("common");

  const filterTypeOptions: Option[] = [
    { label: t("options.filterType.exact"), value: "exact" },
    { label: t("options.filterType.moreThan"), value: "moreThan" },
    { label: t("options.filterType.lessThan"), value: "lessThan" },
    { label: t("options.filterType.between"), value: "between" },
    { label: t("options.filterType.top"), value: "top" },
  ];

  const valuationMethodOptions: Option[] = [
    { label: t("options.valuationMethod.rv"), value: "rv" },
    { label: t("options.valuationMethod.cv"), value: "cv" },
    { label: t("options.valuationMethod.totalTax"), value: "totalTax" },
  ];

  const handleValuesDuesSelect =
    (field: keyof SearchCriteria) => (name: string, value: string) => {
      const syntheticEvent = {
        target: { name, value },
      } as React.ChangeEvent<HTMLSelectElement>;
      onSelectChange(field)(syntheticEvent, value);
    };

  const valuationMethodValue = formState.valuationMethod || "";

  const handleClearValuationMethod = () => {
    onClearField("valuationMethod");
  };

  return (
    <div className="overflow-visible px-2 pb-0.5 pt-1">
      <div className="flex flex-wrap items-start gap-x-1 gap-y-1">
        {/* Valuation Method dropdown */}
        <div className="flex min-w-0 flex-col w-44 shrink-0">
          <div className="mb-0.5 h-4 flex items-center justify-between gap-1">
            <Label htmlFor="valuationMethod" className={COMPACT_LABEL_CLASS}>
              {t("fields.valuationMethod")}
            </Label>
            {valuationMethodValue && !disabled && (
              <button
                type="button"
                onClick={handleClearValuationMethod}
                className="text-[11px] font-semibold text-[#004c8c] hover:underline cursor-pointer leading-none"
              >
                {t("actions.clear")}
              </button>
            )}
          </div>
          <SearchSelect
            key={`valuationMethod-${valuationMethodValue}`}
            id="valuationMethod"
            name="valuationMethod"
            options={valuationMethodOptions}
            placeholder={t("placeholders.valuationMethod")}
            value={valuationMethodValue}
            onChange={handleValuesDuesSelect("valuationMethod")}
            disabled={disabled}
            openOnFocus={false}
            className="!h-8 !min-h-8 !py-0 !px-2.5 !text-xs !rounded-md !leading-8"
          />
        </div>

        <ValueFilterGroup
          title={t("fields.filters")}
          filterField="rateableValueFilter"
          fromField="rateableValueFrom"
          toField="rateableValueTo"
          formState={formState}
          fieldErrors={fieldErrors}
          disabled={disabled}
          filterTypeOptions={filterTypeOptions}
          onSelectChange={handleValuesDuesSelect}
          onInputChange={onInputChange}
          onInputBlur={onInputBlur}
          onClearField={onClearField}
        />
        <div className="flex flex-col">
          <div className="mb-0.5 h-4 flex items-center"></div>
          <div className="flex items-center gap-1.5 h-8">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Search}
              disabled={searchPending || isSubmitDisabled}
              className={`${SEARCH_BRAND_BUTTON} cursor-pointer disabled:cursor-not-allowed`}
            >
              {tCommon("actions.search")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={onReset}
              disabled={searchPending}
              className={`${SEARCH_RESET_BUTTON} cursor-pointer disabled:cursor-not-allowed`}
            >
              {tCommon("actions.reset")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
