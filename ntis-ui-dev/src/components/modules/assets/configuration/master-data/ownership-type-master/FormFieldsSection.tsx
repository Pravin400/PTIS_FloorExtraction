
import { Input } from "@/components/common/Input";
import { TextArea } from "@/components/common/Textarea";

import type { OwnershipTypeFormFieldsSectionProps } from "@/types/asset-masters/ownership-type.types";

export function FormFieldsSection({
  nameRef,
  formData,
  errors,
  showError,
  onChange,
  onBlur,
  t,
}: OwnershipTypeFormFieldsSectionProps) {
  return (
    <div className="space-y-6">
      <Input
        ref={nameRef}
        name="ownershipTypeName"
        label={t("configuration.masterData.form.labels.name")}
        required
        value={formData.ownershipTypeName}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={t("configuration.masterData.form.placeholders.name")}
        maxLength={50}
        error={showError("ownershipTypeName") ? errors.ownershipTypeName : undefined}
        className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
      />

      <TextArea
        name="description"
        label={t("configuration.masterData.form.labels.description")}
        rows={4}
        value={formData.description}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
        placeholder={t("configuration.masterData.form.placeholders.description")}
        maxLength={100}
        error={showError("description") ? true : false}
        errorMessage={showError("description") ? errors.description : undefined}
        className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
      />
    </div>
  );
}
