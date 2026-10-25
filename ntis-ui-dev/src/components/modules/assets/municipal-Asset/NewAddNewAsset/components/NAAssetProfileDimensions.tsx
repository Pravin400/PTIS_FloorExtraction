'use client';


import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Input, AnimatedDigitInput, Label, Select } from "@/components/common";
import type { NAAssetProfileDimensionsProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

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

export function NAAssetProfileDimensions({
  formData,
  errors,
  showError,
  handleChange,
  updateFormData,
  conditionOptions,
  encroachmentStatusOptions,
}: NAAssetProfileDimensionsProps) {
  const t = useTranslations("newAddNewAsset");

  // Auto-calculate Total Plot Area from Length × Width with decimal(12,2) constraint
  const onDimensionValChange = useCallback(
    (name: "length" | "width", rawVal: string) => {
      let val = rawVal.replace(/[^0-9.]/g, "");
      const parts = val.split(".");
      if (parts.length > 2) {
        val = parts[0] + "." + parts.slice(1).join("");
      }
      val = val.slice(0, 8);
      const dotIdx = val.indexOf(".");
      if (dotIdx !== -1) {
        const intPart = val.slice(0, dotIdx).slice(0, 5);
        const decPart = val.slice(dotIdx + 1).slice(0, 2);
        val = intPart + "." + decPart;
      } else {
        val = val.slice(0, 8);
      }
      const len = name === "length" ? parseFloat(val) || 0 : parseFloat(formData.length || "0");
      const wid = name === "width" ? parseFloat(val) || 0 : parseFloat(formData.width || "0");
      handleChange?.({ target: { name, value: val } });
      if (len > 0 && wid > 0) {
        updateFormData({ [name]: val, landArea: (len * wid).toFixed(2) });
      } else {
        updateFormData({ [name]: val, landArea: "" });
      }
    },
    [updateFormData, formData, handleChange]
  );

  return (
    <>
      {/* Row 5 — Plot Length + Plot Width + Total Plot Area (auto-calculated) */}
      <div className="flex gap-1.5 min-w-0 w-full max-w-full box-border">
        <Field label={t("assetDetails.plotLength")} required error={showError("length") ? errors.length : undefined}>
          <AnimatedDigitInput
            name="length"
            value={formData.length || ""}
            onChange={(val) => onDimensionValChange("length", val)}
            allowedPattern={/^[0-9.]$/}
            maxLength={8}
            className="!h-[25px] !rounded-md !border-slate-200 !text-[10px] !font-semibold !px-2"
            charClassName="!text-[10px] !font-semibold !text-slate-900"
          />
        </Field>
        <Field label={t("assetDetails.plotWidth")} required error={showError("width") ? errors.width : undefined}>
          <AnimatedDigitInput
            name="width"
            value={formData.width || ""}
            onChange={(val) => onDimensionValChange("width", val)}
            allowedPattern={/^[0-9.]$/}
            maxLength={8}
            className="!h-[25px] !rounded-md !border-slate-200 !text-[10px] !font-semibold !px-2"
            charClassName="!text-[10px] !font-semibold !text-slate-900"
          />
        </Field>
        <Field label={t("assetDetails.totalPlotArea")} required>
          <Input
            naked
            name="landArea"
            value={formData.landArea || ""}
            readOnly
            className="w-full h-[25px] px-2 py-0.5 text-[10px] font-medium border border-slate-300 rounded-[4px] bg-slate-50 text-slate-800 cursor-default focus:outline-none"
          />
        </Field>
      </div>

      {/* Row 6 — Plot Number + PTax ID + MPMS No. */}
      <div className="flex gap-1.5 min-w-0 w-full max-w-full box-border">
        <Field label={t("assetDetails.plotNumber")} error={showError("plotNumber") ? errors.plotNumber : undefined}>
          <AnimatedDigitInput
            name="plotNumber"
            value={formData.plotNumber || ""}
            onChange={(val) => updateFormData({ plotNumber: val })}
            allowedPattern={/^[0-9A-Za-z/\-]$/}
            maxLength={12}
            className="!h-[25px] !rounded-md !border-slate-200 !text-[10px] !font-semibold !px-2"
            charClassName="!text-[10px] !font-semibold !text-slate-900"
          />
        </Field>
        <Field label={t("assetDetails.ptaxId")} error={showError("pTaxId") ? errors.pTaxId : undefined}>
          <AnimatedDigitInput
            name="pTaxId"
            value={formData.pTaxId || ""}
            onChange={(val) =>
              updateFormData({
                pTaxId: val,
                attributes: { ...formData.attributes, pTaxId: val },
              })
            }
            allowedPattern={/^[0-9A-Za-z/\-]$/}
            maxLength={10}
            className="!h-[25px] !rounded-md !border-slate-200 !text-[10px] !font-semibold !px-2"
            charClassName="!text-[10px] !font-semibold !text-slate-900"
          />
        </Field>
        <Field label={t("assetDetails.mpmsNo")} error={showError("mpmsNo") ? errors.mpmsNo : undefined}>
          <Input
            naked
            name="mpmsNo"
            value={formData.mpmsNo || ""}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^a-zA-Z0-9/\-]/g, "").slice(0, 12);
              e.target.value = cleaned;
              handleChange(e);
              updateFormData({
                mpmsNo: cleaned,
                attributes: { ...formData.attributes, mpmsNo: cleaned },
              });
            }}
            maxLength={12}
            placeholder={t("assetDetails.enterMpmsNo")}
            className="w-full h-[25px] px-2 py-0.5 text-[10px] font-medium border border-slate-300 rounded-[4px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </Field>
      </div>

      {/* Row 7 — Asset Condition + Encroachment Status */}
      <Row>
        <Field label={t("assetDetails.condition")} error={showError("condition") ? errors.condition : undefined}>
          <Select
            name="condition"
            value={formData.condition || ""}
            onChange={handleChange}
            placeholder={t("assetDetails.selectCondition")}
            options={conditionOptions}
            className="!h-[25px] !min-h-[25px] border-slate-200 rounded-md bg-white [&_button]:!h-[25px] [&_button]:!min-h-[25px] [&_button]:!py-0 [&_button]:!px-2 [&_span]:!text-[10px] [&_span]:!font-semibold [&_svg]:!w-2.5 [&_svg]:!h-2.5"
          />
        </Field>
        <Field label={t("assetDetails.encroachmentStatus")} error={showError("encroachmentStatus") ? errors.encroachmentStatus : undefined}>
          <Select
            name="encroachmentStatus"
            value={formData.encroachmentStatus || ""}
            onChange={handleChange}
            placeholder={t("assetDetails.selectEncroachmentStatus")}
            options={encroachmentStatusOptions}
            className="!h-[25px] !min-h-[25px] border-slate-200 rounded-md bg-white [&_button]:!h-[25px] [&_button]:!min-h-[25px] [&_button]:!py-0 [&_button]:!px-2 [&_span]:!text-[10px] [&_span]:!font-semibold [&_svg]:!w-2.5 [&_svg]:!h-2.5"
          />
        </Field>
      </Row>
    </>
  );
}
