"use client";
import { useTranslations } from 'next-intl';
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  FolderHeart,
  CheckCircle2,
} from "lucide-react";
import type { TypeOfUseCategory, UseCategoryFormProps } from "@/types/typeOfUse.types";
import { Input } from "@/components/common/Input";
import {
  createTypeOfUseCategory,
  updateTypeOfUseCategory,
} from "@/app/[locale]/property-tax/typeofusemaster/actions";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { Drawer } from '@/components/common/Drawer';
import { CancelButton, SaveButton, ValidationMessage } from '@/components/common';
import { validateForm } from '@/lib/utils/validation-helpers';
import { sanitizeCode, sanitizeText } from '@/lib/utils/sanitization';
import { useCategoryFormValidation } from '@/hooks/TypeOfUseMaster/useCategoryFormValidation';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

type FieldErrors = {
  code?: string;
  name?: string;
};

export default function UseCategoryForm({ id, initialData, allCategories: allCategoriesProp = [] }: UseCategoryFormProps) {
  const t = useTranslations('typeofusemaster');
  const router = useRouter();
  const isEdit = Boolean(id);

  const categoryLabel = useAliasLabel("Category", t("aliasFallback.category"));

  const [formData, setFormData] = useState({
    code: initialData?.typeOfUseCategoryCode || "",
    name: initialData?.typeOfUseCategoryName || "",
    isActive: initialData?.isActive ?? true,
  });

  const [allCategories] = useState<TypeOfUseCategory[]>(allCategoriesProp);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use validation hook
  const { validationSchema } = useCategoryFormValidation({
    categoryId: initialData ? initialData.id : null,
    allCategories,
    isEdit,
    t,
  });

  const isActiveStatus = formData.isActive ?? true;

  const handleStatusToggle = () => {
    setFormData((p) => ({
      ...p,
      isActive: !p.isActive,
    }));
  };

  const showError = (field: keyof FieldErrors) =>
    (submittedOnce || touched[field as string]) && !!errors[field];

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((p) => ({ ...p, [field]: true }));

    const validationErrors = validateForm(formData, validationSchema);
    setErrors({
      code: validationErrors.code,
      name: validationErrors.name,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);

    const validationErrors = validateForm(formData, validationSchema);
    setErrors({
      code: validationErrors.code,
      name: validationErrors.name,
    });

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (isEdit && initialData) {
        const result = await updateTypeOfUseCategory({
          id: initialData.id,
          code: formData.code,
          name: formData.name,
          status: formData.isActive ? "Active" : "Inactive",
        });

        if (!result.success) {
          const errorMessage = result.message || '';
          const msg = errorMessage.toLowerCase();

          const isDup =
            msg.includes("duplicate") ||
            msg.includes("already exists") ||
            msg.includes("unique");

          if (isDup) {
            setErrors((p) => ({
              ...p,
              name: t('category.messages.duplicateName', { category: categoryLabel }),
            }));
            setTouched((p) => ({
              ...p,
              name: true,
            }));
            return;
          }

          toast.error(errorMessage || t('category.messages.updateFailed', { category: categoryLabel }));
          return;
        }

        toast.success(t('category.messages.categoryUpdated', { category: categoryLabel }));
      } else {
        const result = await createTypeOfUseCategory({
          code: formData.code,
          name: formData.name,
          status: formData.isActive ? "Active" : "Inactive",
        });

        if (!result.success) {
          const errorMessage = result.message || '';
          const msg = errorMessage.toLowerCase();

          const isDup =
            msg.includes("duplicate") ||
            msg.includes("already exists") ||
            msg.includes("unique");

          if (isDup) {
            setErrors((p) => ({
              ...p,
              name: t('category.messages.duplicateName', { category: categoryLabel }),
            }));
            setTouched((p) => ({
              ...p,
              name: true,
            }));
            return;
          }

          toast.error(errorMessage || t('category.messages.createFailed', { category: categoryLabel }));
          return;
        }

        toast.success(t('category.messages.categoryCreated', { category: categoryLabel }));
      }

      router.back();
    } catch {
      toast.error(isEdit ? t('category.messages.updateFailed', { category: categoryLabel }) : t('category.messages.createFailed', { category: categoryLabel }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open
      onClose={() => router.back()}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white shadow">
            <FolderHeart size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t('category.edit', { category: categoryLabel }) : t('category.add', { category: categoryLabel })}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t('category.editSubtitle', { category: categoryLabel }) : t('category.addSubtitle', { category: categoryLabel })}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={t('buttons.cancel')}
            onClick={() => router.back()}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? t('buttons.edit') : t('buttons.save')}
            type="submit"
            form="use-category-form"
            disabled={isSubmitting}
          />
        </>
      }
    >
      <form
        id="use-category-form"
        onSubmit={handleSubmit}
        className="space-y-6 bg-[#F8FAFF] p-5"
      >
        {/* ================= ACTIVE STATUS (EDIT ONLY) ================= */}
        {isEdit && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <div className="text-base font-semibold text-slate-900">{t('category.fields.status')}</div>
                  <div className="text-sm text-slate-500">
                    {t('category.title', { category: categoryLabel })} {t('status.isCurrently')} <span className={isActiveStatus ? "text-emerald-700 font-medium" : "text-slate-600 font-medium"}>{isActiveStatus ? t('status.active') : t('status.inactive')}</span>
                  </div>
                </div>
              </div>

              <ToggleSwitch
                checked={isActiveStatus}
                onChange={handleStatusToggle}
                showPopup={false}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* ================= BASIC DETAILS ================= */}
        <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Input
                label={t('category.fields.categoryCode', { category: categoryLabel })}
                name="code"
                value={formData.code}
                onChange={(e) => {
                  const cleaned = sanitizeCode(e.target.value, 20);
                  const next = { ...formData, code: cleaned };
                  setFormData(next);
                  if (submittedOnce || touched.code) {
                    const validationErrors = validateForm(next, validationSchema);
                    setErrors({
                      code: validationErrors.code,
                      name: validationErrors.name,
                    });
                  }
                }}
                onBlur={() => handleBlur("code")}
                placeholder={t('category.placeholders.categoryCode')}
                required
                fullWidth
                disabled={isSubmitting}
              />
              <ValidationMessage
                message={errors.code}
                visible={showError("code")}
              />
            </div>

            {/* Category Name */}
            <div className="flex flex-col">
              <Input
                label={t('category.fields.categoryName', { category: categoryLabel })}
                name="name"
                value={formData.name}
                onChange={(e) => {
                  const cleaned = sanitizeText(e.target.value, 50);
                  const next = { ...formData, name: cleaned };
                  setFormData(next);

                  if (submittedOnce || touched.name) {
                    const validationErrors = validateForm(next, validationSchema);
                    setErrors({
                      code: validationErrors.code,
                      name: validationErrors.name,
                    });
                  }
                }}
                onBlur={() => handleBlur("name")}
                placeholder={t('category.placeholders.categoryName')}
                maxLength={50}
                required
                fullWidth
                disabled={isSubmitting}
              />
              <ValidationMessage
                message={errors.name}
                visible={showError("name")}
              />
            </div>
          </div>
        </div>

        {/* ================= NOTE ================= */}
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>
            {t('category.mandatoryNote')}
          </span>
        </div>
      </form>
    </Drawer>
  );
}
