"use client";

import React, { useMemo, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  MasterTable,
  SaveButton,
  Select,
  TableHeader,
} from "@/components/common";
import type {
  LocalizationStringsProps,
  MultilingualTranslation,
} from "@/types/multilingual-translation.types";
import { SUPPORTED_LANGUAGE_CODES } from "@/types/multilingual-translation.types";
import { getLocalizationStringsColumns } from "./LocalizationStringsColumns";
import { LocalizationStringsFilters } from "./LocalizationStringsFilters";
import { useMultilingualTranslationPagination } from "@/hooks/configuration-settings/multilingual-translation/useMultilingualTranslationPagination";
import { useLocalizationStringsEdits } from "@/hooks/configuration-settings/multilingual-translation/useLocalizationStringsEdits";
import { useLocalizationStringsSave } from "@/hooks/configuration-settings/multilingual-translation/useLocalizationStringsSave";
import { Globe } from "lucide-react";

export function LocalizationStrings({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  resources,
  resource,
  languages,
}: LocalizationStringsProps): React.ReactElement {
  const t = useTranslations("multilingualTranslation");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const {
    changePage,
    handlePageSizeChange,
    handleResourceChange,
    handleLanguagesChange,
    paginationInfo,
  } = useMultilingualTranslationPagination({
    pageNumber,
    pageSize,
    totalCount,
    locale,
    resource,
    languages,
    startTransition,
  });

  const { edits, handleCellChange, clearEdits } = useLocalizationStringsEdits();

  const { isSaving, handleSaveAll } = useLocalizationStringsSave({
    data,
    edits,
    onSuccess: clearEdits,
    t: (k) => t(k),
    tCommon: (k) => tCommon(k),
  });

  const resourceOptions = useMemo(
    () => [
      { label: t("filters.selectResource"), value: "" },
      ...resources.map((r) => ({ label: r, value: r })),
    ],
    [resources, t]
  );

  const languageOptions = useMemo(
    () =>
      SUPPORTED_LANGUAGE_CODES.map((code) => ({
        label: t(`languages.${code}`),
        value: code,
      })),
    [t]
  );

  const columns = useMemo(
    () =>
      getLocalizationStringsColumns({
        t: (k) => t(k),
        languages,
        edits,
        onCellChange: handleCellChange,
      }),
    [t, languages, edits, handleCellChange]
  );

  return (
    <>
      <TableHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={Globe}
        className="mb-3"
      />
      <div className="space-y-6">
        <LocalizationStringsFilters
          t={(k) => t(k)}
          resource={resource}
          resourceOptions={resourceOptions}
          languages={languages}
          languageOptions={languageOptions}
          onResourceChange={handleResourceChange}
          onLanguagesChange={handleLanguagesChange}
        />

        <MasterTable<MultilingualTranslation>
          columns={columns}
          data={data}
          loading={isPending}
          height="lg"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          onPageSizeChange={(size) => handlePageSizeChange(String(size))}
          paginationConfig={{ enabled: true, showPageSizeSelector: false }}
          getRowKey={(row) => String(row.id)}
          footerLeftContent={
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {tCommon("table.showing")} {paginationInfo.start} {tCommon("table.to")}{" "}
                {paginationInfo.end} {tCommon("table.of")} {totalCount}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {tCommon("table.rowsPerPage")}:
                </span>
                <Select
                  value={String(pageSize)}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  options={[10, 20, 30, 50, 100].map((s) => ({
                    label: String(s),
                    value: String(s),
                  }))}
                  selectSize="sm"
                  className="w-20"
                />
              </div>
              <SaveButton
                label={t("buttons.updateAll")}
                onClick={handleSaveAll}
                isLoading={isSaving}
                disabled={isSaving}
              />
            </div>
          }
        />
      </div>
    </>
  );
}
