
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import type { UseSubType, UseType, UseSubTypeFormProps, TypeOfUseCategory } from "@/types/typeOfUse.types";
import { Drawer } from "@/components/common/Drawer";
import { validateForm } from '@/lib/utils/validation-helpers';
import { sanitizeDescription } from '@/lib/utils/sanitization';
import { useSubTypeFormValidation } from '@/hooks/TypeOfUseMaster/useSubTypeFormValidation';
import { useSubTypeFormSubmit } from '@/hooks/TypeOfUseMaster/useSubTypeFormSubmit';
import { DescriptionInput, SearchSequenceInput, CategorySelector } from './TypeFormFields';
import { SubTypeStatusSection } from './SubTypeStatusSection';
import { SubTypeFormHeader } from './SubTypeFormHeader';
import { SubTypeFormFooter } from './SubTypeFormFooter';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

type FieldErrors = {
  typeId?: string;
  categoryId?: string;
  description?: string;
  searchSequence?: string;
};

export default function UseSubTypeForm({ id, initialData, typeInfo: typeInfoProp = null, allSubTypes: allSubTypesProp = [], allCategories: allCategoriesProp = [] }: UseSubTypeFormProps) {
  const t = useTranslations("typeofusemaster");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(id);

  const subTypeOfUseLabel = useAliasLabel("Sub_Type_Of_Use", t("aliasFallback.subTypeOfUse"));

  const queryTypeId = Number(searchParams.get("typeId") || 0);

  const [typeInfo] = useState<UseType | null>(typeInfoProp);
  const [allSubTypes] = useState<UseSubType[]>(allSubTypesProp);
  const [allCategories] = useState<TypeOfUseCategory[]>(allCategoriesProp);

  const [formData, setFormData] = useState<UseSubType>(
    initialData || {
      subTypeOfUseId: 0,
      typeOfUseId: queryTypeId,
      description: "",
      searchSequence: 0,
      isActive: true,
      status: "Active",
    }
  );

  const isActive = formData.isActive ?? true;

  const handleStatusToggle = () => {
    setFormData((p) => ({
      ...p,
      isActive: !p.isActive,
      status: p.isActive ? "Inactive" : "Active",
    }));
  };

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  // Use validation hook
  const { validationSchema } = useSubTypeFormValidation({
    formData,
    allSubTypes,
    isEdit,
    t,
  });

  const showError = (field: keyof FieldErrors) =>
    (submittedOnce || touched[field as string]) && !!errors[field];

  const markTouched = (name: keyof FieldErrors) =>
    setTouched((p) => ({ ...p, [name]: true }));

  const setField = <K extends keyof UseSubType>(key: K, value: UseSubType[K]) => {
    setFormData((p) => {
      let nextValue: UseSubType[K] = value;

      if (key === "description" && typeof value === "string") {
        nextValue = sanitizeDescription(value, 80) as UseSubType[K];
        markTouched("description");
      }

      if (key === "searchSequence") {
        markTouched("searchSequence");
      }

      const next = { ...p, [key]: nextValue };

      const validationErrors = validateForm(next, validationSchema);
      setErrors({
        typeId: validationErrors.typeOfUseId,
        categoryId: validationErrors.typeOfUseCategoryId,
        description: validationErrors.description,
        searchSequence: validationErrors.searchSequence,
      });

      return next;
    });
  };

  const typeLabel = useMemo(() => typeInfo?.description || "", [typeInfo]);

  // Use submit hook
  const { handleSubmit: handleFormSubmit } = useSubTypeFormSubmit({
    formData,
    isEdit,
    t,
    setErrors,
    setTouched,
  });

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);

    setTouched({
      typeId: true,
      categoryId: true,
      description: true,
      searchSequence: true,
    });

    const validationErrors = validateForm(formData, validationSchema);
    setErrors({
      typeId: validationErrors.typeOfUseId,
      categoryId: validationErrors.typeOfUseCategoryId,
      description: validationErrors.description,
      searchSequence: validationErrors.searchSequence,
    });

    if (Object.keys(validationErrors).length > 0) return;

    await handleFormSubmit();
  };

  return (
    <Drawer
      open
      onClose={() => router.back()}
      className="border-l-4 border-[#4F6A94]"
      width="md"
      title={<SubTypeFormHeader isEdit={isEdit} typeLabel={typeLabel} t={t} />}
      footer={<SubTypeFormFooter isEdit={isEdit} onCancel={() => router.back()} t={t} />}
    >
      <form
        id="use-subtype-form"
        onSubmit={handleSubmit}
        className="space-y-6 bg-[#F8FAFF] p-5"
      >
        {/* Show error if typeOfUseId is missing */}
        {errors.typeId && (
          <div className="flex items-center gap-2 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{errors.typeId}</span>
          </div>
        )}

        {/* ================= ACTIVE STATUS (EDIT ONLY) ================= */}
        {isEdit && (
          <SubTypeStatusSection
            isActive={isActive}
            onToggle={handleStatusToggle}
            t={t}
          />
        )}

        {/* ================= BASIC DETAILS ================= */}
        <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
          {/* Sub-Type Name — full width */}
          <DescriptionInput
            value={formData.description || ""}
            onChange={(value) => setField("description", value)}
            error={errors.description}
            showError={showError("description")}
            t={(key, values) => {
              // Map to appropriate translation keys for subtype
              if (key === 'type.fields.description') return t('messages.subTypeNameLabel', { subTypeOfUse: subTypeOfUseLabel });
              if (key === 'type.placeholders.description') return t('messages.subTypeNameLabel', { subTypeOfUse: subTypeOfUseLabel });
              return t(key, values);
            }}
          />

          {/* Search Sequence */}
          <div className="grid grid-cols-2 gap-4">
            <SearchSequenceInput
              value={formData.searchSequence ?? 0}
              onChange={(value) => setField("searchSequence", value)}
              error={errors.searchSequence}
              showError={showError("searchSequence")}
              t={t}
            />

            {/* Category Selector */}
            <CategorySelector
              allCategories={allCategories}
              selectedCategoryId={formData.typeOfUseCategoryId}
              onChange={(categoryId) => {
                setField("typeOfUseCategoryId", categoryId);
                markTouched("categoryId");
              }}
              error={errors.categoryId}
              showError={showError("categoryId")}
              t={t}
            />
          </div>
        </div>

        {/* ================= NOTE ================= */}
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>
            {t("group.mandatoryNote")}
          </span>
        </div>
      </form>
    </Drawer>
  );
}
