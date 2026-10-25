"use client";

import React from "react";
import { Plus, List } from "lucide-react";
import { Select, TextArea, Input } from "@/components/common";
import type { CommonRemarkFormModel } from "@/types/common-remark-master/common-remark.types";

interface FormFieldsSectionProps {
  formData: CommonRemarkFormModel;
  customRemarkType: string;
  categories: { id: number; categoryCode: string; categoryName: string }[];
  errors: Record<string, string>;
  showError: (field: string) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
  handleCustomTypeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  t: (key: string) => string;
}

export function FormFieldsSection({
  formData,
  customRemarkType,
  categories,
  errors,
  showError,
  handleChange,
  handleSelectChange,
  handleCustomTypeChange,
  handleBlur,
  t,
}: FormFieldsSectionProps) {
  const isCustomMode = formData.remarkType === "Other";

  const handleAddNewType = (e: React.MouseEvent) => {
    e.preventDefault();
    const fakeEvent = {
      target: { name: "remarkType", value: "Other" },
    } as React.ChangeEvent<HTMLSelectElement>;
    handleSelectChange(fakeEvent, "Other");
  };

  const handleSelectExisting = (e: React.MouseEvent) => {
    e.preventDefault();
    const fakeEvent = {
      target: { name: "remarkType", value: "" },
    } as React.ChangeEvent<HTMLSelectElement>;
    handleSelectChange(fakeEvent, "");
  };

  const remarkTypeOptions = categories.map((c) => ({
    label: c.categoryName,
    value: String(c.id),
  }));

  return (
    <div className="space-y-4">
      {!isCustomMode ? (
        <>
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t("form.remarkType")}
                <span className="text-red-500"> *</span>
              </label>
              <button
                type="button"
                onClick={handleAddNewType}
                className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 transition-all cursor-pointer flex items-center gap-1 shadow-sm focus:outline-none"
              >
                <Plus size={13} className="stroke-[3]" />
                {t("form.addNewTypeBtn") || "Add New Remark Type"}
              </button>
            </div>
            <Select
              options={remarkTypeOptions}
              value={formData.remarkType}
              name="remarkType"
              placeholder={t("form.remarkTypePlaceholder")}
              onChange={handleSelectChange}
              onBlur={handleBlur}
              error={showError("remarkType") ? errors.remarkType : undefined}
            />
          </div>

          <TextArea
            label={t("form.remark")}
            value={formData.remark}
            name="remark"
            placeholder={t("form.remarkPlaceholder")}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={300}
            showCharCount
            required
            error={showError("remark")}
            errorMessage={showError("remark") ? errors.remark : undefined}
          />
        </>
      ) : (
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {t("form.customRemarkType")}
              <span className="text-red-500"> *</span>
            </label>
            <button
              type="button"
              onClick={handleSelectExisting}
              className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full border border-slate-300 transition-all cursor-pointer flex items-center gap-1 shadow-sm focus:outline-none"
            >
              <List size={13} className="stroke-[2.5]" />
              {t("form.selectExistingBtn") || "Select Existing Type"}
            </button>
          </div>
          <Input
            value={customRemarkType}
            name="customRemarkType"
            placeholder={t("form.customRemarkTypePlaceholder") || "Enter custom remark type..."}
            onChange={handleCustomTypeChange}
            onBlur={handleBlur}
            error={showError("customRemarkType") ? errors.customRemarkType : undefined}
          />
        </div>
      )}
    </div>
  );
}
