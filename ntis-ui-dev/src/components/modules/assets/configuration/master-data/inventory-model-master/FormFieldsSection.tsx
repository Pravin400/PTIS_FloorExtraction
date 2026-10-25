import React from "react";
import { Label } from "@/components/common/label";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/select";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import { TextArea } from "@/components/common/Textarea";
import type { FormFieldsSectionProps } from "@/types/asset-masters/inventory-model.types";

interface ExtendedFormFieldsSectionProps extends FormFieldsSectionProps {
  nameRef?: React.RefObject<HTMLInputElement | null>;
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
  nameRef,
}: ExtendedFormFieldsSectionProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <div className="space-y-1">
        <Label className="block text-sm font-medium text-slate-700">
          {t("labels.itemName")} <span className="text-red-500">*</span>
        </Label>
        <Select
          options={categoryOptions}
          value={String(formData.group ?? "")}
          onChange={(_, v) => onSelectChange("group", String(v))}
          placeholder={t("placeholders.itemName")}
          error={showError("group") ? " " : undefined}
          className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.group} visible={showError("group")} />
      </div>

      <div>
        <Input
          ref={nameRef}
          name="name"
          label={t("labels.name")}
          required
          value={formData.name}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("placeholders.name")}
          maxLength={40}
          error={showError("name") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.name} visible={showError("name")} />
      </div>

      <div>
        <TextArea
          name="description"
          label={t("labels.description")}
          rows={3}
          value={formData.description}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("placeholders.description")}
          maxLength={500}
          error={showError("description") ? true : false}
          className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.description} visible={showError("description")} />
      </div>

      <div>
        <Input
          name="displayOrder"
          label={t("labels.displayOrder")}
          required
          type="number"
          min={1}
          max={99999}
          value={formData.displayOrder !== undefined ? String(formData.displayOrder) : ""}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("placeholders.displayOrder")}
          error={showError("displayOrder") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.displayOrder} visible={showError("displayOrder")} />
      </div>
    </div>
  );
}

