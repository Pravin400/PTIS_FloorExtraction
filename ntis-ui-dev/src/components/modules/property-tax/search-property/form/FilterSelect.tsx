"use client";

import React from "react";
import { Label } from "@/components/common";
import type { Option } from "@/components/common";
import { SearchSelect } from "@/components/common/SearchSelect";
import { COMPACT_LABEL_CLASS } from "../form-field-styles";
import { cn } from "@/lib/utils/cn";

interface FilterSelectProps {
  label: string;
  options: Option[];
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
  disabled?: boolean;
  clearLabel?: string;
  onClear?: () => void;
}

export function FilterSelect({
  label,
  options,
  placeholder,
  value,
  onChange,
  disabled = false,
  clearLabel = "Clear",
  onClear,
}: FilterSelectProps) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      const event = {
        target: { name: "", value: "" },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(event, "");
    }
  };

  const handleSelectChange = (name: string, val: string) => {
    const event = {
      target: { name, value: val },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(event, val);
  };

  return (
    <div className="w-full">
      <div className="mb-1 h-5 flex items-center justify-between gap-1">
        <Label className={cn(COMPACT_LABEL_CLASS, "flex items-center gap-1 h-full")}>{label}</Label>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-semibold text-[#004c8c] hover:underline cursor-pointer leading-none"
          >
            {clearLabel}
          </button>
        )}
      </div>
      <SearchSelect
        key={`${label}-${value}`}
        id={label}
        name={label}
        options={options}
        placeholder={placeholder}
        value={value}
        onChange={handleSelectChange}
        disabled={disabled}
        openOnFocus={false}
        className="!h-8 !min-h-8 !py-0 !px-2.5 !text-xs !rounded-md !leading-8"
      />

    </div>
  );
}
