"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Database } from "lucide-react";
import {
  Drawer,
  CancelButton,
  SaveButton,
  Input,
  Select,
  TextArea,
  Label,
  ToggleSwitch,
  ValidationMessage,
  FormStatusToggle,
} from "@/components/common";
import { validateChargeHeadInput } from "@/lib/api/water-bill/chargeHeads.schema";
import {
  WATER_BILL_ENUMS,
  CHARGE_HEAD_LIMITS,
  CHARGE_HEAD_CODE_SANITIZE,
  CHARGE_HEAD_NAME_SANITIZE,
} from "@/constants/waterBill.constants";
import { DESCRIPTION_SANITIZE } from "@/lib/utils/validation";
import type { ChargeHead, CreateChargeHeadDto } from "@/types/water-bill/chargeHeads.types";

const { CODE_MAX, NAME_MAX, NAME_LOCAL_MAX, DESCRIPTION_MAX } = CHARGE_HEAD_LIMITS;

interface ChargeHeadFormProps {
  open: boolean;
  initialData?: ChargeHead | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChargeHeadDto) => void;
}

function ToggleField({
  label,
  checked,
  enabledText,
  disabledText,
  onChange,
}: {
  label: string;
  checked: boolean;
  enabledText: string;
  disabledText: string;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="space-y-1 text-left">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <div className="flex items-center justify-between h-10 px-3 bg-slate-50/70 border border-slate-200 rounded-lg">
        <span className={`text-xs font-medium ${checked ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
          {checked ? enabledText : disabledText}
        </span>
        <ToggleSwitch
          checked={checked}
          onChange={onChange}
          showPopup={false}
          activeLabel={enabledText}
          inactiveLabel={disabledText}
        />
      </div>
    </div>
  );
}

function createSanitizedPasteHandler(
  fieldName: keyof CreateChargeHeadDto,
  maxLength: number,
  onFieldChange: (name: keyof CreateChargeHeadDto, val: string) => void,
  sanitizeRegex?: RegExp
) {
  return (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    let pasted = e.clipboardData.getData("text") || "";
    if (sanitizeRegex) {
      pasted = pasted.replace(sanitizeRegex, "");
    }
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? target.value.length;
    const current = target.value;
    const combined = current.slice(0, start) + pasted + current.slice(end);
    onFieldChange(fieldName, combined.slice(0, maxLength));
  };
}

export function ChargeHeadForm({
  open,
  initialData,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ChargeHeadFormProps) {
  const t = useTranslations("chargeHeads");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(initialData);

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [formData, setFormData] = useState<CreateChargeHeadDto>({
    chargeHeadCode: initialData?.chargeHeadCode ?? "",
    chargeHeadName: initialData?.chargeHeadName ?? "",
    chargeHeadNameLocal: initialData?.chargeHeadNameLocal ?? "",
    chargeType: initialData?.chargeType ?? "Charge",
    sequenceNo: initialData?.sequenceNo ?? 1,
    description: initialData?.description ?? "",
    isRefundable: initialData?.isRefundable ?? false,
    isRegularPay: initialData?.isRegularPay ?? false,
    isActive: initialData?.isActive ?? true,
  });

  const [sequenceNoValue, setSequenceNoValue] = useState<string>(
    initialData?.sequenceNo !== undefined ? String(initialData.sequenceNo) : "1"
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);
    if (open && initialData) {
      setFormData({
        chargeHeadCode: initialData.chargeHeadCode ?? "",
        chargeHeadName: initialData.chargeHeadName ?? "",
        chargeHeadNameLocal: initialData.chargeHeadNameLocal ?? "",
        chargeType: initialData.chargeType ?? "Charge",
        sequenceNo: initialData.sequenceNo ?? 1,
        description: initialData.description ?? "",
        isRefundable: initialData.isRefundable ?? false,
        isRegularPay: initialData.isRegularPay ?? false,
        isActive: initialData.isActive ?? true,
      });
      setSequenceNoValue(initialData.sequenceNo !== undefined ? String(initialData.sequenceNo) : "1");
      setTouched({});
      setErrors({});
      setSubmittedOnce(false);
    } else if (open && !initialData) {
      setFormData({
        chargeHeadCode: "",
        chargeHeadName: "",
        chargeHeadNameLocal: "",
        chargeType: "Charge",
        sequenceNo: 1,
        description: "",
        isRefundable: false,
        isRegularPay: false,
        isActive: true,
      });
      setSequenceNoValue("1");
      setTouched({});
      setErrors({});
      setSubmittedOnce(false);
    }
  }

  const runValidation = useCallback(
    (dataToValidate: CreateChargeHeadDto) => {
      const validationRes = validateChargeHeadInput(dataToValidate, (key, values) =>
        t(key as Parameters<typeof t>[0], values)
      );

      const errMap: Record<string, string> = {};
      if (!validationRes.isValid && validationRes.errors) {
        Object.entries(validationRes.errors).forEach(([field, msgs]) => {
          if (msgs && msgs.length > 0) {
            errMap[field] = msgs[0];
          }
        });
      }
      return {
        isValid: validationRes.isValid,
        errors: errMap,
        data: validationRes.data,
      };
    },
    [t]
  );

  const validate = useCallback(
    (dataToValidate: CreateChargeHeadDto): Record<string, string> => {
      return runValidation(dataToValidate).errors;
    },
    [runValidation]
  );

  const showError = useCallback(
    (field: string): boolean => (submittedOnce || touched[field]) && Boolean(errors[field]),
    [submittedOnce, touched, errors]
  );

  const handleFieldChange = (name: keyof CreateChargeHeadDto, rawVal: string | number | boolean) => {
    let sanitizedValue: string | number | boolean = rawVal;

    if (name === "chargeHeadCode") {
      const cleaned = String(rawVal).replace(CHARGE_HEAD_CODE_SANITIZE, "");
      const limited = cleaned.length > CODE_MAX ? cleaned.substring(0, CODE_MAX) : cleaned;
      sanitizedValue = limited.toUpperCase();
    } else if (name === "chargeHeadName") {
      const cleaned = String(rawVal).replace(CHARGE_HEAD_NAME_SANITIZE, "");
      sanitizedValue = cleaned.length > NAME_MAX ? cleaned.substring(0, NAME_MAX) : cleaned;
    } else if (name === "chargeHeadNameLocal") {
      const cleaned = String(rawVal).replace(CHARGE_HEAD_NAME_SANITIZE, "");
      sanitizedValue = cleaned.length > NAME_LOCAL_MAX ? cleaned.substring(0, NAME_LOCAL_MAX) : cleaned;
    } else if (name === "description") {
      const cleaned = String(rawVal).replace(DESCRIPTION_SANITIZE, "");
      sanitizedValue = cleaned.length > DESCRIPTION_MAX ? cleaned.substring(0, DESCRIPTION_MAX) : cleaned;
    } else if (name === "sequenceNo") {
      const cleaned = String(rawVal).replace(/[^0-9]/g, "");
      setSequenceNoValue(cleaned);
      const parsedSeq = cleaned === "" ? ("" as unknown as number) : parseInt(cleaned, 10);
      sanitizedValue = parsedSeq;
    }

    const updated = {
      ...formData,
      [name]: sanitizedValue,
    };
    setFormData(updated);

    if (submittedOnce || touched[name]) {
      const seqVal =
        name === "sequenceNo"
          ? String(rawVal).trim() === ""
            ? ("" as unknown as number)
            : parseInt(String(rawVal), 10)
          : sequenceNoValue.trim() === ""
          ? ("" as unknown as number)
          : parseInt(sequenceNoValue, 10);

      const toValidate: CreateChargeHeadDto = {
        ...updated,
        sequenceNo: seqVal,
      };
      const newErrMap = validate(toValidate);
      setErrors(newErrMap);
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const seqVal =
      sequenceNoValue.trim() === "" ? ("" as unknown as number) : parseInt(sequenceNoValue, 10);
    const toValidate: CreateChargeHeadDto = {
      ...formData,
      sequenceNo: seqVal,
    };
    const newErrMap = validate(toValidate);
    setErrors(newErrMap);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);

    const seqVal =
      sequenceNoValue.trim() === "" ? ("" as unknown as number) : parseInt(sequenceNoValue, 10);
    const dataToValidate: CreateChargeHeadDto = {
      ...formData,
      sequenceNo: seqVal,
    };

    const validationResult = runValidation(dataToValidate);
    setErrors(validationResult.errors);

    if (!validationResult.isValid || Object.keys(validationResult.errors).length > 0) {
      return;
    }

    const payloadToSubmit = validationResult.data ?? dataToValidate;
    onSubmit(payloadToSubmit);
  };

  const handleCodePaste = createSanitizedPasteHandler("chargeHeadCode", CODE_MAX, handleFieldChange, CHARGE_HEAD_CODE_SANITIZE);
  const handleNamePaste = createSanitizedPasteHandler("chargeHeadName", NAME_MAX, handleFieldChange, CHARGE_HEAD_NAME_SANITIZE);
  const handleNameLocalPaste = createSanitizedPasteHandler("chargeHeadNameLocal", NAME_LOCAL_MAX, handleFieldChange, CHARGE_HEAD_NAME_SANITIZE);
  const handleDescriptionPaste = createSanitizedPasteHandler("description", DESCRIPTION_MAX, handleFieldChange, DESCRIPTION_SANITIZE);
  const handleSequenceNoPaste = createSanitizedPasteHandler("sequenceNo", 6, handleFieldChange, /[^0-9]/g);

  const yesText = tCommon("yes");
  const noText = tCommon("no");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      className="border-l-4 border-slate-500"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Database size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("form.editTitle") : t("form.addTitle")}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("form.editSubtitle") : t("form.addSubtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton label={tCommon("buttons.cancel")} onClick={onClose} disabled={isSubmitting} />
          <SaveButton
            label={isEdit ? t("form.actions.update") : t("form.actions.save")}
            type="submit"
            form="charge-head-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="charge-head-form" onSubmit={handleSubmit} className="space-y-6 bg-slate-50 p-5">
        {/* Active Status Card at Top in Edit Mode Only */}
        <FormStatusToggle
          isEdit={isEdit}
          isActive={formData.isActive}
          onChange={(val) => handleFieldChange("isActive", val)}
          isSubmitting={isSubmitting}
          statusLabel={t("form.status.label")}
          description={formData.isActive ? t("form.active.activeHelp") : t("form.active.inactiveHelp")}
        />

        {/* Main Form Fields Container */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Row 1: Code | Name */}
            <div className="space-y-1">
              <Input
                label={t("form.fields.code.label")}
                value={formData.chargeHeadCode}
                onChange={(e) => handleFieldChange("chargeHeadCode", e.target.value)}
                onPaste={handleCodePaste}
                onBlur={() => handleBlur("chargeHeadCode")}
                placeholder={t("form.fields.code.placeholder")}
                required
                id="charge-head-code"
                maxLength={CODE_MAX}
                aria-describedby={showError("chargeHeadCode") ? "code-error" : undefined}
                aria-invalid={showError("chargeHeadCode") || undefined}
              />
              <ValidationMessage
                id="code-error"
                message={errors.chargeHeadCode}
                visible={showError("chargeHeadCode")}
              />
            </div>

            <div className="space-y-1">
              <Input
                label={t("form.fields.name.label")}
                value={formData.chargeHeadName}
                onChange={(e) => handleFieldChange("chargeHeadName", e.target.value)}
                onPaste={handleNamePaste}
                onBlur={() => handleBlur("chargeHeadName")}
                placeholder={t("form.fields.name.placeholder")}
                required
                id="charge-head-name"
                maxLength={NAME_MAX}
                aria-describedby={showError("chargeHeadName") ? "name-error" : undefined}
                aria-invalid={showError("chargeHeadName") || undefined}
              />
              <ValidationMessage
                id="name-error"
                message={errors.chargeHeadName}
                visible={showError("chargeHeadName")}
              />
            </div>

            {/* Row 2: Name (Local) | Charge Type */}
            <div className="space-y-1">
              <Input
                label={t("form.fields.nameLocal.label")}
                value={formData.chargeHeadNameLocal || ""}
                onChange={(e) => handleFieldChange("chargeHeadNameLocal", e.target.value)}
                onPaste={handleNameLocalPaste}
                onBlur={() => handleBlur("chargeHeadNameLocal")}
                placeholder={t("form.fields.nameLocal.placeholder")}
                id="charge-head-name-local"
                maxLength={NAME_LOCAL_MAX}
                aria-describedby={showError("chargeHeadNameLocal") ? "name-local-error" : undefined}
                aria-invalid={showError("chargeHeadNameLocal") || undefined}
              />
              <ValidationMessage
                id="name-local-error"
                message={errors.chargeHeadNameLocal}
                visible={showError("chargeHeadNameLocal")}
              />
            </div>

            <div className="space-y-1">
              <Select
                label={t("form.fields.chargeType.label")}
                value={formData.chargeType}
                onChange={(e) => handleFieldChange("chargeType", e.target.value)}
                onBlur={() => handleBlur("chargeType")}
                options={WATER_BILL_ENUMS.CHARGE_TYPES.map((type) => {
                  const key = `form.fields.chargeType.${type.toLowerCase()}` as Parameters<typeof t>[0];
                  return {
                    label: t(key),
                    value: type,
                  };
                })}
                required
              />
              <ValidationMessage
                id="charge-type-error"
                message={errors.chargeType}
                visible={showError("chargeType")}
              />
            </div>

            {/* Row 3: Refundable | Regular Pay */}
            <ToggleField
              label={t("form.fields.refundable.label")}
              checked={formData.isRefundable}
              enabledText={yesText}
              disabledText={noText}
              onChange={(checked) => handleFieldChange("isRefundable", checked)}
            />

            <ToggleField
              label={t("form.fields.regularPay.label")}
              checked={formData.isRegularPay}
              enabledText={yesText}
              disabledText={noText}
              onChange={(checked) => handleFieldChange("isRegularPay", checked)}
            />

            {/* Row 4: Sequence No */}
            <div className="space-y-1">
              <Input
                label={t("form.fields.sequenceNo.label")}
                type="text"
                inputMode="numeric"
                value={sequenceNoValue}
                onChange={(e) => handleFieldChange("sequenceNo", e.target.value)}
                onPaste={handleSequenceNoPaste}
                onBlur={() => handleBlur("sequenceNo")}
                placeholder={t("form.fields.sequenceNo.placeholder")}
                required
                id="sequence-no"
                aria-describedby={showError("sequenceNo") ? "sequence-no-error" : undefined}
                aria-invalid={showError("sequenceNo") || undefined}
              />
              <ValidationMessage
                id="sequence-no-error"
                message={errors.sequenceNo}
                visible={showError("sequenceNo")}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <TextArea
              label={t("form.fields.description.label")}
              value={formData.description || ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              onPaste={handleDescriptionPaste}
              onBlur={() => handleBlur("description")}
              placeholder={t("form.fields.description.placeholder")}
              id="description"
              rows={3}
              maxLength={DESCRIPTION_MAX}
              showCharCount={true}
              charCountLabel="characters"
              error={showError("description")}
              aria-describedby={showError("description") ? "description-error" : undefined}
              aria-invalid={showError("description") ? "true" : "false"}
            />
            <ValidationMessage
              id="description-error"
              message={errors.description}
              visible={showError("description")}
            />
          </div>
        </div>
      </form>
    </Drawer>
  );
}
