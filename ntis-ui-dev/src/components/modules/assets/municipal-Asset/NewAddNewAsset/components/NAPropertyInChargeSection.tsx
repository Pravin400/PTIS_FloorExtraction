"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Input, TextArea, Label, Select } from "@/components/common";
import { useDigitInputs } from "@/hooks/useDigitInputs";
import type { NAPropertyInChargeSectionProps, BuildingBasicInfoFormData, NAFieldProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

const Row = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex gap-3 min-w-0 w-full ${className}`}>{children}</div>
);

const Field = ({ label, required, children, error, fullWidth = false, className = "" }: NAFieldProps) => (
  <div className={`${fullWidth ? "w-full" : "flex-1"} min-w-0 flex flex-col gap-0.5 ${className}`}>
    <Label className="text-[9.5px] font-bold text-slate-600 truncate block" title={label}>
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
    {children}
    {error && <span className="text-[9px] text-red-500 mt-0.5">{error}</span>}
  </div>
);

export function NAPropertyInChargeSection({
  formData,
  errors,
  showError,
  handleChange,
  updateFormData,
  designationOptions,
  isLoadingDesignations,
  handleChangeWithTranslit,
  handleInChargeRegionalBlur,
  handleAddressRegionalBlur,
}: NAPropertyInChargeSectionProps) {
  const t = useTranslations("newAddNewAsset");

  const contactInput = useDigitInputs(10, formData.inChargeMobile || formData.contactNumber || "");
  const pinCodeInput = useDigitInputs(6, formData.pinCode || "");

  const syncDigits = (hook: ReturnType<typeof useDigitInputs>, field: keyof BuildingBasicInfoFormData, idx: number, val: string) => {
    hook.handleChange(idx, val);
    const next = [...hook.digits];
    next[idx] = val.replace(/\D/g, "").slice(-1);
    const full = next.join("");
    const updateObj: Partial<BuildingBasicInfoFormData> =
      field === "inChargeMobile" ? { inChargeMobile: full, contactNumber: full } : { [field]: full };
    updateFormData(updateObj);
  };

  const syncPaste = (hook: ReturnType<typeof useDigitInputs>, field: keyof BuildingBasicInfoFormData, e: React.ClipboardEvent, len: number) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, len);
    if (!pasted) return;
    const digits = Array.from({ length: len }, (_, i) => pasted[i] || "");
    hook.setDigits(digits);
    const full = digits.join("");
    const updateObj: Partial<BuildingBasicInfoFormData> =
      field === "inChargeMobile" ? { inChargeMobile: full, contactNumber: full } : { [field]: full };
    updateFormData(updateObj);
  };

  const renderDigitBoxes = (hook: ReturnType<typeof useDigitInputs>, field: keyof BuildingBasicInfoFormData, len: number) => (
    <div className="flex gap-0.5 flex-1 h-[25px] items-center w-full">
      {Array.from({ length: len }).map((_, i) => (
        <Input
          key={i}
          naked
          type="text"
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]"
          value={hook.digits[i] || ""}
          onChange={(e) => syncDigits(hook, field, i, e.target.value)}
          onKeyDown={(e) => {
            hook.handleKeyDown(i, e);
            if (e.key === "Enter") e.preventDefault();
          }}
          onPaste={(e) => syncPaste(hook, field, e, len)}
          onFocus={hook.handleFocus}
          onBlur={hook.handleBlur}
          ref={hook.setRef(i)}
          className={`flex-1 min-w-0 w-full h-[25px] text-center text-[10px] font-semibold text-slate-900 border rounded-[4px] bg-white outline-none focus:ring-1 ${
            showError(field) ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-slate-300 focus:border-blue-500 focus:ring-blue-200"
          } ${hook.lastTypedIndex === i ? "animate-digit-pop" : ""}`}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Row 4 — In-Charge Name + In-Charge Regional Name */}
      <Row>
        <Field label={t("kycDetails.inChargeName")} error={showError("inChargeName") ? errors.inChargeName : undefined}>
          <Input
            naked
            name="inChargeName"
            value={formData.inChargeName || ""}
            placeholder={t("kycDetails.enterInChargeName")}
            onChange={handleChangeWithTranslit}
            onBlur={(e) => {
              if (e.target.value.trim() !== e.target.value) {
                e.target.value = e.target.value.trim();
                handleChangeWithTranslit(e);
              }
            }}
            maxLength={40}
            className="w-full h-[25px] px-2 py-0.5 text-[10px] font-medium border border-slate-300 rounded-[4px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </Field>
        <Field label={t("kycDetails.inChargeRegionalName")} error={showError("inChargeNameRegional") ? errors.inChargeNameRegional : undefined}>
          <Input
            naked
            name="inChargeNameRegional"
            value={formData.inChargeNameRegional || formData.inChargeRegionalName || ""}
            placeholder={t("kycDetails.enterRegionalName")}
            onChange={handleChangeWithTranslit}
            onBlur={async (e) => {
              if (e.target.value.trim() !== e.target.value) {
                e.target.value = e.target.value.trim();
                handleChangeWithTranslit(e);
              }
              await handleInChargeRegionalBlur(e);
            }}
            maxLength={40}
            className="w-full h-[25px] px-2 py-0.5 text-[10px] font-medium border border-slate-300 rounded-[4px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </Field>
      </Row>

      {/* Row 5 — Designation + Contact Number (10 Digit Boxes) */}
      <Row>
        <Field label={t("kycDetails.designation")} error={showError("inChargeDesignation") ? errors.inChargeDesignation : undefined}>
          <Select
            name="inChargeDesignation"
            value={formData.inChargeDesignation || ""}
            onChange={handleChange}
            disabled={!formData.department || isLoadingDesignations}
            placeholder={isLoadingDesignations ? "Loading..." : t("kycDetails.selectDesignation")}
            options={designationOptions}
            className="!h-[25px] !min-h-[25px] border-slate-200 rounded-md bg-white [&_button]:!h-[25px] [&_button]:!min-h-[25px] [&_button]:!py-0 [&_button]:!px-2 [&_span]:!text-[10px] [&_span]:!font-semibold [&_svg]:!w-2.5 [&_svg]:!h-2.5"
          />
        </Field>
        <Field label={t("kycDetails.contactNumber")} error={showError("inChargeMobile") ? errors.inChargeMobile : undefined}>
          {renderDigitBoxes(contactInput, "inChargeMobile", 10)}
        </Field>
      </Row>

      {/* Row 6 — Email + Pin Code (6 Digit Boxes) */}
      <Row>
        <Field label={t("kycDetails.email")} error={showError("inChargeEmail") ? errors.inChargeEmail : undefined}>
          <Input
            naked
            name="inChargeEmail"
            value={formData.inChargeEmail || ""}
            placeholder={t("kycDetails.enterEmail")}
            onChange={handleChange}
            onBlur={(e) => {
              if (e.target.value.trim() !== e.target.value) {
                e.target.value = e.target.value.trim();
                handleChange(e);
              }
            }}
            type="email"
            maxLength={40}
            className="w-full h-[25px] px-2 py-0.5 text-[10px] font-medium border border-slate-300 rounded-[4px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </Field>
        <Field label={t("kycDetails.pinCode")} required error={showError("pinCode") ? errors.pinCode : undefined}>
          {renderDigitBoxes(pinCodeInput, "pinCode", 6)}
        </Field>
      </Row>

      {/* Row 7 — Full Address + Regional Address */}
      <Row>
        <Field label={t("kycDetails.fullAddress")} required error={showError("fullAddress") ? errors.fullAddress : undefined}>
          <TextArea
            name="fullAddress"
            value={formData.fullAddress || ""}
            onChange={handleChangeWithTranslit}
            onBlur={(e) => {
              if (e.target.value.trim() !== e.target.value) {
                e.target.value = e.target.value.trim();
                handleChangeWithTranslit(e);
              }
            }}
            rows={2}
            maxLength={500}
            placeholder={t("kycDetails.enterFullAddress")}
            className="!h-[38px] !min-h-[38px] !px-2 !py-1 !text-[10px] !font-medium border border-slate-300 rounded-[4px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all leading-tight"
          />
        </Field>
        <Field label={t("kycDetails.regionalAddress")} error={showError("fullAddressRegional") ? errors.fullAddressRegional : undefined}>
          <TextArea
            name="fullAddressRegional"
            value={formData.fullAddressRegional || ""}
            onChange={handleChangeWithTranslit}
            onBlur={async (e) => {
              if (e.target.value.trim() !== e.target.value) {
                e.target.value = e.target.value.trim();
                handleChangeWithTranslit(e);
              }
              await handleAddressRegionalBlur(e);
            }}
            rows={2}
            maxLength={500}
            placeholder={t("kycDetails.enterRegionalAddress")}
            className="!h-[38px] !min-h-[38px] !px-2 !py-1 !text-[10px] !font-medium border border-slate-300 rounded-[4px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all leading-tight"
          />
        </Field>
      </Row>
    </>
  );
}
