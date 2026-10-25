import React from "react";
import { Label } from "@/components/common/label";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/select";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import { TextArea } from "@/components/common/Textarea";

import { useTranslations } from "next-intl";

import type { InventoryConditionFormFieldsSectionProps } from "@/types/asset-masters/inventory-condition.types";

interface ExtendedFormFieldsSectionProps extends InventoryConditionFormFieldsSectionProps {
  conditionTypeOptions?: { label: string; value: string }[];
  conditionCategoryRef?: React.RefObject<HTMLDivElement | null>;
}

export function FormFieldsSection({
  formData,
  errors,
  showError,
  onChange,
  onBlur,
  onSelectChange,
  t,
  categoryOptions,
  conditionTypeOptions = [
    { label: "Asset", value: "Asset" },
    { label: "Inventory", value: "Inventory" },
  ],
  isLoadingCategories,
  conditionCategoryRef,
}: ExtendedFormFieldsSectionProps) {
  const tCommon = useTranslations("common");
  const currentCategoryType = formData.conditionCategory || formData.conditionType || "";
  const currentCategoryId = formData.categoryId || formData.inventoryItemCategoryId || "";

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      {/* Condition Category Type: Asset or Inventory */}
      <div ref={conditionCategoryRef} className="space-y-1">
        <Label className="block text-sm font-medium text-slate-700">
          {t("configuration.masterData.form.labels.conditionType")} <span className="text-red-500">*</span>
        </Label>
        <Select
          options={conditionTypeOptions}
          value={currentCategoryType}
          onChange={(_, v) => onSelectChange("conditionCategory", String(v))}
          placeholder={t("configuration.masterData.form.placeholders.conditionType")}
          error={(showError("conditionCategory") || showError("conditionType")) ? " " : undefined}
          className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.conditionCategory || errors.conditionType} visible={showError("conditionCategory") || showError("conditionType")} />
      </div>

      <div>
        <Input
          name="conditionName"
          label={t("configuration.masterData.form.labels.name")}
          required
          value={formData.conditionName}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("configuration.masterData.form.placeholders.name")}
          maxLength={50}
          error={showError("conditionName") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.conditionName} visible={showError("conditionName")} />
      </div>

      {/* Category dropdown — populated based on selected conditionCategory */}
      <div className="space-y-1">
        <Label className="block text-sm font-medium text-slate-700">
          {t("configuration.masterData.form.labels.category")} <span className="text-red-500">*</span>
        </Label>
        <Select
          options={categoryOptions}
          value={String(currentCategoryId || "")}
          onChange={(_, v) => onSelectChange("categoryId", String(v))}
          placeholder={
            isLoadingCategories
              ? tCommon("actions.loading")
              : t("configuration.masterData.form.placeholders.category")
          }
          error={(showError("categoryId") || showError("inventoryItemCategoryId")) ? " " : undefined}
          className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
          disabled={isLoadingCategories || !currentCategoryType}
        />
        <ValidationMessage message={errors.categoryId || errors.inventoryItemCategoryId} visible={showError("categoryId") || showError("inventoryItemCategoryId")} />
      </div>

      <div>
        <Input
          name="conditionFactor"
          label={t("configuration.masterData.form.labels.conditionFactor")}
          required
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={formData.conditionFactor ?? ""}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e") {
              e.preventDefault();
            }
          }}
          onBlur={onBlur}
          placeholder={t("configuration.masterData.form.placeholders.conditionFactor")}
          error={showError("conditionFactor") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.conditionFactor} visible={showError("conditionFactor")} />
      </div>

      <div>
        <Input
          name="displayOrder"
          label={t("configuration.masterData.form.labels.displayOrder")}
          required
          type="number"
          min={1}
          step={1}
          value={formData.displayOrder ?? ""}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e" || e.key === ".") {
              e.preventDefault();
            }
          }}
          onBlur={onBlur}
          placeholder={t("configuration.masterData.form.placeholders.displayOrder")}
          error={showError("displayOrder") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.displayOrder} visible={showError("displayOrder")} />
      </div>

      <div>
        <TextArea
          name="description"
          label={t("configuration.masterData.form.labels.description")}
          rows={4}
          value={formData.description ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("configuration.masterData.form.placeholders.description")}
          maxLength={500}
          error={showError("description") ? true : false}
          className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.description} visible={showError("description")} />
      </div>
    </div>
  );
}
