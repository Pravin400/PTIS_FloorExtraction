"use client";

import React from "react";
import {
  Input,
  Checkbox,
  ToggleSwitch,
  RadioGroup,
  RadioGroupItem,
  Label,
} from "@/components/common";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";
import { sanitizeDynamicFieldValue } from "@/lib/utils/asset-utils/new-add-new-asset/dynamic-field-sanitize.utils";
import type { DynamicFieldInputProps } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";

const NUMERIC_KEYWORDS = ["mobile", "pincode", "phone", "contact", "area", "tax", "cost", "rate", "value", "price", "valuation", "year", "length", "width", "height", "male", "female", "toy", "desk", "room", "tree", "toilet", "urinal", "count", "qty", "quantity"];

export function DynamicFieldInput({
  field,
  formData,
  onAttributeChange,
  isCompact = false,
}: DynamicFieldInputProps & { isCompact?: boolean }) {
  const fieldCode = field.fieldCode;
  const fieldLabel = field.fieldLabel;
  const fieldName = field.fieldName || fieldLabel || fieldCode || `dynamic_field_${field.id}`;
  const attributes = (formData.attributes || {}) as Record<string, unknown>;
  const fieldValue =
    (fieldName ? attributes[fieldName] ?? attributes[fieldName.toLowerCase()] : undefined) ??
    (fieldLabel ? attributes[fieldLabel] ?? attributes[fieldLabel.toLowerCase()] : undefined) ??
    (fieldCode ? attributes[fieldCode] ?? attributes[fieldCode.toLowerCase()] : undefined) ??
    (field.id ? attributes[`field_${field.id}`] ?? attributes[String(field.id)] : undefined);

  const typeLower = field.fieldType?.toLowerCase();
  const lowerName = fieldName.toLowerCase();
  const lowerLabel = (field.fieldLabel || "").toLowerCase();
  const reqStar = field.isRequired ? <span className="text-red-500 ml-0.5">*</span> : null;

  // 1. Radio field
  if (typeLower === "radio") {
    const radioOptions = Array.isArray(field.options) ? field.options : [];
    return (
      <div className={`flex flex-col gap-0.5 ${isCompact ? "" : "pt-2"}`}>
        <Label className={isCompact ? "text-[9.5px] font-bold text-slate-600 truncate block" : "text-xs font-bold text-slate-700"} title={field.fieldLabel}>
          {field.fieldLabel}{reqStar}
        </Label>
        <RadioGroup
          name={fieldName}
          value={String(fieldValue ?? "")}
          onValueChange={(val) => onAttributeChange(fieldName, val)}
          className={`flex flex-wrap ${isCompact ? "gap-x-3 gap-y-1 h-[25px]" : "gap-4"} items-center`}
        >
          {radioOptions.map((opt: string) => (
            <div key={opt} className="flex items-center gap-1 cursor-pointer">
              <RadioGroupItem value={opt} id={`${fieldName}-${opt}`} className={isCompact ? "w-3 h-3 text-blue-600" : "w-3.5 h-3.5"} />
              <Label htmlFor={`${fieldName}-${opt}`} className={isCompact ? "cursor-pointer text-[10px] font-medium text-slate-800" : "cursor-pointer text-xs text-slate-700"}>
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  }

  // 2. Checkbox / Boolean field
  const isCheckboxType = typeLower === "checkbox" || typeLower === "boolean";
  if (isCheckboxType) {
    if (Array.isArray(field.options) && field.options.length > 0) {
      let selectedValues: string[] = [];
      if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
        try {
          selectedValues = fieldValue.trim().startsWith("[") ? JSON.parse(fieldValue) : fieldValue.split(",").map((s) => s.trim());
        } catch {
          selectedValues = [fieldValue];
        }
      } else if (Array.isArray(fieldValue)) {
        selectedValues = fieldValue;
      }

      const handleCheckboxChange = (opt: string, checked: boolean) => {
        const next = checked ? [...new Set([...selectedValues, opt])] : selectedValues.filter((v) => v !== opt);
        onAttributeChange(fieldName, JSON.stringify(next));
      };

      return (
        <div className={`flex flex-col gap-0.5 ${isCompact ? "" : "pt-2"}`}>
          <Label className={isCompact ? "text-[9.5px] font-bold text-slate-600 truncate block" : "text-xs font-bold text-slate-700"} title={field.fieldLabel}>
            {field.fieldLabel}{reqStar}
          </Label>
          <div className={`flex flex-wrap ${isCompact ? "gap-x-3 gap-y-1 h-[25px]" : "gap-4"} items-center`}>
            {field.options.map((opt: string) => (
              <Checkbox
                key={opt}
                name={fieldName}
                value={opt}
                checked={selectedValues.includes(opt)}
                onCheckedChange={(checked) => handleCheckboxChange(opt, Boolean(checked))}
                label={opt}
                className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"}
              />
            ))}
          </div>
        </div>
      );
    }

    if (isCompact) {
      return (
        <div className="flex flex-col gap-0.5">
          <Label className="text-[9.5px] font-bold text-slate-600 truncate block" title={field.fieldLabel}>{field.fieldLabel}{reqStar}</Label>
          <div className="flex items-center h-[25px]">
            <Checkbox
              name={fieldName}
              checked={Boolean(fieldValue || false)}
              onCheckedChange={(checked) => onAttributeChange(fieldName, Boolean(checked))}
              label="Yes"
              className="h-3.5 w-3.5"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 h-7 pt-4">
        <ToggleSwitch
          checked={Boolean(fieldValue || false)}
          onChange={(val) => onAttributeChange(fieldName, val)}
          label={`${field.fieldLabel}${field.isRequired ? " *" : ""}`}
          showPopup={false}
        />
      </div>
    );
  }

  // 3. Dropdown Select field
  if (Array.isArray(field.options) && field.options.length > 0) {
    if (isCompact) {
      return (
        <div className="flex-grow flex-1 min-w-0 flex flex-col gap-0.5">
          <Label className="text-[9.5px] font-bold text-slate-600 truncate block" title={field.fieldLabel}>{field.fieldLabel}{reqStar}</Label>
          <div className="relative w-full min-w-0">
            <select
              name={fieldName}
              value={String(fieldValue ?? "")}
              onChange={(e) => onAttributeChange(fieldName, e.target.value)}
              required={field.isRequired}
              className="w-full min-w-0 truncate appearance-none px-2 py-0.5 pr-7 text-[10px] font-semibold border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer h-[25px] text-slate-900"
            >
              {withSelectPlaceholder(field.options.map((opt: string) => ({ label: opt, value: opt }))).map((opt) => (
                <option key={opt.value} value={opt.value} className={opt.value === "" ? "text-slate-700" : "text-slate-900 font-semibold"}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-0.5">
        <Label className="text-xs font-bold text-slate-700">{field.fieldLabel}{reqStar}</Label>
        <select
          name={fieldName}
          value={String(fieldValue ?? "")}
          onChange={(e) => onAttributeChange(fieldName, e.target.value)}
          required={field.isRequired}
          className="w-full h-8 px-2 text-xs font-bold border border-slate-300 rounded-md bg-white text-slate-800"
        >
          {withSelectPlaceholder(field.options.map((opt: string) => ({ label: opt, value: opt }))).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  // 4. Text / Number input field
  const isNumericField =
    typeLower === "number" ||
    NUMERIC_KEYWORDS.some((kw) => lowerName.includes(kw) || lowerLabel.includes(kw));

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = sanitizeDynamicFieldValue(e.target.value, lowerName, lowerLabel, typeLower);
    onAttributeChange(fieldName, val);
  };

  const isDateField = typeLower === "date";
  const displayValue =
    isDateField && typeof fieldValue === "string" && fieldValue.includes("T")
      ? fieldValue.split("T")[0]
      : typeof fieldValue === "boolean"
      ? ""
      : (fieldValue as string | number ?? "");

  if (isCompact) {
    return (
      <div className="flex-grow flex-1 min-w-0 flex flex-col gap-0.5">
        <Label className="text-[9.5px] font-bold text-slate-600 truncate block" title={field.fieldLabel}>{field.fieldLabel}{reqStar}</Label>
        <Input
          naked
          type={isDateField ? "date" : "text"}
          inputMode={isNumericField ? "numeric" : undefined}
          name={fieldName}
          placeholder={`Enter ${field.fieldLabel}`}
          value={displayValue}
          onChange={handleTextChange}
          className="w-full h-[25px] px-2 py-0.5 text-[10px] font-medium border border-slate-300 rounded-[4px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required={field.isRequired}
        />
      </div>
    );
  }

  return (
    <Input
      label={field.fieldLabel}
      name={fieldName}
      placeholder={`Enter ${field.fieldLabel}`}
      type={typeLower === "number" ? "number" : isDateField ? "date" : "text"}
      min={typeLower === "number" ? 0 : undefined}
      value={displayValue}
      onChange={handleTextChange}
      className="h-8 text-xs font-bold text-slate-700"
      required={field.isRequired}
    />
  );
}
