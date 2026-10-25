import React from "react";
import { Label } from "@/components/common/label";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/select";
import { TextArea } from "@/components/common/Textarea";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import type { FormFieldsSectionProps } from "@/types/asset-masters/inventory-category.types";
import { DESCRIPTION_MAX } from "@/hooks/asset-masters/inventory-category/validation";

interface ExtendedFormFieldsSectionProps extends FormFieldsSectionProps {
  codeRef?: React.RefObject<HTMLInputElement | null>;
}

export function FormFieldsSection({
  formData,
  errors,
  showError,
  onChange,
  onSelectChange,
  onBlur,
  t,
  categoryOptions = [],
  codeRef,
}: ExtendedFormFieldsSectionProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <div className="space-y-1">
        <Label className="block text-sm font-medium text-slate-700">
          {t("labels.category")} <span className="text-red-500">*</span>
        </Label>
        <Select
          options={categoryOptions}
          value={String(formData.group ?? "")}
          onChange={(_, v) => onSelectChange?.("group", String(v))}
          placeholder={t("placeholders.category")}
          error={showError("group") ? " " : undefined}
          className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.group} visible={showError("group")} />
      </div>

      <div>
        <Input
          ref={codeRef}
          name="code"
          label={t("labels.code")}
          required
          value={formData.code}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("placeholders.code")}
          maxLength={15}
          error={showError("code") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.code} visible={showError("code")} />
      </div>

      <div>
        <Input
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
        <Input
          name="depreciationRate"
          label={t("labels.depreciationRate")}
          required
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={formData.depreciationRate ?? ""}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e") {
              e.preventDefault();
            }
          }}
          onBlur={onBlur}
          placeholder={t("placeholders.depreciationRate")}
          error={showError("depreciationRate") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.depreciationRate} visible={showError("depreciationRate")} />
      </div>

      <div>
        <Input
          name="displayOrder"
          label={t("labels.displayOrder")}
          required
          type="number"
          min="0"
          value={formData.displayOrder ?? ""}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "." || e.key === "e") {
              e.preventDefault();
            }
          }}
          onBlur={onBlur}
          placeholder={t("placeholders.displayOrder")}
          error={showError("displayOrder") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.displayOrder} visible={showError("displayOrder")} />
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
          maxLength={DESCRIPTION_MAX}
          error={showError("description") ? true : false}
          className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.description} visible={showError("description")} />
      </div>
    </div>
  );
}

