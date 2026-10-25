"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Droplets } from "lucide-react";

import {
  Drawer,
  CancelButton,
  SaveButton,
  Input,
  ValidationMessage,

} from "@/components/common";
import { StatusToggleField } from "./StatusToggleField";

import { MandatoryFieldsNotice } from "@/components/modules/property-tax/Floormaster/MandatoryFieldsNotice";

import type { TapSize, TapSizeFormModel } from "@/types/water-connection.types";
import {
  createTapSizeAction,
  updateTapSizeAction,
} from "@/app/[locale]/property-tax/water-connection-master/actions";
import {
  LETTERS_ONLY_REGEX,
  LETTERS_ONLY_SANITIZE,
} from "@/lib/utils/validation-rules";
import { sanitizePositiveDecimal } from "@/lib/utils/validation";

const MAX_INTEGER_DIGITS = 2;
const MAX_DECIMAL_PLACES = 2;
const MAX_NAME = MAX_INTEGER_DIGITS + MAX_DECIMAL_PLACES + 1;
const MAX_UNIT = 7;
const POSITIVE_TAP_SIZE_REGEX = /^(?=.*[1-9])\d{1,2}(?:\.\d{1,2})?$/;

export interface TapSizeFormProps {
  id: number | null;
  initialData?: TapSize;
}

export function TapSizeForm({ id, initialData }: Readonly<TapSizeFormProps>) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("waterConnectionMaster.tapSize");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const listUrl = `/${locale}/property-tax/water-connection-master/tap-size`;

  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const [formData, setFormData] = useState<TapSizeFormModel>({
    sizeName: initialData?.sizeName ?? "",
    unit: initialData?.unit ?? "Inch",
    isActive: initialData?.isActive ?? true,
  });
  const [touched, setTouched] = useState<Partial<Record<keyof TapSizeFormModel, boolean>>>({});

  const validate = useCallback(
    (data: TapSizeFormModel) => {
      const errs: Partial<Record<keyof TapSizeFormModel, string>> = {};
      if (!data.sizeName.trim())
        errs.sizeName = t("validation.sizeNameRequired");
      else if (!POSITIVE_TAP_SIZE_REGEX.test(data.sizeName.trim()))
        errs.sizeName = t("validation.sizeNameInvalid");
      else if (data.sizeName.trim().length > MAX_NAME)
        errs.sizeName = t("validation.sizeNameLength", { count: MAX_NAME });
      if (!data.unit.trim())
        errs.unit = t("validation.unitRequired");
      else if (!LETTERS_ONLY_REGEX.test(data.unit.trim()))
        errs.unit = t("validation.unitInvalid");
      else if (data.unit.trim().length > MAX_UNIT)
        errs.unit = t("validation.unitLength", { count: MAX_UNIT });
      return errs;
    },
    [t]
  );

  const errors = validate(formData);

  const showError = (field: keyof TapSizeFormModel) =>
    Boolean((submittedOnce || touched[field]) && errors[field]);

  const handleChange = (field: keyof TapSizeFormModel, value: string | boolean) => {
    if (typeof value === "string") {
      let sanitizedValue = value.normalize("NFC");

      if (field === "sizeName") {
        sanitizedValue = sanitizePositiveDecimal(
          sanitizedValue,
          MAX_DECIMAL_PLACES
        );
        if (sanitizedValue.startsWith(".")) {
          sanitizedValue = `0${sanitizedValue}`;
        }
        const [integerPart, decimalPart] = sanitizedValue.split(".");
        sanitizedValue = integerPart.slice(0, MAX_INTEGER_DIGITS);
        if (decimalPart !== undefined) {
          sanitizedValue += `.${decimalPart}`;
        }
      } else if (field === "unit") {
        sanitizedValue = sanitizedValue.replace(LETTERS_ONLY_SANITIZE, "");
      }

      value = sanitizedValue.replace(/\s+/g, " ").trimStart();
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof TapSizeFormModel) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleClose = useCallback(() => {
    setOpen(false);
    router.push(listUrl);
  }, [router, listUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmittedOnce(true);
    if (Object.keys(validate(formData)).length > 0) return;

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateTapSizeAction(id!, formData)
        : await createTapSizeAction(formData);

      if (result.success) {
        toast.success(isEdit ? t("messages.updateSuccess") : t("messages.createSuccess"));
        setOpen(false);
        router.push(listUrl);
      } else {
        toast.error(result.error ?? tCommon("errors.generic"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Droplets size={20} />
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
        <>
          <CancelButton
            label={tCommon("buttons.cancel")}
            onClick={handleClose}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? tCommon("buttons.edit") : tCommon("buttons.save")}
            type="submit"
            form="tap-size-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form
        id="tap-size-form"
        onSubmit={handleSubmit}
        className="space-y-5 bg-[#F8FAFF] p-5"
        noValidate
      >
        {isEdit && (
          <StatusToggleField
            isActive={formData.isActive}
            onChange={() => handleChange("isActive", !formData.isActive)}
            labels={{
              title: t("form.activeStatusTitle"),
              activeText: t("form.activeStatusOn"),
              inactiveText: t("form.activeStatusOff"),
            }}
          />
        )}

        <div className="space-y-4">
          <div>

            <Input
              label={t("form.sizeName.label")}
              required
              id="tap-size-name"
              inputMode="decimal"
              value={formData.sizeName}
              onChange={(e) => handleChange("sizeName", e.target.value)}
              onBlur={() => handleBlur("sizeName")}
              placeholder={t("form.sizeName.placeholder")}
              maxLength={MAX_NAME}
              aria-invalid={showError("sizeName") ? "true" : "false"}
              aria-describedby={showError("sizeName") ? "tap-size-name-error" : undefined}
            />
            <ValidationMessage
              id="tap-size-name-error"
              message={errors.sizeName}
              visible={showError("sizeName")}
            />
          </div>

          <div>

            <Input
              label={t("form.unit.label")}

              id="tap-size-unit"
              value={formData.unit}
              onChange={(e) => handleChange("unit", e.target.value)}
              onBlur={() => handleBlur("unit")}
              placeholder={t("form.unit.placeholder")}
              maxLength={MAX_UNIT}
              disabled
              aria-invalid={showError("unit") ? "true" : "false"}
              aria-describedby={showError("unit") ? "tap-size-unit-error" : undefined}
            />
            <ValidationMessage
              id="tap-size-unit-error"
              message={errors.unit}
              visible={showError("unit")}
            />
          </div>
        </div>

        <MandatoryFieldsNotice message={tCommon("note.mandatory")} />
      </form>
    </Drawer>
  );
}
