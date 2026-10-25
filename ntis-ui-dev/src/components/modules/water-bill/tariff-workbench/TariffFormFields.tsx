"use client";


import {
  Input,
  Select,
  TextArea,
  ValidationMessage,
  FormStatusToggle,
} from "@/components/common";

import type { CreateTariffWorkbenchDto } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

interface TariffFormFieldsProps {
  formData: CreateTariffWorkbenchDto;
  errors: Partial<Record<keyof CreateTariffWorkbenchDto, string>>;
  showError: (field: keyof CreateTariffWorkbenchDto) => boolean;
  handleChange: (field: keyof CreateTariffWorkbenchDto, value: string | number | boolean | null) => void;
  handleBlur: (field: keyof CreateTariffWorkbenchDto) => void;
  isSubmitting?: boolean;
  isEdit?: boolean;
  financialYearOptions?: { value: string; label: string }[];
  connectionTypeOptions?: { value: string; label: string }[];
  connectionCategoryOptions?: { value: string; label: string }[];
  tapSizeOptions?: { value: string; label: string }[];

  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
}

export function TariffFormFields({
  formData,
  errors,
  showError,
  handleChange,
  handleBlur,
  isSubmitting = false,
  isEdit = false,
  financialYearOptions = [],
  connectionTypeOptions = [],
  connectionCategoryOptions = [],
  tapSizeOptions = [],
  t,
  tCommon,
}: TariffFormFieldsProps) {

  const selectPlaceholder = tCommon("select.placeholder") || "-- select --";


  return (
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
        <Input
          required
          label={t("form.tariffCode.label")}
          placeholder={t("form.tariffCode.placeholder")}
          value={formData.tariffCode}
          onChange={(e) => handleChange("tariffCode", e.target.value)}
          onBlur={() => handleBlur("tariffCode")}
          className={showError("tariffCode") ? "!border-red-500 focus:!ring-red-500" : ""}
        />
        <ValidationMessage message={errors.tariffCode} visible={showError("tariffCode")} />
      </div>

      <div className="space-y-1">
        <Input
          required
          label={t("form.tariffName.label")}
          placeholder={t("form.tariffName.placeholder")}
          value={formData.tariffName}
          onChange={(e) => handleChange("tariffName", e.target.value)}
          onBlur={() => handleBlur("tariffName")}
          className={showError("tariffName") ? "!border-red-500 focus:!ring-red-500" : ""}
        />
        <ValidationMessage message={errors.tariffName} visible={showError("tariffName")} />
      </div>

      <div className="space-y-1">
        <Select
          label={t("form.financialYear.label")}
          value={formData.financialYearId ? String(formData.financialYearId) : ""}
          onChange={(e) => handleChange("financialYearId", e.target.value ? Number(e.target.value) : 0)}
          onBlur={() => handleBlur("financialYearId")}
          options={financialYearOptions}
          placeholder={selectPlaceholder}
          className={showError("financialYearId") ? "!border-red-500 focus:!ring-red-500 [&>button]:!border-red-500 [&>button]:focus:!ring-red-400" : ""}
        />
        <ValidationMessage message={errors.financialYearId} visible={showError("financialYearId")} />
      </div>

      <div className="space-y-1">
        <Select
          required
          label={t("form.connectionType.label")}
          value={formData.connectionTypeId ? String(formData.connectionTypeId) : ""}
          onChange={(e) => handleChange("connectionTypeId", e.target.value ? Number(e.target.value) : null)}
          onBlur={() => handleBlur("connectionTypeId")}
          options={connectionTypeOptions}
          placeholder={t("form.connectionType.placeholder") || selectPlaceholder}
          className={showError("connectionTypeId") ? "!border-red-500 focus:!ring-red-500 [&>button]:!border-red-500 [&>button]:focus:!ring-red-400" : ""}
        />
        <ValidationMessage message={errors.connectionTypeId} visible={showError("connectionTypeId")} />
      </div>

      <div className="space-y-1">
        <Select
          required
          label={t("form.connectionCategory.label")}
          value={formData.connectionCategoryId ? String(formData.connectionCategoryId) : ""}
          onChange={(e) => handleChange("connectionCategoryId", e.target.value ? Number(e.target.value) : null)}
          onBlur={() => handleBlur("connectionCategoryId")}
          options={connectionCategoryOptions}
          placeholder={t("form.connectionCategory.placeholder") || selectPlaceholder}
          className={showError("connectionCategoryId") ? "!border-red-500 focus:!ring-red-500 [&>button]:!border-red-500 [&>button]:focus:!ring-red-400" : ""}
        />
        <ValidationMessage message={errors.connectionCategoryId} visible={showError("connectionCategoryId")} />
      </div>

      <div className="space-y-1">
        <Select
          required
          label={t("form.tapSize.label") || t("table.tapSize")}
          value={formData.tapSizeId ? String(formData.tapSizeId) : ""}
          onChange={(e) => handleChange("tapSizeId", e.target.value ? Number(e.target.value) : null)}
          onBlur={() => handleBlur("tapSizeId")}
          options={tapSizeOptions}
          placeholder={t("form.tapSize.placeholder") || selectPlaceholder}
          className={showError("tapSizeId") ? "!border-red-500 focus:!ring-red-500 [&>button]:!border-red-500 [&>button]:focus:!ring-red-400" : ""}
        />
        <ValidationMessage message={errors.tapSizeId} visible={showError("tapSizeId")} />
      </div>



      <div className="space-y-1">
        <Input
          required
          type="date"
          label={t("form.effectiveFrom.label")}
          value={formData.effectiveFrom}
          onChange={(e) => handleChange("effectiveFrom", e.target.value)}
          onBlur={() => handleBlur("effectiveFrom")}
          className={showError("effectiveFrom") ? "!border-red-500 focus:!ring-red-500" : ""}
        />
        <ValidationMessage message={errors.effectiveFrom} visible={showError("effectiveFrom")} />
      </div>

      <div className="space-y-1">
        <Input
          type="date"
          label={t("form.effectiveTo.label")}
          value={formData.effectiveTo || ""}
          onChange={(e) => handleChange("effectiveTo", e.target.value)}
          onBlur={() => handleBlur("effectiveTo")}
          className={showError("effectiveTo") ? "!border-red-500 focus:!ring-red-500" : ""}
        />
        <ValidationMessage message={errors.effectiveTo} visible={showError("effectiveTo")} />
      </div>

      <div className="col-span-1 md:col-span-2 space-y-1">
        <TextArea
          label={t("form.description.label")}
          rows={3}
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder={t("form.description.placeholder")}
        />
      </div>
    </div>
    </div>
  );
}
