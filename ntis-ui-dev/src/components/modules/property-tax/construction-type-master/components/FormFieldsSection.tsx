"use client";

import { Input, ValidationMessage } from "@/components/common";
import { ConstructionTypeFormModel } from "@/types/construction.types";
import type React from "react";

interface FormFieldsSectionProps {
  formData: ConstructionTypeFormModel;
  searchSequenceValue: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  errors: Partial<Record<keyof ConstructionTypeFormModel, string>>;
  showError: (field: keyof ConstructionTypeFormModel) => boolean;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  isActive?: boolean;
  isEdit?: boolean;
  constructionTypeLabel?: string;
}

export const FormFieldsSection = ({
  formData,
  searchSequenceValue,
  handleChange,
  handleBlur,
  errors,
  showError,
  t,
  isActive = true,
  isEdit = false,
  constructionTypeLabel,
}: FormFieldsSectionProps) => {
  const values = { constructionType: constructionTypeLabel ?? "", entity: constructionTypeLabel ?? "" };
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        name="constructionCode"
        label={t("form.fields.constructionCode.label", values)}
        required
        placeholder={t("form.fields.constructionCode.placeholder", values)}
        value={formData.constructionCode}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={!isActive}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.constructionCode}
        visible={showError("constructionCode")}
      />

      <Input
        name="descriptionEnglish"
        label={t("form.fields.descriptionEnglish.label", values)}
        required
        placeholder={t("form.fields.descriptionEnglish.placeholder", values)}
        value={formData.descriptionEnglish ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={!isActive}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.descriptionEnglish}
        visible={showError("descriptionEnglish")}
      />

      <Input
        name="description"
        label={t("form.fields.description.label", values)}
        required={true}
        placeholder={t("form.fields.description.placeholder", values)}
        value={formData.description}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={!isActive}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.description}
        visible={showError("description")}
      />

      <Input
        name="searchSequence"
        label={t("form.fields.searchSequence.label", values)}
        type="number"
        min={1}
        value={searchSequenceValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={!isActive || !isEdit}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.searchSequence}
        visible={showError("searchSequence")}
      />
    </div>
  );
};
