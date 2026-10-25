"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";

import { Drawer, CancelButton, SaveButton } from "@/components/common";
import type {
  CreateBillingPeriodDto,
  BillingPeriodInput,
  BillingPeriodFormProps,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";
import {
  getFrequencyPeriodsPerYear,
  calculateBillingPeriodSequenceNo,
  getFinancialYearDates,
} from "@/lib/utils/water-bill/billing-configuration/billingPeriodCalculation.utils";
import { BillingPeriodFormFields } from "./BillingPeriodFormFields";
import { validateBillingPeriodFormData } from "./billingPeriodFormValidation";

const formatDateInputValue = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
};

export function BillingPeriodForm({
  open,
  initialData,
  financialYearOptions = [],
  billingFrequencyOptions = [],
  existingPeriods = [],
  isSubmitting = false,
  onClose,
  onSubmit,
}: BillingPeriodFormProps) {
  const t = useTranslations("billingPeriodMaster");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(initialData);

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [formData, setFormData] = useState<BillingPeriodInput>({
    id: initialData?.id,
    billingPeriodCode: initialData?.billingPeriodCode ?? "",
    financialYearId:
      initialData?.financialYearId !== undefined && initialData?.financialYearId !== null
        ? String(initialData.financialYearId)
        : "",
    billingFrequencyId:
      initialData?.billingFrequencyId !== undefined && initialData?.billingFrequencyId !== null
        ? String(initialData.billingFrequencyId)
        : "",
    sequenceNo:
      initialData?.sequenceNo !== undefined && initialData?.sequenceNo !== null
        ? initialData.sequenceNo
        : undefined,
    periodFromDate: formatDateInputValue(initialData?.periodFromDate),
    periodToDate: formatDateInputValue(initialData?.periodToDate),
    billGenerationDate: formatDateInputValue(initialData?.billGenerationDate),
    dueDate: formatDateInputValue(initialData?.dueDate),
    graceDays:
      initialData?.graceDays !== undefined && initialData?.graceDays !== null
        ? initialData.graceDays
        : 0,
    currentPenaltyStartDate: formatDateInputValue(initialData?.currentPenaltyStartDate),
    currentPenaltyEndDate: formatDateInputValue(initialData?.currentPenaltyEndDate),
    pendingPenaltyStartDate: formatDateInputValue(initialData?.pendingPenaltyStartDate),
    pendingPenaltyEndDate: formatDateInputValue(initialData?.pendingPenaltyEndDate),
    isActive: initialData?.isActive ?? true,
  });
  const [touched, setTouched] = useState<Partial<Record<keyof BillingPeriodInput, boolean>>>({});

  const selectedFyOption = financialYearOptions.find(
    (o) => o.value === String(formData.financialYearId)
  );
  const { startDate: yearStartDate, endDate: yearEndDate } = getFinancialYearDates(selectedFyOption);

  // Slot calculation to check if all periods are already created
  const selectedBfOption = billingFrequencyOptions.find(
    (o) => o.value === String(formData.billingFrequencyId)
  );
  const periodsPerYear = getFrequencyPeriodsPerYear(selectedBfOption);
  const matchingPeriods = existingPeriods.filter(
    (p) =>
      String(p.financialYearId) === String(formData.financialYearId) &&
      String(p.billingFrequencyId) === String(formData.billingFrequencyId) &&
      (!isEdit || p.id !== initialData?.id)
  );
  const existingCount = matchingPeriods.length;
  const isMaxLimitReached = !isEdit && periodsPerYear > 0 && existingCount >= periodsPerYear;

  const currentSequenceNo = isEdit && (formData.sequenceNo ?? initialData?.sequenceNo)
    ? Number(formData.sequenceNo ?? initialData?.sequenceNo)
    : calculateBillingPeriodSequenceNo(
        formData.periodFromDate,
        periodsPerYear,
        yearStartDate,
        formData.sequenceNo ?? initialData?.sequenceNo,
        existingPeriods,
        formData.financialYearId,
        formData.billingFrequencyId,
        initialData?.id
      );
  const isFirstPeriod = currentSequenceNo === 1;
  const isLastPeriod = periodsPerYear > 0 && currentSequenceNo === periodsPerYear;

  const [lastModifiedField, setLastModifiedField] = useState<keyof BillingPeriodInput | null>(null);

  const validate = useCallback(
    (data: BillingPeriodInput, fieldModified?: keyof BillingPeriodInput | null) =>
      validateBillingPeriodFormData(
        data,
        t,
        fieldModified !== undefined ? fieldModified : lastModifiedField,
        {
          yearStartDate,
          yearEndDate,
          isFirstPeriod,
          isLastPeriod,
        }
      ),
    [t, lastModifiedField, yearStartDate, yearEndDate, isFirstPeriod, isLastPeriod]
  );

  const errors = validate(formData);
  const [focusedField, setFocusedField] = useState<keyof BillingPeriodInput | null>(null);

  const showError = (field: keyof BillingPeriodInput) => {
    if (!errors[field]) return false;
    // Don't show "required" error while user is actively focused on the field
    if (focusedField === field && errors[field]?.toLowerCase().includes("required")) {
      return false;
    }
    const hasValue =
      formData[field] !== undefined &&
      formData[field] !== "" &&
      formData[field] !== null;

    return Boolean((submittedOnce || touched[field] || hasValue) && errors[field]);
  };

  const handleUpdate = (updates: Partial<BillingPeriodInput>) => {
    if ("financialYearId" in updates) {
      setLastModifiedField("financialYearId");
    } else if ("billingFrequencyId" in updates) {
      setLastModifiedField("billingFrequencyId");
    } else if ("currentPenaltyEndDate" in updates) {
      setLastModifiedField("currentPenaltyEndDate");
    } else if ("dueDate" in updates) {
      setLastModifiedField("dueDate");
    } else if ("graceDays" in updates) {
      setLastModifiedField("graceDays");
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleChange = (
    field: keyof BillingPeriodInput,
    value: string | number | boolean
  ) => {
    setLastModifiedField(field);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFocus = (field: keyof BillingPeriodInput) => {
    setFocusedField(field);
  };

  const handleBlur = (field: keyof BillingPeriodInput) => {
    setFocusedField(null);
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaxLimitReached) return;
    setSubmittedOnce(true);
    setLastModifiedField(null);
    if (Object.keys(validate(formData, null)).length > 0) return;

    const toIsoOrNull = (dateStr?: string | null) =>
      dateStr && dateStr.trim() ? new Date(dateStr).toISOString() : null;

    const selectedFy = selectedFyOption?.label || "FY";

    const selectedBfOption = billingFrequencyOptions.find(
      (o) => o.value === String(formData.billingFrequencyId)
    );
    const bfCode = String(
      selectedBfOption?.data?.billingFrequencyCode ||
      selectedBfOption?.data?.code ||
      selectedBfOption?.label ||
      "BP"
    )
      .toUpperCase()
      .replace(/\s+/g, "");
    const periodsPerYear = Number(selectedBfOption?.data?.periodsPerYear) || 1;

    // Format: FinancialYear-BillingFrequencyCode+Count (e.g. 2022-QUARTERLY1, 2022-QUARTERLY2)
    const sequenceNo = isEdit && (initialData?.sequenceNo ?? formData.sequenceNo)
      ? Number(initialData?.sequenceNo ?? formData.sequenceNo)
      : calculateBillingPeriodSequenceNo(
          formData.periodFromDate,
          periodsPerYear,
          yearStartDate,
          initialData?.sequenceNo ?? formData.sequenceNo,
          existingPeriods,
          formData.financialYearId,
          formData.billingFrequencyId,
          initialData?.id
        );

    const generatedCode =
      initialData?.billingPeriodCode || `${selectedFy}-${bfCode}${sequenceNo}`;

    const submissionData: CreateBillingPeriodDto = {
      billingPeriodCode: generatedCode,
      financialYearId: Number(formData.financialYearId),
      billingFrequencyId: Number(formData.billingFrequencyId),
      sequenceNo,
      periodFromDate: new Date(formData.periodFromDate).toISOString(),
      periodToDate: new Date(formData.periodToDate).toISOString(),
      billGenerationDate: toIsoOrNull(formData.billGenerationDate),
      dueDate: toIsoOrNull(formData.dueDate),
      graceDays: Number(formData.graceDays) || 0,
      currentPenaltyStartDate: toIsoOrNull(formData.currentPenaltyStartDate),
      currentPenaltyEndDate: toIsoOrNull(formData.currentPenaltyEndDate),
      pendingPenaltyStartDate: toIsoOrNull(formData.pendingPenaltyStartDate),
      pendingPenaltyEndDate: toIsoOrNull(formData.pendingPenaltyEndDate),
      isActive: Boolean(formData.isActive),
    };
    onSubmit(submissionData);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <CalendarDays size={20} />
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
            form="billing-period-form"
            isLoading={isSubmitting}
            disabled={isSubmitting || isMaxLimitReached}
          />
        </div>
      }
    >
      <form id="billing-period-form" onSubmit={handleSubmit} noValidate className="p-6 space-y-5 bg-white">
        <BillingPeriodFormFields
          formData={formData}
          errors={errors}
          showError={showError}
          handleChange={handleChange}
          handleUpdate={handleUpdate}
          handleBlur={handleBlur}
          handleFocus={handleFocus}
          financialYearOptions={financialYearOptions}
          billingFrequencyOptions={billingFrequencyOptions}
          existingPeriods={existingPeriods}
          isSubmitting={isSubmitting}
          isEdit={isEdit}
        />
      </form>
    </Drawer>
  );
}
