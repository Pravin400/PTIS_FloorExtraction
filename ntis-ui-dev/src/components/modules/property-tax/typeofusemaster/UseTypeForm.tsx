
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from "next/navigation";
import { Tag, AlertCircle, CheckCircle2 } from "lucide-react";
import type { UseGroup, UseType, UseTypeFormProps, TypeOfUseCategory } from "@/types/typeOfUse.types";
import {
  createUseType,
  updateUseType,
} from "@/app/[locale]/property-tax/typeofusemaster/actions";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { toast } from "sonner";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common";
import { validateForm } from '@/lib/utils/validation-helpers';
import { sanitizeCode, sanitizeDescription } from '@/lib/utils/sanitization';
import { useTypeFormValidation } from '@/hooks/TypeOfUseMaster/useTypeFormValidation';
import {
  TypeSelector,
  GroupSelector,
  CategorySelector,
  TypeCodeInput,
  SearchSequenceInput,
  DescriptionInput,
} from './TypeFormFields';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

type FieldErrors = {
  code?: string;
  typeValue?: string;
  groupId?: string;
  categoryId?: string;
  description?: string;
  searchSequence?: string;
};

export default function UseTypeForm({ id, initialData, allGroups: allGroupsProp = [], allTypes: allTypesProp = [], allCategories: allCategoriesProp = [] }: UseTypeFormProps) {
  const t = useTranslations('typeofusemaster');
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(id);

  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));

  const queryGroupId = Number(searchParams.get("groupId") || 0);

  const [allGroups] = useState<UseGroup[]>(allGroupsProp);
  const [allTypes] = useState<UseType[]>(allTypesProp);
  const [allCategories] = useState<TypeOfUseCategory[]>(allCategoriesProp);

  const [formData, setFormData] = useState<UseType>(
    initialData || {
      typeOfUseId: 0,
      typeOfUseGroupId: queryGroupId,
      typeOfUseCode: "",
      description: "",
      type: "",
      searchSequence: 0,
      isActive: true,
      status: "Active",
    }
  );

  const [typeValue, setTypeValue] = useState(initialData?.type || "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  // Use validation hook
  const { validationSchema } = useTypeFormValidation({
    formData,
    typeValue,
    allTypes,
    isEdit,
    t,
  });

  const isActive = formData.isActive ?? true;

  const handleStatusToggle = () => {
    setFormData((p) => ({
      ...p,
      isActive: !p.isActive,
      status: p.isActive ? "Inactive" : "Active",
    }));
  };

  // ✅ FIX: Find group by typeOfUseGroupId
  const selectedGroup = useMemo(
    () => allGroups.find((g) =>
      g.typeOfUseGroupId === formData.typeOfUseGroupId
    ) || null,
    [allGroups, formData.typeOfUseGroupId]
  );

  const clearFieldError = (field: keyof FieldErrors) => {
    setErrors((p) => {
      if (!p[field]) return p;
      const next = { ...p };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);

    // Create form data with typeValue for validation
    const dataToValidate = { ...formData, type: typeValue };
    const validationErrors = validateForm(dataToValidate, validationSchema);

    setErrors({
      code: validationErrors.typeOfUseCode,
      typeValue: validationErrors.type,
      groupId: validationErrors.typeOfUseGroupId,
      categoryId: validationErrors.typeOfUseCategoryId,
      description: validationErrors.description,
      searchSequence: validationErrors.searchSequence
    });

    if (Object.keys(validationErrors).length > 0) return;

    if (isEdit) {
      const result = await updateUseType({
        id: Number(formData.typeOfUseId),
        groupId: Number(formData.typeOfUseGroupId),
        code: formData.typeOfUseCode,
        description: formData.description,
        type: typeValue,
        searchSequence: Number(formData.searchSequence ?? 0),
        status: formData.isActive ? "Active" : "Inactive",
        typeOfUseCategoryId: formData.typeOfUseCategoryId,
      });

      if (!result.success) {
        toast.error(result.message || t('messages.updateTypeFailed'));
        return;
      }

      toast.success(t('messages.typeUpdated'));
    } else {
      const result = await createUseType({
        groupId: Number(formData.typeOfUseGroupId),
        code: formData.typeOfUseCode,
        description: formData.description,
        type: typeValue,
        searchSequence: Number(formData.searchSequence ?? 0),
        status: formData.isActive ? "Active" : "Inactive",
        typeOfUseCategoryId: formData.typeOfUseCategoryId ?? null,
      });

      if (!result.success) {
        toast.error(result.message || t('messages.createTypeFailed'));
        return;
      }

      toast.success(t('messages.typeCreated'));
    }

    router.back();
  };

  return (
    <Drawer
      open
      onClose={() => router.back()}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white shadow">
            <Tag size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t('type.edit', { typeOfUse: typeOfUseLabel }) : t('type.add', { typeOfUse: typeOfUseLabel })}
            </div>
            <div className="text-sm text-slate-500">
              {selectedGroup
                ? t('type.addingToGroup', { group: selectedGroup.groupName })
                : t('type.selectGroup')}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={t('buttons.cancel')}
            onClick={() => router.back()}
          />
          <SaveButton
            label={isEdit ? t('buttons.edit') : t('buttons.save')}
            type="submit"
            form="use-type-form"
          />
        </>
      }
    >
      <form
        id="use-type-form"
        onSubmit={handleSubmit}
        className="space-y-6 bg-[#F8FAFF] p-5"
      >
        {isEdit && <input type="hidden" name="typeOfUseId" value={formData.typeOfUseId} />}

        {/* ================= ACTIVE STATUS (EDIT ONLY) ================= */}
        {isEdit && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <div className="text-base font-semibold text-slate-900">{t('type.fields.status')}</div>
                  <div className="text-sm text-slate-500">
                    {t('type.statusMessage', {
                      typeOfUse: typeOfUseLabel,
                      status: isActive ? t('status.active') : t('status.inactive')
                    })}
                  </div>
                </div>
              </div>

              <ToggleSwitch checked={isActive} onChange={handleStatusToggle} showPopup={false} />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Type Dropdown */}
            <TypeSelector
              value={typeValue}
              onChange={setTypeValue}
              onClearError={() => clearFieldError("typeValue")}
              error={errors.typeValue}
              showError={submittedOnce && !!errors.typeValue}
              t={t}
            />

            {/* UseTypeGroup */}
            <GroupSelector
              allGroups={allGroups}
              selectedGroupId={formData.typeOfUseGroupId}
              onChange={(groupId) => {
                setFormData((p) => ({ ...p, typeOfUseGroupId: groupId }));
                if (submittedOnce) clearFieldError("groupId");
              }}
              onClearError={() => clearFieldError("groupId")}
              error={errors.groupId}
              showError={submittedOnce && !!errors.groupId}
              t={t}
            />

            {/* Category Selector */}
            <CategorySelector
              allCategories={allCategories}
              selectedCategoryId={formData.typeOfUseCategoryId}
              onChange={(categoryId) => {
                setFormData((p) => ({ ...p, typeOfUseCategoryId: categoryId }));
                if (submittedOnce) clearFieldError("categoryId");
              }}
              error={errors.categoryId}
              showError={submittedOnce && !!errors.categoryId}
              t={t}
            />

            {/* Type Code Input */}
            <TypeCodeInput
              value={formData.typeOfUseCode}
              onChange={(value) => {
                const cleaned = sanitizeCode(value, 10);
                setFormData((p) => ({ ...p, typeOfUseCode: cleaned }));
                if (submittedOnce) clearFieldError("code");
              }}
              error={errors.code}
              showError={submittedOnce && !!errors.code}
              t={t}
            />

            {/* Search Sequence */}
            <SearchSequenceInput
              value={formData.searchSequence ?? 0}
              onChange={(value) => {
                setFormData((p) => ({ ...p, searchSequence: value }));
                if (submittedOnce) clearFieldError("searchSequence");
              }}
              error={errors.searchSequence}
              showError={submittedOnce && !!errors.searchSequence}
              t={t}
            />

            {/* Description */}
            <DescriptionInput
              value={formData.description || ""}
              onChange={(value) => {
                const cleaned = sanitizeDescription(value, 80);
                setFormData((p) => ({ ...p, description: cleaned }));
                if (submittedOnce) clearFieldError("description");
              }}
              error={errors.description}
              showError={submittedOnce && !!errors.description}
              t={t}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>
            {t('type.mandatoryNote')}
          </span>
        </div>
      </form>
    </Drawer>
  );
}
