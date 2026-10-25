"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Drawer, CancelButton, SaveButton, Input, Select, ValidationMessage, FormStatusToggle, useToast } from "@/components/common";
import { LayoutGrid, AlertCircle } from "lucide-react";
import type { TariffChargeData } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";
import { getNextSequenceNoAction } from "@/app/[locale]/water-bill/tariff-workbench/charge-details/actions";

export interface TariffChargeLookupOption {
  value: string;
  label: string;
}

export interface TariffChargeDetailFormData {
  tariffId: number;
  chargeHeadId: number;
  geographyUnitId: number | null;
  amount: number | "";
  isDynamic: boolean | "";
  isMandatory: boolean | "";
  sequenceNo: number | "";
  isActive: boolean;
}

export interface TariffChargeDetailFormProps {
  open: boolean;
  initialData?: TariffChargeData | null;
  tariffOptions?: TariffChargeLookupOption[];
  chargeHeadOptions?: TariffChargeLookupOption[];
  geographyUnitOptions?: TariffChargeLookupOption[];
  isSubmitting?: boolean;
  nextSequenceNo?: number;
  onClose: () => void;
  onSubmit: (data: TariffChargeDetailFormData) => void | Promise<void>;
}

export function TariffChargeDetailForm({
  open,
  initialData,
  tariffOptions = [],
  chargeHeadOptions = [],
  geographyUnitOptions = [],
  isSubmitting = false,
  nextSequenceNo,
  onClose,
  onSubmit,
}: TariffChargeDetailFormProps) {
  const t = useTranslations("tariffWorkbench");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const isEdit = Boolean(initialData);

  const boolOptions = [
    { value: "true", label: t("table.yes") },
    { value: "false", label: t("table.no") },
  ];

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isSequenceLoading, setIsSequenceLoading] = useState(false);
  const latestSequenceRequestIdRef = useRef(0);
  const [formData, setFormData] = useState<TariffChargeDetailFormData>({
    tariffId: initialData?.tariffId ?? 0,
    chargeHeadId: initialData?.chargeHeadId ?? 0,
    geographyUnitId: initialData?.geographyUnitId ?? null,
    amount: initialData?.amount ?? "",
    isDynamic: initialData?.isDynamic ?? "",
    isMandatory: initialData?.isMandatory ?? "",
    sequenceNo: initialData?.sequenceNo ?? nextSequenceNo ?? "",
    isActive: initialData?.isActive ?? true,
  });
  const [touched, setTouched] = useState<Partial<Record<keyof TariffChargeDetailFormData, boolean>>>({});
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (open !== prevOpen || initialData !== prevInitialData) {
    setIsSequenceLoading(false);
    setPrevOpen(open);
    setPrevInitialData(initialData);
    setFormData({
      tariffId: initialData?.tariffId ?? 0,
      chargeHeadId: initialData?.chargeHeadId ?? 0,
      geographyUnitId: initialData?.geographyUnitId ?? null,
      amount: initialData?.amount ?? "",
      isDynamic: initialData?.isDynamic ?? "",
      isMandatory: initialData?.isMandatory ?? "",
      sequenceNo: initialData?.sequenceNo ?? nextSequenceNo ?? "",
      isActive: initialData?.isActive ?? true,
    });
    setSubmittedOnce(false);
    setTouched({});
  }

  useEffect(() => {
    latestSequenceRequestIdRef.current++;
  }, [open, initialData]);

  const validate = useCallback((data: TariffChargeDetailFormData) => {
    const errs: Partial<Record<keyof TariffChargeDetailFormData, string>> = {};
    if (data.tariffId <= 0) errs.tariffId = t("errors.tariffNameRequired") || "Tariff Name is required";
    if (data.chargeHeadId <= 0) errs.chargeHeadId = t("errors.chargeHeadRequired") || "Charge Head is required";
    if (data.isDynamic === "") errs.isDynamic = t("validation.isDynamicRequired") || "Dynamic selection is required";
    if (data.isMandatory === "") errs.isMandatory = t("validation.isMandatoryRequired") || "Mandatory selection is required";
    if (data.amount === "") {
      errs.amount = t("validation.amountRequired") || t("errors.amountRequired") || "Amount is required";
    } else if (Number(data.amount) < 0) {
      errs.amount = t("errors.amountInvalid") || "Amount must be >= 0";
    } else if (data.isDynamic === true && Number(data.amount) !== 0) {
      errs.amount = t("errors.dynamicAmountNonZero") || "Amount must be 0 when Dynamic is Yes";
    }
    if (isEdit && (data.sequenceNo === "" || Number(data.sequenceNo) < 1)) {
      errs.sequenceNo = t("errors.sequenceNoInvalid") || "Sequence must be >= 1";
    }
    return errs;
  }, [t, isEdit]);

  const errors = validate(formData);
  const showError = (field: keyof TariffChargeDetailFormData) =>
    Boolean((submittedOnce || touched[field]) && errors[field]);
  const visibleTariffOptions = initialData?.tariffId && !tariffOptions.some((option) => option.value === String(initialData.tariffId))
    ? [{ value: String(initialData.tariffId), label: initialData.tariffName }, ...tariffOptions]
    : tariffOptions;
  const visibleChargeHeadOptions = initialData?.chargeHeadId && !chargeHeadOptions.some((option) => option.value === String(initialData.chargeHeadId))
    ? [{ value: String(initialData.chargeHeadId), label: initialData.chargeHeadName }, ...chargeHeadOptions]
    : chargeHeadOptions;
  const visibleGeographyUnitOptions = initialData?.geographyUnitId != null && !geographyUnitOptions.some((option) => option.value === String(initialData.geographyUnitId))
    ? [{ value: String(initialData.geographyUnitId), label: initialData.geographyUnitName }, ...geographyUnitOptions]
    : geographyUnitOptions;

  const handleChange = async (field: keyof TariffChargeDetailFormData, value: string | number | boolean | null) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "isDynamic" && value === true) {
        next.amount = 0;
      }
      return next;
    });

    if (field === "tariffId" && !isEdit) {
      const selectedTariffId = Number(value) || 0;
      if (selectedTariffId > 0) {
        const requestId = ++latestSequenceRequestIdRef.current;
        setIsSequenceLoading(true);
        try {
          const nextSeq = await getNextSequenceNoAction(selectedTariffId);
          // Verify that this is still the latest request AND the form's selected tariff is still this tariff
          if (requestId === latestSequenceRequestIdRef.current) {
            setFormData((prev) => {
              if (Number(prev.tariffId) === selectedTariffId) {
                return { ...prev, sequenceNo: nextSeq };
              }
              return prev;
            });
          }
        } catch (_e) {
          // Fallback or ignore
        } finally {
          if (requestId === latestSequenceRequestIdRef.current) {
            setIsSequenceLoading(false);
          }
        }
      } else {
        latestSequenceRequestIdRef.current++;
        setIsSequenceLoading(false);
        setFormData((prev) => ({ ...prev, sequenceNo: "" }));
      }
    }
  };

  const handleBlur = (field: keyof TariffChargeDetailFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSequenceLoading) {
      return;
    }
    setSubmittedOnce(true);
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs).join(" | "));
      return;
    }
    const submitData = {
      ...formData,
      amount: formData.amount === "" ? ("" as unknown as number) : Number(formData.amount),
      sequenceNo: formData.sequenceNo === "" ? 0 : Number(formData.sequenceNo),
    };
    onSubmit(submitData);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="md"
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <LayoutGrid size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("editChargeDetailTitle") || "Edit Charge Detail" : t("addChargeDetailTitle") || "Add Charge Detail"}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? "Update Charge Detail parameters" : "Configure charge parameters"}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <CancelButton label={tCommon("buttons.cancel")} onClick={onClose} disabled={isSubmitting} />
          <SaveButton
            label={isEdit ? (tCommon("buttons.update") || "Update") : (tCommon("buttons.save") || "Save")}
            type="submit"
            form="tariff-charge-detail-form"
            isLoading={isSubmitting || isSequenceLoading}
            disabled={isSubmitting || isSequenceLoading}
          />
        </div>
      }
    >
      <form
        id="tariff-charge-detail-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col justify-between h-full bg-[#F8FAFF] p-5 space-y-5"
      >
        <div className="space-y-4">
          <FormStatusToggle
            isEdit={isEdit}
            isActive={Boolean(formData.isActive)}
            onChange={(checked) => handleChange("isActive", checked)}
            statusLabel={formData.isActive ? tCommon("status.active") : tCommon("status.inactive")}
            description={formData.isActive ? t("form.activeStatusOn") : t("form.activeStatusOff")}
            isSubmitting={isSubmitting}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
            <Select
              required
              label={t("table.tariffName")}
              value={formData.tariffId ? String(formData.tariffId) : ""}
              onChange={(e) => handleChange("tariffId", Number(e.target.value))}
              onBlur={() => handleBlur("tariffId")}
              options={visibleTariffOptions}
              placeholder="Select Tariff Name"
              className={`${showError("tariffId") ? "!border-red-500 focus:!ring-red-500 [&>button]:!border-red-500 [&>button]:focus:!ring-red-400" : ""} [&>ul]:!top-full [&>ul]:!bottom-auto [&>ul]:!mt-1 [&>ul]:!mb-0`}
            />
            <ValidationMessage message={errors.tariffId} visible={showError("tariffId")} />
            {isSequenceLoading && (
              <span className="text-xs text-blue-600 animate-pulse">
                {t("messages.sequenceLoading") || "Determining next sequence..."}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <Select
              required
              label={t("table.chargeHeadName") }
              value={formData.chargeHeadId ? String(formData.chargeHeadId) : ""}
              onChange={(e) => handleChange("chargeHeadId", Number(e.target.value))}
              onBlur={() => handleBlur("chargeHeadId")}
              options={visibleChargeHeadOptions}
              placeholder="Select Charge Head"
              className={`${showError("chargeHeadId") ? "!border-red-500 focus:!ring-red-500 [&>button]:!border-red-500 [&>button]:focus:!ring-red-400" : ""} [&>ul]:!top-full [&>ul]:!bottom-auto [&>ul]:!mt-1 [&>ul]:!mb-0`}
            />
            <ValidationMessage message={errors.chargeHeadId} visible={showError("chargeHeadId")} />
          </div>

          <div className="space-y-1 col-span-1 md:col-span-2">
            <Select
              label={t("table.geographyUnit")}
              value={formData.geographyUnitId != null ? String(formData.geographyUnitId) : ""}
              onChange={(e) => handleChange("geographyUnitId", e.target.value ? Number(e.target.value) : null)}
              onBlur={() => handleBlur("geographyUnitId")}
              options={visibleGeographyUnitOptions}
              placeholder="Select Geography Unit"
              className="[&>ul]:!top-full [&>ul]:!bottom-auto [&>ul]:!mt-1 [&>ul]:!mb-0"
            />
          </div>

          <div className="space-y-1 col-span-1 md:col-span-2">
            <Input
              required
              type="number"
              label={t("table.amount")}
              placeholder="e.g: 0"
              value={String(formData.amount)}
              disabled={formData.isDynamic === true}
              onChange={(e) => {
                const val = e.target.value;
                const num = val === "" ? "" : Number(val);
                handleChange("amount", num !== "" && num < 0 ? 0 : num);
              }}
              onKeyDown={(e) => { if (e.key === "-") e.preventDefault(); }}
              onBlur={() => handleBlur("amount")}
              min={0}
              className={showError("amount") ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            <ValidationMessage message={errors.amount} visible={showError("amount")} />
            {formData.isDynamic === true && (
              <span className="text-xs text-slate-500 block">
                {t("errors.dynamicAmountNonZero") || "Amount must be 0 when Dynamic is Yes"}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <Select
              required
              label={t("table.isDynamic")}
              value={formData.isDynamic === "" ? "" : String(formData.isDynamic)}
              onChange={(e) => handleChange("isDynamic", e.target.value === "" ? "" : e.target.value === "true")}
              options={boolOptions}
              placeholder="Select Dynamic"
              className={`${showError("isDynamic") ? "!border-red-500 focus:!ring-red-500 [&>button]:!border-red-500 [&>button]:focus:!ring-red-400" : ""} [&>ul]:!top-full [&>ul]:!bottom-auto [&>ul]:!mt-1 [&>ul]:!mb-0`}
            />
            <ValidationMessage message={errors.isDynamic} visible={showError("isDynamic")} />
          </div>

          <div className="space-y-1">
            <Select
              required
              label={t("table.isMandatory")}
              value={formData.isMandatory === "" ? "" : String(formData.isMandatory)}
              onChange={(e) => handleChange("isMandatory", e.target.value === "" ? "" : e.target.value === "true")}
              options={boolOptions}
              placeholder="Select Mandatory"
              className={`${showError("isMandatory") ? "!border-red-500 focus:!ring-red-500 [&>button]:!border-red-500 [&>button]:focus:!ring-red-400" : ""} [&>ul]:!top-full [&>ul]:!bottom-auto [&>ul]:!mt-1 [&>ul]:!mb-0`}
            />
            <ValidationMessage message={errors.isMandatory} visible={showError("isMandatory")} />
          </div>

          {isEdit && (
            <div className="space-y-1">
              <Input
                required
                type="number"
                label={t("table.sequenceNo")}
                placeholder="e.g: 1"
                value={String(formData.sequenceNo)}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = val === "" ? "" : Number(val);
                  handleChange("sequenceNo", num !== "" && num < 1 ? 1 : num);
                }}
                onKeyDown={(e) => { if (e.key === "-") e.preventDefault(); }}
                onBlur={() => handleBlur("sequenceNo")}
                min={1}
                className={showError("sequenceNo") ? "!border-red-500 focus:!ring-red-500" : ""}
              />
              <ValidationMessage message={errors.sequenceNo} visible={showError("sequenceNo")} />
            </div>
          )}
        </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
          <AlertCircle size={14} className="shrink-0" />
          <span>{tCommon("note.mandatory") || "* Mandatory fields must be filled"}</span>
        </div>
      </form>
    </Drawer>
  );
}
