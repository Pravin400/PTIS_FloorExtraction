"use client";

import { FileText } from "lucide-react";
import { CancelButton, SaveButton, RequiredFieldsNote } from "@/components/common";
import { Drawer } from "@/components/common/Drawer";
import { StatusToggleSection } from "./components/StatusToggleSection";
import { FormFieldsSection } from "./components/FormFieldsSection";
import type { CommonRemark, RemarkCategory } from "@/types/common-remark-master/common-remark.types";
import { useCommonRemarkForm } from "@/hooks/common-remark-master/useCommonRemarkForm";

export interface CommonRemarkFormProps {
  id: number | null;
  initialData?: CommonRemark | null;
  categories: RemarkCategory[];
}

export default function CommonRemarkForm({ id, initialData, categories }: CommonRemarkFormProps) {
  const {
    formData,
    customRemarkType,
    errors,
    isSubmitting,
    open,
    isEdit,
    t,
    tCommon,
    showError,
    handleChange,
    handleSelectChange,
    handleCustomTypeChange,
    handleBlur,
    handleCancel,
    handleSubmit,
    handleToggleStatus,
  } = useCommonRemarkForm({
    id,
    initialData,
    categories,
    onSuccess: () => {},
    onCancel: () => {},
  });

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white shadow">
            <FileText size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("form.editTitle") : t("form.addTitle")}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("form.editSubtitle") : t("form.addSubtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={tCommon("buttons.cancel")}
            onClick={handleCancel}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? tCommon("buttons.update") : tCommon("buttons.save")}
            type="submit"
            form="remark-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="remark-form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
        <StatusToggleSection
          isEdit={isEdit}
          isActive={formData.isActive}
          handleToggleStatus={handleToggleStatus}
          t={t}
        />

        <FormFieldsSection
          formData={formData}
          customRemarkType={customRemarkType}
          categories={categories}
          errors={errors}
          showError={showError}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          handleCustomTypeChange={handleCustomTypeChange}
          handleBlur={handleBlur}
          t={t}
        />

        <RequiredFieldsNote text={tCommon("note.mandatory")} />
      </form>
    </Drawer>
  );
}
