import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { buildMasterPathWithSearchParams } from '@/app/[locale]/configuration-settings/grievance-category-master/search-params';
import {
  createGrievanceCategoryValidationTranslator,
  sanitizeGrievanceCategoryField,
  resolveGrievanceCategoryServerError,
  validateGrievanceCategory,
  validateGrievanceCategoryField,
} from '@/lib/utils/grievance-category-validation';
import { INITIAL_FORM_STATE } from '@/components/modules/configuration-settings/grievance-category-master/GrievanceCategoryConstants';
import type {
  GrievanceCategoryFormModel,
  GrievanceCategory,
} from '@/types/grievance-category-master/grievanceCategory.types';

interface UseGrievanceCategoryFormProps {
  editingCategory: GrievanceCategory | null;
  departments: { departmentId: number; departmentName?: string; isActive?: boolean }[];
  locale: string;
  isEdit: boolean;
  returnPath?: string;
  t: {
    fields: Record<string, string>;
    errors: Record<string, string>;
    buttons: Record<string, string>;
    toast: Record<string, string>;
  };
  serverAction: (
    formData: FormData
  ) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
    fieldErrors?: Record<string, string>;
  }>;
}

export function useGrievanceCategoryForm({
  editingCategory,
  departments,
  locale,
  isEdit,
  returnPath: providedReturnPath,
  t,
  serverAction,
}: UseGrievanceCategoryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialData: GrievanceCategoryFormModel = editingCategory
    ? {
        id: editingCategory.id,
        categoryCode: editingCategory.categoryCode || '',
        categoryName: editingCategory.categoryName || '',
        departmentId: editingCategory.departmentId ?? undefined,
        priority: editingCategory.priority || 'Medium',
        resolutionSla: editingCategory.resolutionSla || '',
        escalationLevel: editingCategory.escalationLevel || 'Level 1',
        description: editingCategory.description || '',
        isActive: editingCategory.isActive ?? true,
      }
    : INITIAL_FORM_STATE;

  const [formData, setFormData] = useState<GrievanceCategoryFormModel>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof GrievanceCategoryFormModel, string>>
  >({});

  const returnPath = providedReturnPath ?? buildMasterPathWithSearchParams(locale, searchParams);

  const translateValidation = useMemo(
    () => createGrievanceCategoryValidationTranslator({ errors: t.errors, fields: t.fields }),
    [t.errors, t.fields]
  );

  const handleFieldChange = (
    field: keyof GrievanceCategoryFormModel,
    value: GrievanceCategoryFormModel[keyof GrievanceCategoryFormModel]
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    let fieldError = validateGrievanceCategoryField(formData, field, value, translateValidation);
    
    if (field === 'departmentId') {
      const validDeptIds = departments
        .filter((d) => d && d.departmentId)
        .map((d) => d.departmentId);
      if (value && !validDeptIds.includes(Number(value))) {
        fieldError = translateValidation('errors.departmentReq');
      }
    }
    
    setFieldErrors((prev) => ({ ...prev, [field]: fieldError || undefined }));
  };

  const hasChanges = useMemo(() => {
    if (!editingCategory) return true;
    return (
      formData.categoryCode !== (editingCategory.categoryCode || '') ||
      formData.categoryName !== (editingCategory.categoryName || '') ||
      formData.departmentId !== (editingCategory.departmentId ?? undefined) ||
      formData.priority !== (editingCategory.priority || 'Medium') ||
      formData.resolutionSla !== (editingCategory.resolutionSla || '') ||
      formData.escalationLevel !== (editingCategory.escalationLevel || 'Level 1') ||
      formData.description !== (editingCategory.description || '') ||
      formData.isActive !== (editingCategory.isActive ?? true)
    );
  }, [formData, editingCategory]);

  const handleSubmit = async (): Promise<void> => {
    if (isSubmitting) return;
    setError(null);

    const sanitizedData = { ...formData };
    Object.keys(sanitizedData).forEach((key) => {
      const field = key as keyof GrievanceCategoryFormModel;
      sanitizedData[field] = sanitizeGrievanceCategoryField(field, sanitizedData[field]) as never;
    });

    const newFieldErrors = validateGrievanceCategory(sanitizedData, translateValidation);
    
    // Validate department selection exists in the active lookup options
    const validDeptIds = departments
      .filter((d) => d && d.departmentId)
      .map((d) => d.departmentId);
    
    if (sanitizedData.departmentId && !validDeptIds.includes(Number(sanitizedData.departmentId))) {
      newFieldErrors.departmentId = translateValidation('errors.departmentReq');
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      if (isEdit && sanitizedData.id) fd.set('id', String(sanitizedData.id));
      fd.set('categoryCode', sanitizedData.categoryCode);
      fd.set('categoryName', sanitizedData.categoryName);
      fd.set('departmentId', String(sanitizedData.departmentId ?? ''));
      fd.set('priority', sanitizedData.priority);
      fd.set('resolutionSla', sanitizedData.resolutionSla);
      fd.set('escalationLevel', sanitizedData.escalationLevel);
      fd.set('description', sanitizedData.description);
      fd.set('isActive', String(sanitizedData.isActive));

      const result = await serverAction(fd);
      if (result.success) {
        toast.success(isEdit ? t.toast.updateSuccess : t.toast.createSuccess);
        router.replace(returnPath);
      } else {
        if (result.fieldErrors)
          setFieldErrors(
            result.fieldErrors as Partial<Record<keyof GrievanceCategoryFormModel, string>>
          );
        const translatedError = resolveGrievanceCategoryServerError(result.error, t.errors);
        setError(translatedError);
        toast.error(translatedError);
      }
    } catch (_err) {
      setError(t.errors.unexpected);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    fieldErrors,
    error,
    isSubmitting,
    hasChanges,
    returnPath,
    handleFieldChange,
    handleSubmit,
  };
}
