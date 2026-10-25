"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Repeat } from "lucide-react";

import {
  Drawer,
  CancelButton,
  SaveButton,
  Input,
  TextArea,
  ValidationMessage,
  FormStatusToggle,
} from "@/components/common";
import {
  LETTERS_SPACES_HYPHENS_SANITIZE,
  DESCRIPTION_SANITIZE,
} from "@/lib/utils/validation-rules";
import type {
  CreateBillingFrequencyMasterDto,
  BillingFrequencyInput,
  BillingFrequencyFormProps,
} from "@/types/water-bill/billing-configuration/billingFrequencyMaster.types";

const MAX_BILLING_FREQUENCY = 50;
const MAX_DESCRIPTION = 250;

export function BillingFrequencyForm({
  open,
  initialData,
  isSubmitting = false,
  onClose,
  onSubmit,
}: BillingFrequencyFormProps) {
  const t = useTranslations("billingFrequencyMaster");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(initialData);

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [formData, setFormData] = useState<BillingFrequencyInput>({
    billingFrequencyCode: initialData?.billingFrequencyCode ?? "",
    billingFrequency: initialData?.billingFrequency ?? "",
    periodsPerYear: initialData?.periodsPerYear !== undefined && initialData?.periodsPerYear !== null ? initialData.periodsPerYear : "",
    sequenceNo: initialData?.sequenceNo !== undefined && initialData?.sequenceNo !== null ? initialData.sequenceNo : "",
    description: initialData?.description ?? "",
    isActive: initialData?.isActive ?? true,
  });
  const [touched, setTouched] = useState<Partial<Record<keyof BillingFrequencyInput, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null);

  const validate = useCallback(
    (data: BillingFrequencyInput) => {
      const errs: Partial<Record<keyof BillingFrequencyInput, string>> = {};

      const freqTrimmed = (data.billingFrequency || "").trim();
      if (!freqTrimmed) {
        errs.billingFrequency = t("validation.billingFrequencyRequired");
      } else if (freqTrimmed.length > MAX_BILLING_FREQUENCY) {
        errs.billingFrequency = t("validation.billingFrequencyLength", { count: MAX_BILLING_FREQUENCY });
      }

      const periods = typeof data.periodsPerYear === "number" ? data.periodsPerYear : parseInt(String(data.periodsPerYear), 10);
      if (isNaN(periods) || periods < 1 || periods > 12) {
        errs.periodsPerYear = t("validation.periodsPerYearRequired");
      }

      const descTrimmed = (data.description || "").trim();
      if (!descTrimmed) {
        errs.description = t("validation.descriptionRequired");
      } else if (descTrimmed.length > MAX_DESCRIPTION) {
        errs.description = t("validation.descriptionLength", { count: MAX_DESCRIPTION });
      }

      return errs;
    },
    [t]
  );

  const clientErrors = validate(formData);

  const getFieldError = (field: keyof BillingFrequencyInput) => {
    if (clientErrors[field]) return clientErrors[field];
    if (serverErrors && serverErrors[field] && serverErrors[field].length > 0) {
      const serverErr = serverErrors[field][0];
      if (
        serverErr === t("validation.duplicateEntry") ||
        serverErr === t("validation.duplicateBillingFrequency") ||
        serverErr === t("validation.duplicatePeriodsPerYear")
      ) {
        return undefined;
      }
      return serverErr;
    }
    return undefined;
  };

  const isFieldInvalid = (field: keyof BillingFrequencyInput) => {
    if (clientErrors[field]) return true;
    if (serverErrors && serverErrors[field] && serverErrors[field].length > 0) return true;
    return false;
  };

  const showError = (field: keyof BillingFrequencyInput) =>
    Boolean((submittedOnce || touched[field] || (serverErrors && serverErrors[field])) && isFieldInvalid(field));

  const handleChange = (field: keyof BillingFrequencyInput, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (serverErrors && serverErrors[field]) {
      setServerErrors((prev) => {
        if (!prev) return null;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field: keyof BillingFrequencyInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    setServerErrors(null);
    if (Object.keys(validate(formData)).length > 0) return;

    const generatedCode = formData.billingFrequency.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const submissionData: CreateBillingFrequencyMasterDto = {
      billingFrequencyCode: generatedCode,
      billingFrequency: formData.billingFrequency.trim(),
      periodsPerYear: Number(formData.periodsPerYear) || 1,
      sequenceNo: formData.sequenceNo !== "" ? Number(formData.sequenceNo) : undefined,
      description: formData.description?.trim() || undefined,
      isActive: Boolean(formData.isActive),
    };
    const res = await onSubmit(submissionData);
    if (res && !res.success && res.errors) {
      setServerErrors(res.errors);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="md"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Repeat size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("editTitle") : t("addTitle")}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("editSubtitle") : t("addSubtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <CancelButton
            label={tCommon("buttons.cancel")}
            onClick={onClose}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? t("form.updateRecord") : t("form.saveRecord")}
            type="submit"
            form="billing-frequency-form"
            isLoading={isSubmitting}
          />
        </div>
      }
    >
      <form id="billing-frequency-form" onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
        <FormStatusToggle
          isEdit={isEdit}
          isActive={Boolean(formData.isActive)}
          onChange={(val) => handleChange("isActive", val)}
          isSubmitting={isSubmitting}
          statusLabel={t("table.isActive")}
          description={formData.isActive ? t("form.activeStatusOn") : t("form.activeStatusOff")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Billing Frequency Name */}
          <div className="space-y-1 md:col-span-2">
            <Input
              required
              maxLength={MAX_BILLING_FREQUENCY}
              label={t("form.billingFrequency.label")}
              placeholder={t("form.billingFrequency.placeholder")}
              value={formData.billingFrequency}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value.replace(LETTERS_SPACES_HYPHENS_SANITIZE, "").slice(0, MAX_BILLING_FREQUENCY);
                setFormData((prev) => ({
                  ...prev,
                  billingFrequency: val,
                  billingFrequencyCode: val.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""),
                }));
              }}
              onBlur={() => handleBlur("billingFrequency")}
              className={showError("billingFrequency") ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            <ValidationMessage message={getFieldError("billingFrequency")} visible={showError("billingFrequency")} />
          </div>

          {/* Periods Per Year */}
          <div className="space-y-1 md:col-span-2">
            <Input
              required
              type="number"
              min={1}
              max={12}
              step={1}
              label={t("form.periodsPerYear.label")}
              placeholder={t("form.periodsPerYear.placeholder")}
              value={formData.periodsPerYear}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (["e", "E", "+", "-", "."].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 2);
                handleChange("periodsPerYear", digitsOnly === "" ? "" : Number(digitsOnly));
              }}
              onBlur={() => handleBlur("periodsPerYear")}
              className={showError("periodsPerYear") ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            <ValidationMessage message={getFieldError("periodsPerYear")} visible={showError("periodsPerYear")} />
          </div>

          {/* Sequence No - Only show on edit */}
          {isEdit && (
            <div className="space-y-1 md:col-span-2">
              <Input
                type="number"
                min={1}
                step={1}
                label={t("form.sequenceNo.label")}
                placeholder={t("form.sequenceNo.placeholder")}
                value={formData.sequenceNo}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (["e", "E", "+", "-", "."].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  handleChange("sequenceNo", digitsOnly === "" ? "" : Number(digitsOnly));
                }}
                onBlur={() => handleBlur("sequenceNo")}
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1 md:col-span-2">
            <TextArea
              required
              maxLength={MAX_DESCRIPTION}
              label={t("form.description.label")}
              placeholder={t("form.description.placeholder")}
              rows={3}
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const val = e.target.value.replace(DESCRIPTION_SANITIZE, "").slice(0, MAX_DESCRIPTION);
                handleChange("description", val);
              }}
              onBlur={() => handleBlur("description")}
              error={showError("description")}
            />
            <ValidationMessage message={getFieldError("description")} visible={showError("description")} />
          </div>

        </div>
      </form>
    </Drawer>
  );
}
