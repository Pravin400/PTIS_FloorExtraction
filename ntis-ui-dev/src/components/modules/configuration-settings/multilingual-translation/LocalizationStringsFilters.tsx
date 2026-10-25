"use client";

import React from "react";
import { MultiSelectDropdown, SearchSelect } from "@/components/common";
import type { SupportedLanguageCode } from "@/types/multilingual-translation.types";
import { SUPPORTED_LANGUAGE_CODES } from "@/types/multilingual-translation.types";

interface Option {
  label: string;
  value: string;
}

interface LocalizationStringsFiltersProps {
  t: (key: string) => string;
  resource?: string;
  resourceOptions: Option[];
  languages: SupportedLanguageCode[];
  languageOptions: Option[];
  onResourceChange: (resource: string) => void;
  onLanguagesChange: (languages: SupportedLanguageCode[]) => void;
}

export function LocalizationStringsFilters({
  t,
  resource,
  resourceOptions,
  languages,
  languageOptions,
  onResourceChange,
  onLanguagesChange,
}: LocalizationStringsFiltersProps): React.ReactElement {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="w-full md:w-64">
        <SearchSelect
          label={t("filters.resourceFile")}
          value={resource ?? ""}
          onChange={(_, value) => onResourceChange(value)}
          options={resourceOptions}
          placeholder={t("filters.selectResource")}
        />
      </div>
      <div className="w-full md:w-64">
        <MultiSelectDropdown
          label={t("filters.targetLocale")}
          value={languages}
          onChange={(values) =>
            onLanguagesChange(
              values.filter((v): v is SupportedLanguageCode =>
                (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(v)
              )
            )
          }
          options={languageOptions}
          placeholder={t("filters.filterLanguage")}
        />
      </div>
    </div>
  );
}
