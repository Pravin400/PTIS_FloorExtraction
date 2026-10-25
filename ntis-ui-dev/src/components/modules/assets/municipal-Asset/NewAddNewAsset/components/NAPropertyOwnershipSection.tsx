"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Label, TextArea, Select } from "@/components/common";
import type { NAPropertyOwnershipSectionProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

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

export function NAPropertyOwnershipSection({
  formData,
  errors,
  showError,
  handleChange,
  updateFormData,
  deptOptions,
  ownershipOptions,
  handleChangeWithTranslit,
}: NAPropertyOwnershipSectionProps) {
  const t = useTranslations("newAddNewAsset");

  return (
    <>
      {/* Row 1 — Asset Name */}
      <Row>
        <Field label={t("kycDetails.assetName")} required error={showError("assetName") ? errors.assetName : undefined} fullWidth>
          <TextArea
            name="assetName"
            value={formData.assetName || ""}
            placeholder={t("kycDetails.enterAssetName")}
            onChange={handleChangeWithTranslit}
            onBlur={(e) => {
              const trimmed = e.target.value.trim();
              if (trimmed !== e.target.value) {
                e.target.value = trimmed;
                handleChangeWithTranslit(e);
              }
            }}
            rows={2}
            className="!h-[32px] !min-h-[32px] !px-2 !py-1 !text-[10px] !font-medium border border-slate-300 rounded-[4px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all leading-tight"
            maxLength={150}
          />
        </Field>
      </Row>

      {/* Row 2 — Asset Regional Name */}
      <Row>
        <Field label={t("kycDetails.assetRegionalName")} error={showError("assetNameRegional") ? errors.assetNameRegional : undefined} fullWidth>
          <TextArea
            name="assetNameRegional"
            value={formData.assetNameRegional || ""}
            placeholder={t("kycDetails.enterRegionalName")}
            onChange={handleChangeWithTranslit}
            onBlur={(e) => {
              const trimmed = e.target.value.trim();
              if (trimmed !== e.target.value) {
                e.target.value = trimmed;
                handleChangeWithTranslit(e);
              }
            }}
            rows={2}
            className="!h-[32px] !min-h-[32px] !px-2 !py-1 !text-[10px] !font-medium border border-slate-300 rounded-[4px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all leading-tight"
            maxLength={150}
          />
        </Field>
      </Row>

      {/* Row 3 — Owning Department + Ownership Type */}
      <Row>
        <Field label={t("kycDetails.owningDepartment")} required error={showError("department") ? errors.department : undefined}>
          <Select
            name="department"
            value={formData.department || String(formData.departmentId ?? "")}
            onChange={(e, val) => {
              handleChange(e);
              updateFormData({ departmentId: val });
            }}
            placeholder={t("kycDetails.selectOwningDepartment")}
            options={deptOptions}
            className="!h-[25px] !min-h-[25px] border-slate-200 rounded-md bg-white [&_button]:!h-[25px] [&_button]:!min-h-[25px] [&_button]:!py-0 [&_button]:!px-2 [&_span]:!text-[10px] [&_span]:!font-semibold [&_svg]:!w-2.5 [&_svg]:!h-2.5"
          />
        </Field>
        <Field label={t("kycDetails.ownershipType")} required error={showError("ownershipType") ? errors.ownershipType : undefined}>
          <Select
            name="ownershipType"
            value={formData.ownershipType || ""}
            onChange={handleChange}
            placeholder={t("kycDetails.selectOwnershipType")}
            options={ownershipOptions}
            className="!h-[25px] !min-h-[25px] border-slate-200 rounded-md bg-white [&_button]:!h-[25px] [&_button]:!min-h-[25px] [&_button]:!py-0 [&_button]:!px-2 [&_span]:!text-[10px] [&_span]:!font-semibold [&_svg]:!w-2.5 [&_svg]:!h-2.5"
          />
        </Field>
      </Row>
    </>
  );
}
