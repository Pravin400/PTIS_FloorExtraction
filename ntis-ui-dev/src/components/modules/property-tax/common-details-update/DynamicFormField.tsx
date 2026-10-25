"use client";

import { useMemo } from "react";
import { Input, ValidationMessage, TextArea, MultiSelect, RadioGroup, RadioGroupItem } from "@/components/common";
import { SearchSelectPaginated } from "@/components/common/SearchSelectPaginated";
import { Label } from "@/components/common/label";
import { Checkbox } from "@/components/common/checkbox";
import { BulkUpdateFieldConfig, SelectOption } from "@/types/common-details-update/common-details-update.types";
import { useLocale } from "next-intl";

interface DynamicFormFieldProps {
  config: BulkUpdateFieldConfig;
  value: string | number | boolean | (string | number)[] | null | undefined;
  onChange: (fieldName: string, value: string | number | boolean) => void;
  submitted: boolean;
  error?: string;
  warning?: string;
  dropdownOptions?: SelectOption[];
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onFocus?: () => void;
  onLoadMore?: (searchQuery?: string) => void;
  onSearchChange?: (searchQuery: string) => void;
}

export const DynamicFormField = ({
  config,
  value,
  onChange,
  submitted,
  error,
  warning,
  dropdownOptions = [],
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onFocus,
  onLoadMore,
  onSearchChange,
}: DynamicFormFieldProps) => {
  const locale = useLocale();

  const displayName =
    locale === "mr" && config.displayNameMarathi
      ? config.displayNameMarathi
      : config.displayName;

  const placeholder = config.placeholder ?? "";

  // Check for required fields - treat 0 as valid, only empty/null/undefined as invalid
  const isMissingRequired =
    submitted && config.isRequired && (value === "" || value === null || value === undefined);

  const isInvalid = Boolean(error) || Boolean(isMissingRequired);
  const isWarning = !isInvalid && Boolean(warning);
  const errorMessage = error || (isMissingRequired ? `${displayName} is required` : "");

  const fieldElement = useMemo(() => {
    switch (config.controlType as string) {
      case "textarea":
        return (
          <TextArea
            value={String(value ?? "")}
            onChange={(e) => onChange(config.fieldName, e.target.value)}
            placeholder={placeholder}
            maxLength={config.maxLength ?? undefined}
            readOnly={config.isReadonly}
            rows={3}
          />
        );

      case "dropdown":
      case "select":
      case "searchselect":
        return (
          <SearchSelectPaginated
            value={String(value ?? "")}
            onChange={(_, val) => onChange(config.fieldName, val)}
            options={dropdownOptions}
            placeholder={placeholder || `Select ${displayName}`}
            disabled={config.isReadonly}
            isLoading={isLoading}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onInputFocus={onFocus}
            onLoadMore={onLoadMore}
            onSearchChange={onSearchChange}
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-2 py-1">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(config.fieldName, checked)}
              disabled={config.isReadonly}
            />
            <span className="text-sm text-gray-700">{displayName}</span>
          </div>
        );

      case "number":
        return (
          <Input
            type="text"
            inputMode="numeric"
            value={String(value ?? "")}
            onChange={(e) => {
              let val = e.target.value;
              if (config.maxLength && val.length > config.maxLength) {
                val = val.slice(0, config.maxLength);
              }
              onChange(config.fieldName, val);
            }}
            placeholder={placeholder}
            maxLength={config.maxLength ?? undefined}
            readOnly={config.isReadonly}
          />
        );

      case "decimal":
        return (
          <Input
            type="text"
            inputMode="decimal"
            value={String(value ?? "")}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                if (config.maxLength && val.length > config.maxLength) {
                  return;
                }
                onChange(config.fieldName, val);
              }
            }}
            placeholder={placeholder}
            maxLength={config.maxLength ?? undefined}
            readOnly={config.isReadonly}
          />
        );

      case "multiselect":
        const multiSelectValue = Array.isArray(value)
          ? value.map(String)
          : typeof value === "string" && value
            ? value.split(",").filter(Boolean)
            : [];
        return (
          <MultiSelect
            options={dropdownOptions}
            value={multiSelectValue}
            onChange={(selected) => onChange(config.fieldName, selected.join(","))}
            placeholder={placeholder}
            disabled={config.isReadonly}
          />
        );

      case "radio":
        return (
          <RadioGroup
            value={String(value ?? "")}
            onValueChange={(val) => onChange(config.fieldName, val)}
            disabled={config.isReadonly}
            className="flex flex-wrap gap-4 py-1"
          >
            {dropdownOptions.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`${config.fieldName}-${opt.value}`} />
                <Label htmlFor={`${config.fieldName}-${opt.value}`} className="text-sm text-gray-700 cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "year":
        return (
          <Input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => {
              const val = e.target.value;
              // Allow empty or digits only
              if (val === "" || /^\d+$/.test(val)) {
                onChange(config.fieldName, val);
              }
            }}
            placeholder={placeholder || "YYYY"}
            maxLength={config.maxLength ?? 4}
            readOnly={config.isReadonly}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={String(value ?? "")}
            onChange={(e) => onChange(config.fieldName, e.target.value)}
            readOnly={config.isReadonly}
          />
        );

      case "datetime":
      case "datetime-local":
        return (
          <Input
            type="datetime-local"
            value={String(value ?? "")}
            onChange={(e) => onChange(config.fieldName, e.target.value)}
            readOnly={config.isReadonly}
          />
        );

      case "file":
        return (
          <Input
            type="file"
            accept={config.validationRegex ? undefined : "image/*,.pdf"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              onChange(config.fieldName, file?.name ?? "");
            }}
            readOnly={config.isReadonly}
          />
        );

      case "email":
        return (
          <Input
            type="email"
            value={String(value ?? "")}
            onChange={(e) => onChange(config.fieldName, e.target.value)}
            placeholder={placeholder}
            maxLength={config.maxLength ?? undefined}
            readOnly={config.isReadonly}
          />
        )

      case "mobile":
        return (
          <Input
            type="tel"
            inputMode="tel"
            value={String(value ?? "")}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d+$/.test(val)) {
                if (config.maxLength && val.length > config.maxLength) {
                  return;
                }
                onChange(config.fieldName, val);
              }
            }}
            placeholder={placeholder}
            maxLength={config.maxLength ?? 10}
            readOnly={config.isReadonly}
          />
        );

      case "text":
      case "textbox":
      default:
        return (
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(config.fieldName, e.target.value)}
            placeholder={placeholder}
            maxLength={config.maxLength ?? undefined}
            readOnly={config.isReadonly}
          />
        );
    }
  }, [config, value, onChange, placeholder, dropdownOptions, displayName, isLoading, hasMore, isLoadingMore, onFocus, onLoadMore, onSearchChange]);

  if (config.controlType === "checkbox") {
    return <div className="py-1">{fieldElement}</div>;
  }

  return (
    <div>
      <Label required={config.isRequired} className="text-xs">
        {displayName}
      </Label>
      <div className={
        isInvalid
          ? "[&_input]:!border-rose-500 [&_input]:!ring-1 [&_input]:!ring-rose-500 [&_textarea]:!border-rose-500 [&_textarea]:!ring-1 [&_textarea]:!ring-rose-500 [&_button]:!border-rose-500 [&_button]:!ring-1 [&_button]:!ring-rose-500"
          : isWarning
            ? "[&_input]:!border-amber-500 [&_input]:!ring-1 [&_input]:!ring-amber-500 [&_textarea]:!border-amber-500 [&_textarea]:!ring-1 [&_textarea]:!ring-amber-500 [&_button]:!border-amber-500 [&_button]:!ring-1 [&_button]:!ring-amber-500"
            : ""
      }>
        {fieldElement}
      </div>
      <ValidationMessage
        visible={isInvalid}
        message={errorMessage}
      />
      {isWarning && warning && (
        <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-amber-600">
          <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 20 20">
            <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
          </svg>
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
};
