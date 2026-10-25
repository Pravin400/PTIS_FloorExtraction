"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Input, Label, ValidationMessage } from "@/components/common";
import type {
  SearchCriteria,
  SearchFieldErrorMap,
} from "@/types/property-search";
import { COMPACT_INPUT_CLASS, COMPACT_LABEL_CLASS } from "../form-field-styles";
import {
  KYC_SEARCH_FIELDS,
} from "../search-field-groups";
import { cn } from "@/lib/utils/cn";
import { PROPERTY_SEARCH_FIELD_LIMITS } from "@/lib/validations/property-search-field-rules";
import { Button } from "@/components/common";
import { Search, RotateCcw } from "lucide-react";
import { SEARCH_BRAND_BUTTON, SEARCH_RESET_BUTTON } from "../form-field-styles";

interface KycSearchPanelProps {
  formState: SearchCriteria;
  fieldErrors: SearchFieldErrorMap;
  disabled: boolean;
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

function KycField({
  field,
  formState,
  fieldErrors,
  disabled,
  onInputChange,
  onInputBlur,
  onClearField,
  label,
  placeholder,
  tooltip,
  maxLength,
}: {
  field: keyof SearchCriteria;
  formState: SearchCriteria;
  fieldErrors: SearchFieldErrorMap;
  disabled: boolean;
  onInputChange: KycSearchPanelProps["onInputChange"];
  onInputBlur: KycSearchPanelProps["onInputBlur"];
  onClearField: KycSearchPanelProps["onClearField"];
  label: string;
  placeholder: string;
  tooltip: string;
  maxLength?: number;
}) {
  const error = fieldErrors[field];
  const value = String(formState[field] ?? "");
  const t = useTranslations("propertySearch.form");

  const handleClear = () => {
    onClearField(field);
  };

  return (
    <div className="flex min-w-0 flex-col w-full">
      <div className="mb-0.5 h-4 flex items-center justify-between gap-1">
        <Label
          htmlFor={field}
          className={cn(COMPACT_LABEL_CLASS, "flex items-center gap-1 h-full")}
          title={tooltip}
        >
          {label}
        </Label>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-semibold text-[#004c8c] hover:underline cursor-pointer leading-none"
          >
            {t("actions.clear")}
          </button>
        )}
      </div>
      <Input
        id={field}
        placeholder={placeholder}
        value={String(formState[field] ?? "")}
        onChange={onInputChange(field)}
        onBlur={onInputBlur(field)}
        disabled={disabled}
        maxLength={maxLength}
        fullWidth
        className={cn(
          COMPACT_INPUT_CLASS,
          error && "!border-red-500 focus:!ring-red-500"
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${field}-error` : undefined}
      />
      <ValidationMessage
        id={`${field}-error`}
        message={error}
        visible={Boolean(error)}
        type="error"
      />
    </div>
  );
}

export function KycSearchPanel({
  formState,
  fieldErrors,
  disabled,
  onInputChange,
  onInputBlur,
  searchPending,
  isSubmitDisabled,
  onReset,
  onClearField,
}: KycSearchPanelProps) {
  const t = useTranslations("propertySearch.form");
  const tCommon = useTranslations("common");

  const renderField = (field: keyof SearchCriteria) => (
    <KycField
      key={field}
      field={field}
      formState={formState}
      fieldErrors={fieldErrors}
      disabled={disabled}
      onInputChange={onInputChange}
      onInputBlur={onInputBlur}
      onClearField={onClearField}
      label={t(`fields.${field}`)}
      placeholder={t(`placeholders.${field}`)}
      tooltip={t(`tooltips.${field}`)}
      maxLength={PROPERTY_SEARCH_FIELD_LIMITS[field as keyof typeof PROPERTY_SEARCH_FIELD_LIMITS]}
    />
  );

  return (
    <div className="overflow-x-auto px-2 pb-0.5 pt-1">
      <div className="grid min-w-[56rem] max-w-[76rem] grid-cols-[1.2fr_0.8fr_1.8fr_2.8fr_auto] items-start gap-x-1 gap-y-0.5">
        {KYC_SEARCH_FIELDS.map(renderField)}
        <div className="flex flex-col w-full">
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
