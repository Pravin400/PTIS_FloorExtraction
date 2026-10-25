"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Drawer, CancelButton, SaveButton, useToast } from "@/components/common";
import { LayoutGrid, AlertCircle } from "lucide-react";
import { TariffFormFields } from "./TariffFormFields";
import { createTariffWorkbenchSchema } from "@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema";
import type {
  CreateTariffWorkbenchDto,
  TariffFormProps,
} from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

export type { TariffFormProps };

export function TariffForm({
  open,
  initialData,
  isSubmitting = false,
  financialYearOptions = [],
  connectionTypeOptions = [],
  connectionCategoryOptions = [],
  tapSizeOptions = [],
  onClose,
  onSubmit,
}: TariffFormProps) {
  const t = useTranslations("tariffWorkbench");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const isEdit = Boolean(initialData);

  const defaultFyId = 0;
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [formData, setFormData] = useState<CreateTariffWorkbenchDto>({
    tariffCode: initialData?.tariffCode ?? "",
    tariffName: initialData?.tariffName ?? "",
    financialYearId: (initialData?.financialYearId || initialData?.yearId) ?? defaultFyId,
    connectionTypeId: initialData?.connectionTypeId ?? null,
    connectionCategoryId: initialData?.connectionCategoryId ?? null,
    tapSizeId: initialData?.tapSizeId ?? null,
    effectiveFrom: initialData?.effectiveFrom ? initialData.effectiveFrom.split("T")[0] : "",
    effectiveTo: initialData?.effectiveTo ? initialData.effectiveTo.split("T")[0] : "",
    versionNo: initialData?.versionNo ?? 1,
    status: initialData?.status ?? "Draft",
    description: initialData?.description ?? "",
    isActive: initialData?.isActive ?? true,
  });
  const [touched, setTouched] = useState<Partial<Record<keyof CreateTariffWorkbenchDto, boolean>>>({});
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);
    setFormData({
      tariffCode: initialData?.tariffCode ?? "",
      tariffName: initialData?.tariffName ?? "",
      financialYearId: (initialData?.financialYearId || initialData?.yearId) ?? defaultFyId,
      connectionTypeId: initialData?.connectionTypeId ?? null,
      connectionCategoryId: initialData?.connectionCategoryId ?? null,
      tapSizeId: initialData?.tapSizeId ?? null,
      effectiveFrom: initialData?.effectiveFrom ? initialData.effectiveFrom.split("T")[0] : "",
      effectiveTo: initialData?.effectiveTo ? initialData.effectiveTo.split("T")[0] : "",
      versionNo: initialData?.versionNo ?? 1,
      status: initialData?.status ?? "Draft",
      description: initialData?.description ?? "",
      isActive: initialData?.isActive ?? true,
    });
    setSubmittedOnce(false);
    setTouched({});
  }

  const validate = useCallback((data: CreateTariffWorkbenchDto) => {
    const res = createTariffWorkbenchSchema(t).safeParse(data);
    const errs: Partial<Record<keyof CreateTariffWorkbenchDto, string>> = {};
    if (!res.success) {
      for (const [key, msgs] of Object.entries(res.error.flatten().fieldErrors)) {
        if (msgs?.[0]) errs[key as keyof CreateTariffWorkbenchDto] = msgs[0];
      }
    }
    return errs;
  }, [t]);

  const errors = validate(formData);
  const showError = useCallback((field: keyof CreateTariffWorkbenchDto) =>
    Boolean((submittedOnce || touched[field]) && errors[field]), [submittedOnce, touched, errors]);

  const handleChange = (field: keyof CreateTariffWorkbenchDto, value: string | number | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof CreateTariffWorkbenchDto) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmittedOnce(true);
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs).join(" | "));
      return;
    }
    onSubmit(formData);
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
              {isEdit ? t("editTitle") : t("addTitle")}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("editSubtitle") : t("addSubtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <CancelButton label={tCommon("buttons.cancel")} onClick={onClose} disabled={isSubmitting} />
          <SaveButton label={isEdit ? (tCommon("buttons.update") || "Update") : (tCommon("buttons.save") || "Save")} type="submit" form="tariff-workbench-form" isLoading={isSubmitting} />
        </div>
      }
    >
      <form
        id="tariff-workbench-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col justify-between h-full bg-[#F8FAFF] p-5 overflow-y-auto space-y-5"
      >
        <TariffFormFields
          formData={formData}
          errors={errors}
          showError={showError}
          handleChange={handleChange}
          handleBlur={handleBlur}
          isSubmitting={isSubmitting}
          isEdit={isEdit}
          financialYearOptions={financialYearOptions}
          connectionTypeOptions={connectionTypeOptions}
          connectionCategoryOptions={connectionCategoryOptions}
          tapSizeOptions={tapSizeOptions}
          t={t}
          tCommon={tCommon}
        />
        <div className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
          <AlertCircle size={14} className="shrink-0" />
          <span>{tCommon("note.mandatory") || "* Mandatory fields must be filled"}</span>
        </div>
      </form>
    </Drawer>
  );
}
