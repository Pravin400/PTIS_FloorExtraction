"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Label, AnimatedDigitInput, Select } from "@/components/common";
import type { NAAssetProfileAdministrativeProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

const Row = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex gap-3 min-w-0 w-full ${className}`}>{children}</div>
);

const Field = ({
  label,
  required,
  children,
  error,
  fullWidth = false,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  fullWidth?: boolean;
  className?: string;
}) => (
  <div className={`${fullWidth ? "w-full" : "flex-1"} min-w-0 flex flex-col gap-0.5 ${className}`}>
    <Label className="text-[9.5px] font-bold text-slate-600 truncate block" title={label}>
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
    {children}
    {error && <span className="text-[9px] text-red-500 mt-0.5">{error}</span>}
  </div>
);

export function NAAssetProfileAdministrative({
  formData,
  errors,
  showError,
  handleChange,
  updateFormData,
  zoneOptions,
  wardOptions,
  moujaOptions,
  subzoneOptions,
  isLoadingWards,
  isLoadingSubzones,
}: NAAssetProfileAdministrativeProps) {
  const t = useTranslations("newAddNewAsset");

  return (
    <>
      {/* Row 1 — Category (read-only) + Asset Type (read-only) */}
      <Row>
        <div className="w-[30%] min-w-0 flex flex-col gap-0.5 shrink-0">
          <Label className="text-[9.5px] font-bold text-slate-600 truncate block" title={t("assetDetails.category")}>
            {t("assetDetails.category")}
          </Label>
          <div
            className="h-[25px] px-2 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 flex items-center truncate"
            title={formData.category || ""}
          >
            {formData.category || "—"}
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <Label className="text-[9.5px] font-bold text-slate-600 truncate block" title={t("assetDetails.type")}>
            {t("assetDetails.type")}
          </Label>
          <div
            className="h-[25px] px-2.5 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-300/80 rounded-md text-[10px] font-black text-[#101b87] flex items-center truncate shadow-sm tracking-wide"
            title={formData.assetType || ""}
          >
            {formData.assetType || "—"}
          </div>
        </div>
      </Row>

      {/* Row 2 — Zone + Ward */}
      <Row>
        <Field label={t("assetDetails.zone")} error={showError("zone") ? errors.zone : undefined}>
          <Select
            name="zone"
            value={formData.zone || ""}
            onChange={handleChange}
            disabled={!!formData.isMovableCategory}
            placeholder={t("assetDetails.selectZone")}
            options={zoneOptions}
            className="!h-[25px] !min-h-[25px] border-slate-200 rounded-md bg-white [&_button]:!h-[25px] [&_button]:!min-h-[25px] [&_button]:!py-0 [&_button]:!px-2 [&_span]:!text-[10px] [&_span]:!font-semibold [&_svg]:!w-2.5 [&_svg]:!h-2.5"
          />
        </Field>
        <Field label={t("assetDetails.ward")} error={showError("ward") ? errors.ward : undefined}>
          <Select
            name="ward"
            value={formData.ward || ""}
            onChange={handleChange}
            disabled={!!formData.isMovableCategory || !formData.zone || isLoadingWards}
            placeholder={isLoadingWards ? "Loading..." : t("assetDetails.selectWard")}
            options={wardOptions}
            className="!h-[25px] !min-h-[25px] border-slate-200 rounded-md bg-white [&_button]:!h-[25px] [&_button]:!min-h-[25px] [&_button]:!py-0 [&_button]:!px-2 [&_span]:!text-[10px] [&_span]:!font-semibold [&_svg]:!w-2.5 [&_svg]:!h-2.5"
          />
        </Field>
      </Row>

      {/* Row 3 — Property No + Partition No + UPIC ID */}
      <div className="flex gap-1.5 min-w-0 w-full max-w-full box-border">
        <Field label={t("assetDetails.propertyNo")} error={showError("propertyNumber") ? errors.propertyNumber : undefined}>
          <AnimatedDigitInput
            name="propertyNumber"
            value={formData.propertyNumber || ""}
            onChange={(val) => updateFormData({ propertyNumber: val })}
            allowedPattern={/^[0-9]$/}
            maxLength={12}
            className="!h-[25px] !rounded-md !border-slate-200 !text-[10px] !font-semibold !px-2"
            charClassName="!text-[10px] !font-semibold !text-slate-900"
          />
        </Field>
        <Field label={t("assetDetails.partitionNo")} error={showError("partitionNo") ? errors.partitionNo : undefined}>
          <AnimatedDigitInput
            name="partitionNo"
            value={formData.partitionNo || ""}
            onChange={(val) => updateFormData({ partitionNo: val })}
            allowedPattern={/^[0-9A-Za-z/\-]$/}
            maxLength={10}
            className="!h-[25px] !rounded-md !border-slate-200 !text-[10px] !font-semibold !px-2"
            charClassName="!text-[10px] !font-semibold !text-slate-900"
          />
        </Field>
        <Field label={t("assetDetails.upicId")} error={showError("upicId") ? errors.upicId : undefined}>
          <AnimatedDigitInput
            name="upicId"
            value={formData.upicId || ""}
            onChange={(val) => updateFormData({ upicId: val.toUpperCase() })}
            allowedPattern={/^[0-9A-Za-z/\-]$/}
            maxLength={15}
            className="!h-[25px] !rounded-md !border-slate-200 !text-[10px] !font-semibold !px-2 uppercase"
            charClassName="!text-[10px] !font-semibold !text-slate-900"
          />
        </Field>
      </div>

      {/* Row 4 — Mouja + Subzone + CSN No. */}
      <div className="flex gap-1.5 min-w-0 w-full">
        <Field label={t("assetDetails.mouja")} error={showError("mouja") ? errors.mouja : undefined}>
          <Select
            name="mouja"
            value={formData.mouja || ""}
            onChange={handleChange}
            placeholder={t("assetDetails.selectMouja")}
            options={moujaOptions}
            className="!h-[25px] !min-h-[25px] border-slate-200 rounded-md bg-white [&_button]:!h-[25px] [&_button]:!min-h-[25px] [&_button]:!py-0 [&_button]:!px-2 [&_span]:!text-[10px] [&_span]:!font-semibold [&_svg]:!w-2.5 [&_svg]:!h-2.5 [&_ul]:!max-h-[180px] [&_ul]:!bottom-auto [&_ul]:!top-full [&_ul]:!mt-0.5 [&_ul]:!overflow-y-auto [&_ul]:!z-[9999] [&_ul]:!shadow-xl [&_li]:!py-1 [&_li]:!px-2.5 [&_li]:!text-[10px]"
          />
        </Field>
        <Field label={t("assetDetails.subzone")} error={showError("subzone") ? errors.subzone : undefined}>
          <Select
            name="subzone"
            value={formData.subzone || ""}
            onChange={handleChange}
            disabled={!formData.mouja || isLoadingSubzones}
            placeholder={isLoadingSubzones ? "Loading..." : t("assetDetails.selectSubzone")}
            options={subzoneOptions}
            className="!h-[25px] !min-h-[25px] border-slate-200 rounded-md bg-white [&_button]:!h-[25px] [&_button]:!min-h-[25px] [&_button]:!py-0 [&_button]:!px-2 [&_span]:!text-[10px] [&_span]:!font-semibold [&_svg]:!w-2.5 [&_svg]:!h-2.5 [&_ul]:!max-h-[180px] [&_ul]:!bottom-auto [&_ul]:!top-full [&_ul]:!mt-0.5 [&_ul]:!overflow-y-auto [&_ul]:!z-[9999] [&_ul]:!shadow-xl [&_li]:!py-1 [&_li]:!px-2.5 [&_li]:!text-[10px]"
          />
        </Field>
        <Field label={t("assetDetails.csnNo")} error={showError("surveyNumber") ? errors.surveyNumber : undefined}>
          <AnimatedDigitInput
            name="surveyNumber"
            value={formData.surveyNumber || ""}
            onChange={(val) => updateFormData({ surveyNumber: val })}
            allowedPattern={/^[0-9A-Za-z\-/]$/}
            maxLength={30}
            className="!h-[25px] !rounded-md !border-slate-200 !text-[10px] !font-semibold !px-2"
            charClassName="!text-[10px] !font-semibold !text-slate-900"
          />
        </Field>
      </div>
    </>
  );
}
