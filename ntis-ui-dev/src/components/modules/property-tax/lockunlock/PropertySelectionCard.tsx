"use client";

//import React from "react";
import { Building } from "lucide-react";
import {
  CardHeader,
  CardTitle,
  CardContent,
  SearchSelect,
  SearchButton,
  ClearButton,
} from "@/components/common";
import { useTranslations } from "next-intl";
import { SEARCH_ALPHANUMERIC_SANITIZE } from "@/lib/utils/validation-rules";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { SEARCH_CATEGORY } from "@/types/lockunlock.types";

import { ExcelUploadCard } from "./ExcelUploadCard";

interface PropertySelectionCardProps {
  formData: {
    searchCategory: number;
    zoneId: string;
    wardId: string;
    fromProperty: string;
    toProperty: string;
    propertyNos: string[];
  };
  handleSelectChange: (name: string, value: string | string[]) => void;
  zoneOptions: { label: string; value: string }[];
  wardOptions: { label: string; value: string }[];
  propertyOptions: { label: string; value: string }[];
  toPropertyOptions?: { label: string; value: string }[];
  handleShow: () => void;
  handleClearAll: () => void;
  isPending: boolean;
  isLoadingProperties?: boolean;
  excelFile?: File | null;
  setExcelFile?: (file: File | null) => void;
  excelFileName?: string;
  setExcelFileName?: (name: string) => void;
}

export function PropertySelectionCard({
  formData,
  handleSelectChange,
  zoneOptions = [],
  wardOptions = [],
  propertyOptions = [],
  toPropertyOptions,
  handleShow,
  handleClearAll,
  isPending,
  isLoadingProperties = false,
  excelFile = null,
  setExcelFile = () => {},
  excelFileName = "",
  setExcelFileName = () => {},
}: PropertySelectionCardProps) {
  const t = useTranslations("lockUnlock");
  const zoneAlias = useAliasLabel("Zone", t("defaults.zone"));
  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));
  const propertyNoAlias = useAliasLabel("Property_No", useAliasLabel("Property No.", useAliasLabel("Property No", t("defaults.propertyNo"))));

  if (formData.searchCategory === SEARCH_CATEGORY.EXCEL) {
    return (
      <ExcelUploadCard
        excelFile={excelFile}
        setExcelFile={setExcelFile}
        excelFileName={excelFileName}
        setExcelFileName={setExcelFileName}
        handleShow={handleShow}
        handleClearAll={handleClearAll}
        isPending={isPending}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <CardHeader className="mb-0 border border-slate-100 rounded-md bg-slate-50/50 py-3.5 px-6 flex flex-row items-center gap-2">
        <Building className="w-4 h-4 text-blue-600" />
        <CardTitle className="text-sm font-bold text-slate-800">{t("selectPropertyCard.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row flex-wrap gap-1 items-end">
          {formData.searchCategory === 1 && (
            <div className="flex-1 min-w-[150px]">
              <SearchSelect
                name="zoneId"
                label={t("selectPropertyCard.zone", { zone: zoneAlias })}
                required
                value={formData.zoneId}
                tabIndex={0}
                onChange={handleSelectChange}
                options={zoneOptions}
                placeholder={t("selectPropertyCard.selectZone", { zone: zoneAlias })}
              />
            </div>
          )}

          {formData.searchCategory !== 1 && (
            <div className="flex-1 min-w-[150px]">
              <SearchSelect
                name="wardId"
                label={t("selectPropertyCard.wardNo", { ward: wardAlias })}
                required
                value={formData.wardId}
                tabIndex={0}
                onChange={handleSelectChange}
                onEnter={() => document.getElementById("fromProperty")?.focus()}
                options={wardOptions}
                placeholder={t("selectPropertyCard.selectWard", { ward: wardAlias })}
              />
            </div>
          )}

          {formData.searchCategory === 3 && (
            <div className="flex-1 min-w-[150px]">
              <SearchSelect
                name="propertyNos"
                label={t("selectPropertyCard.propertyNo", { propertyNo: propertyNoAlias })}
                required
                value={formData.propertyNos.length > 0 ? formData.propertyNos[0] : ""}
                onChange={(name, value) => handleSelectChange(name, value ? [value as string] : [])}
                options={propertyOptions}
                placeholder={t("selectPropertyCard.selectProperties")}
                isLoading={isLoadingProperties}
                disabled={isLoadingProperties || !formData.wardId}
                sanitizeInput={(val) => val.replace(SEARCH_ALPHANUMERIC_SANITIZE, "")}
              />
            </div>
          )}

          {formData.searchCategory === 4 && (
            <>
              <div className="flex-1 min-w-[150px]">
                <SearchSelect
                  name="fromProperty"
                  label={t("selectPropertyCard.fromProperty")}
                  required
                  value={formData.fromProperty}
                  onChange={handleSelectChange}
                  onEnter={() => document.getElementById("toProperty")?.focus()}
                  options={propertyOptions}
                  placeholder={t("selectPropertyCard.selectStartRange")}
                  isLoading={isLoadingProperties}
                  sanitizeInput={(val) => val.replace(SEARCH_ALPHANUMERIC_SANITIZE, "")}
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <SearchSelect
                  name="toProperty"
                  label={t("selectPropertyCard.toProperty")}
                  required
                  value={formData.toProperty}
                  onChange={handleSelectChange}
                  options={toPropertyOptions || propertyOptions}
                  placeholder={t("selectPropertyCard.selectEndRange")}
                  isLoading={isLoadingProperties}
                  sanitizeInput={(val) => val.replace(SEARCH_ALPHANUMERIC_SANITIZE, "")}
                  disabled={!formData.fromProperty}
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 w-full lg:w-auto pb-0.5">
            <SearchButton
              id="showButton"
              label={t("selectPropertyCard.showButton")}
              size="sm"
              onClick={handleShow}
              isLoading={isPending}
              className="flex-1 lg:flex-none"
            />
            <ClearButton
              size="sm"
              label={t("selectPropertyCard.clearButton")}
              onClick={handleClearAll}
              disabled={isPending}
              className="flex-1 lg:flex-none"
            />
          </div>
        </div>
      </CardContent>
    </div>
  );
}