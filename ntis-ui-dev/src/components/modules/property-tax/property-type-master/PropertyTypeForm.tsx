"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common";
import { StatusToggleSection } from "./components/StatusToggleSection";
import { FormFieldsSection } from "./components/FormFieldsSection";
import type { FormFieldsSectionRef } from "./components/FormFieldsSection";
import { ValidationSection } from "./components/ValidationSection";
import { TypeOfUseSection } from "./components/TypeOfUseSection";

import { PropertyType } from "@/types/property-type.types";
import { PropertyTypeCategory } from "@/types/property-type-category.types";
import { UseType } from "@/types/typeOfUse.types";
import { usePropertyTypeForm } from "@/hooks/usePropertyTypeForm";
import { useTypeOfUseValidations } from "@/hooks/useTypeOfUseValidations";
import { usePropertyTypeSubmit } from "@/hooks/usePropertyTypeSubmit";

export interface PropertyTypeFormProps {
  id: number | null;
  initialData?: PropertyType;
  categories: PropertyTypeCategory[];
  typeOfUseList: UseType[];
  initialTypeOfUseIds?: number[];
}

export default function PropertyTypeForm({
  id,
  initialData,
  categories,
  typeOfUseList,
  initialTypeOfUseIds = [],
}: PropertyTypeFormProps) {
  const {
    formData,
    searchSequenceValue,
    errors,
    isSubmitting,
    isActive,
    open,
    handleChange,
    handleBlur,
    handleCategoryChange,
    handleTypeChange,
    handleSubmit: originalHandleSubmit,
    handleToggleStatus,
    handleCancel,
    refreshAndClose,
    showError,
    t,
    tCommon,
    isEdit,
    categoryLabel,
    typeOfUseLabel,
  } = usePropertyTypeForm({
    id,
    initialData,
    onSuccess: () => { },
    onCancel: () => { },
  });

  // --- Refs for auto-focus ---
  const statusToggleRef = React.useRef<HTMLButtonElement>(null);
  const formFieldsRef = React.useRef<FormFieldsSectionRef>(null);

  React.useEffect(() => {
    if (open) {
      // Small delay to wait for the drawer to render
      setTimeout(() => {
        if (isEdit && statusToggleRef.current) {
          statusToggleRef.current.focus();
        } else if (!isEdit && formFieldsRef.current?.descriptionEnglishRef?.current) {
          formFieldsRef.current.descriptionEnglishRef.current.focus();
        } else if (!isEdit && formFieldsRef.current?.propertyDescriptionRef?.current) {
          formFieldsRef.current.propertyDescriptionRef.current.focus();
        }
      }, 100);
    }
  }, [open, isEdit]);

  // --- TypeOfUse selection state ---
  const {
    selectedTypeOfUseIds,
    initialTypeOfUseIds: initialIds,
    persistedPropertyTypeId,
    setPersistedPropertyTypeId,
    toggleTypeOfUse,
    handleSelectAll,
    handleClearAll,
    saveValidations,
  } = useTypeOfUseValidations({
    initialTypeOfUseIds,
    typeOfUseList,
    t,
    typeOfUseLabel,
  });

  // Use the extracted submit hook for multi-step submission logic
  const { handleSubmit } = usePropertyTypeSubmit({
    isEdit,
    id,
    formData,
    persistedPropertyTypeId,
    setPersistedPropertyTypeId,
    originalHandleSubmit,
    saveValidations,
    refreshAndClose,
    t,
  });

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      className="border-l-4 border-[#4F6A94]"
      width="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("form.editTitle") : t("form.addTitle")}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("form.editSubtitle") : t("form.subtitle")}
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
            label={isEdit ? t("form.actions.update") : t("form.actions.save")}
            type="submit"
            form="property-type-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="property-type-form" onSubmit={handleSubmit} className="flex flex-col gap-6 h-full p-5 bg-[#F8FAFF]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 flex-1">

          {/* ================= LEFT COLUMN ================= */}
          <div className="flex flex-col gap-4 h-full">
            <StatusToggleSection
              ref={statusToggleRef}
              isEdit={isEdit}
              isActive={isActive}
              handleToggleStatus={handleToggleStatus}
              error={errors.isActive}
              t={t}
              tCommon={tCommon}
            />
            <FormFieldsSection
              ref={formFieldsRef}
              formData={formData}
              searchSequenceValue={searchSequenceValue}
              handleChange={handleChange}
              handleBlur={handleBlur}
              handleCategoryChange={handleCategoryChange}
              handleTypeChange={handleTypeChange}
              errors={errors}
              showError={showError}
              categories={categories}
              t={t}
              categoryLabel={categoryLabel}
              isActive={isActive}
              isEdit={isEdit}
            />
            <ValidationSection tCommon={tCommon} />
          </div>

          {/* ================= RIGHT COLUMN (Type of Use List) ================= */}
          <TypeOfUseSection
            typeOfUseList={typeOfUseList}
            selectedTypeOfUseIds={selectedTypeOfUseIds}
            initialTypeOfUseIds={initialIds}
            selectedTypeValue={formData.type}
            onToggle={toggleTypeOfUse}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
            t={t}
            typeOfUseLabel={typeOfUseLabel}
          />
        </div>
      </form>
    </Drawer>
  );
}
