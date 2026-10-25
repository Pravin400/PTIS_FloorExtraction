"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type {
  WaterPenaltyRuleDto,
  CreateWaterPenaltyRuleModel,
} from "@/types/water-bill/penalty-rule-master.types";
import { savePenaltyRuleAction } from "@/app/[locale]/water-bill/penalty-rule-master/action";

export interface UsePenaltyRuleFormProps {
  open?: boolean;
  onClose?: () => void;
  onSave?: (model: CreateWaterPenaltyRuleModel) => Promise<{ success: boolean; error?: string }>;
  initialData?: WaterPenaltyRuleDto | null;
  t?: (key: string) => string;
  listPath?: string;
}

export function usePenaltyRuleForm({
  open = true,
  onClose,
  onSave,
  initialData,
  t: tProp,
  listPath = "/water-bill/penalty-rule-master",
}: UsePenaltyRuleFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const listUrl = `/${locale}${listPath}`;
  const tTranslations = useTranslations("waterPenaltyRule");
  const t = tProp || tTranslations;

  const getEmptyFormData = (): CreateWaterPenaltyRuleModel => ({
    financialYearId: undefined as unknown as number,
    connectionCategoryId: undefined,
    geographyUnitId: undefined,
    chargeHeadId: undefined,
    penaltyType: "Percentage",
    fromDay: 0,
    toDay: null,
    percentageRate: null,
    flatAmount: null,
    maximumAmount: null,
    effectiveFrom: "",
    effectiveTo: "",
    isCurrentBill: true,
    isPendingBill: false,
    isActive: true,
  });

  const mapInitialDataToFormData = (data: WaterPenaltyRuleDto): CreateWaterPenaltyRuleModel => ({
    financialYearId: data.financialYearId,
    connectionCategoryId:
      data.connectionCategoryId != null && Number(data.connectionCategoryId) > 0
        ? Number(data.connectionCategoryId)
        : (data.connectionCategoryId === 0 ? 0 : null),
    geographyUnitId:
      data.geographyUnitId != null && Number(data.geographyUnitId) > 0
        ? Number(data.geographyUnitId)
        : (data.geographyUnitId === 0 ? 0 : null),
    chargeHeadId:
      data.chargeHeadId != null && Number(data.chargeHeadId) > 0
        ? Number(data.chargeHeadId)
        : (data.chargeHeadId === 0 ? 0 : null),
    penaltyType: data.penaltyType || "Percentage",
    fromDay: data.fromDay,
    toDay: data.toDay ?? null,
    percentageRate: data.percentageRate ?? null,
    flatAmount: data.flatAmount ?? null,
    maximumAmount: data.maximumAmount ?? null,
    effectiveFrom: data.effectiveFrom ? data.effectiveFrom.split("T")[0] : "",
    effectiveTo: data.effectiveTo ? data.effectiveTo.split("T")[0] : "",
    isCurrentBill: data.isCurrentBill ?? true,
    isPendingBill: data.isPendingBill ?? false,
    isActive: data.isActive ?? true,
  });

  const [formData, setFormData] = useState<CreateWaterPenaltyRuleModel>(() => {
    return initialData ? mapInitialDataToFormData(initialData) : getEmptyFormData();
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = initialData != null;

  // Re-initialise the form whenever the target rule or open state changes
  const formInitKey = `${initialData?.penaltyRuleId ?? "new"}-${initialData?.updatedDate ?? ""}-${String(open)}`;
  const [prevFormInitKey, setPrevFormInitKey] = useState(formInitKey);
  if (prevFormInitKey !== formInitKey) {
    setPrevFormInitKey(formInitKey);
    setFormData(initialData ? mapInitialDataToFormData(initialData) : getEmptyFormData());
  }

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push(listUrl);
    }
  };

  const handleToggleStatus = (newChecked?: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isActive: typeof newChecked === "boolean" ? newChecked : !prev.isActive,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.financialYearId || Number(formData.financialYearId) <= 0 || isNaN(Number(formData.financialYearId))) {
      toast.error(t("validation.yearRequired") || "Financial Year is required");
      return;
    }
    if (!formData.penaltyType) {
      toast.error(t("validation.penaltyTypeRequired") || "Penalty calculation type is required");
      return;
    }
    if (formData.fromDay === null || formData.fromDay === undefined || isNaN(formData.fromDay) || formData.fromDay < 0) {
      toast.error(t("validation.fromDayInvalid") || "From Overdue Day must be 0 or greater");
      return;
    }
    if (formData.toDay !== null && formData.toDay !== undefined && formData.fromDay > formData.toDay) {
      toast.error(t("validation.dayRangeInvalid") || "To Day must be greater than or equal to From Day");
      return;
    }
    if (!formData.effectiveFrom) {
      toast.error(t("validation.effectiveFromRequired") || "Effective From Date is required");
      return;
    }
    if (!formData.effectiveTo) {
      toast.error(t("validation.effectiveToRequired") || "Effective To Date is required");
      return;
    }
    if (formData.effectiveFrom && formData.effectiveTo && formData.effectiveTo < formData.effectiveFrom) {
      toast.error(t("validation.dateRangeInvalid") || "Effective To Date must be on or after Effective From Date");
      return;
    }
    if (!formData.isCurrentBill && !formData.isPendingBill) {
      toast.error(
        t("validation.billTypeRequired") || "At least one of Current Bill or Pending Bill must be selected"
      );
      return;
    }

    if (formData.penaltyType === "Percentage" || formData.penaltyType === "MonthlyPercentage") {
      if (
        formData.percentageRate === null ||
        formData.percentageRate === undefined ||
        isNaN(formData.percentageRate) ||
        formData.percentageRate < 0
      ) {
        toast.error(t("validation.rateRequired") || "Percentage Rate is required and must be 0 or greater");
        return;
      }
    } else if (formData.penaltyType === "Flat") {
      if (
        formData.flatAmount === null ||
        formData.flatAmount === undefined ||
        isNaN(formData.flatAmount) ||
        formData.flatAmount < 0
      ) {
        toast.error(t("validation.flatRequired") || "Flat Amount is required and must be 0 or greater");
        return;
      }
    }

    const normalizedData: CreateWaterPenaltyRuleModel = {
      ...formData,
      financialYearId: Number(formData.financialYearId),
      connectionCategoryId:
        formData.connectionCategoryId != null && Number(formData.connectionCategoryId) > 0
          ? Number(formData.connectionCategoryId)
          : null,
      geographyUnitId:
        formData.geographyUnitId != null && Number(formData.geographyUnitId) > 0
          ? Number(formData.geographyUnitId)
          : null,
      chargeHeadId:
        formData.chargeHeadId != null && Number(formData.chargeHeadId) > 0
          ? Number(formData.chargeHeadId)
          : null,
      fromDay: Number(formData.fromDay),
      toDay: formData.toDay !== null && formData.toDay !== undefined ? Number(formData.toDay) : null,
      percentageRate:
        (formData.penaltyType === "Percentage" || formData.penaltyType === "MonthlyPercentage") &&
        formData.percentageRate !== null &&
        formData.percentageRate !== undefined
          ? Number(formData.percentageRate)
          : null,
      flatAmount:
        formData.penaltyType === "Flat" && formData.flatAmount !== null && formData.flatAmount !== undefined
          ? Number(formData.flatAmount)
          : null,
      maximumAmount:
        formData.maximumAmount !== null && formData.maximumAmount !== undefined
          ? Number(formData.maximumAmount)
          : null,
    };

    setIsSubmitting(true);
    let result: { success: boolean; error?: string };
    if (onSave) {
      result = await onSave(normalizedData);
      if (result.success) {
        handleClose();
      }
    } else {
      const saveRes = await savePenaltyRuleAction(
        isEdit && initialData?.penaltyRuleId ? initialData.penaltyRuleId : null,
        normalizedData
      );
      result = saveRes;
      if (saveRes.success) {
        toast.success(
          isEdit
            ? t("messages.updateSuccess") || "Penalty rule updated successfully."
            : t("messages.createSuccess") || "Penalty rule created successfully."
        );
        handleClose();
        router.refresh();
      }
    }
    setIsSubmitting(false);
    if (!result.success && result.error) {
      toast.error(result.error);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    isEdit,
    handleClose,
    handleToggleStatus,
    handleSubmit,
  };
}
