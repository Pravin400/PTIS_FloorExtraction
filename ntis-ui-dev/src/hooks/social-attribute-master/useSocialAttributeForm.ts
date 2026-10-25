'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  createSocialAttributeAction,
  updateSocialAttributeAction,
} from '@/app/[locale]/property-tax/social-attribute-master/action';
import { SocialAttributeFormModel, SocialAttribute } from '@/types/social-attribute.types';
import { validateForm, commonValidations } from '@/lib/utils/validation';
import {
  SOCIAL_ATTRIBUTE_CODE_MAX,
  SOCIAL_ATTRIBUTE_NAME_MAX,
} from '@/components/modules/property-tax/social-attribute-master/constants';
import { useConfirm } from '@/components/common/ConfirmProvider';

interface UseSocialAttributeFormProps {
  id: number | null;
  initialData?: SocialAttribute;
  existingAttributes?: SocialAttribute[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function useSocialAttributeForm({
  id,
  initialData,
  existingAttributes = [],
  onSuccess,
  onCancel,
}: UseSocialAttributeFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('socialAttribute');
  const tCommon = useTranslations('common');
  const { confirm } = useConfirm();
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [formData, setFormData] = useState<SocialAttributeFormModel>({
    id: id ?? initialData?.id,
    socialAttributeCode: initialData?.socialAttributeCode ?? '',
    socialAttributeName: initialData?.socialAttributeName ?? '',
    dataType: initialData?.dataType ?? '',
    unit: initialData?.unit ?? '',
    displayOrder: initialData?.displayOrder ?? null,
    parentAttributeId: initialData?.parentAttributeId ?? null,
    isRequiredWhenParentTrue: initialData?.isRequiredWhenParentTrue ?? false,
    isDiscountApplicable: initialData?.isDiscountApplicable ?? false,
    isPhotoRequired: initialData?.isPhotoRequired ?? false,
    isDocumentRequired: initialData?.isDocumentRequired ?? false,
    isActive: initialData?.isActive ?? true,
  });

  const [isChild, setIsChild] = useState(initialData?.parentAttributeId != null);
  const [errors, setErrors] = useState<Partial<Record<keyof SocialAttributeFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleToggleIsChild = useCallback((): void => {
    setIsChild((prev) => {
      const newValue = !prev;
      setFormData((p) => {
        const updated = {
          ...p,
          parentAttributeId: newValue ? p.parentAttributeId : null,
          isRequiredWhenParentTrue: newValue ? p.isRequiredWhenParentTrue : false,
        };
        // Reset parentAttributeId error if child is disabled
        if (!newValue) {
          setErrors((prevErr) => {
            const nextErr = { ...prevErr };
            delete nextErr.parentAttributeId;
            return nextErr;
          });
        }
        return updated;
      });
      return newValue;
    });
  }, []);

  const validate = useCallback(
    (data: SocialAttributeFormModel): Partial<Record<keyof SocialAttributeFormModel, string>> => {
      const schema: Record<string, (val: unknown) => string | undefined> = {
        socialAttributeCode: (val: unknown) => {
          const baseErr = commonValidations.masterCode(t, SOCIAL_ATTRIBUTE_CODE_MAX, {
            required: 'form.validation.codeRequired',
            format: 'form.validation.codeFormat',
            maxLength: 'form.validation.codeMaxLength',
          })(val);
          if (baseErr) return baseErr;
          const strVal = String(val ?? '')
            .trim()
            .toUpperCase();
          if (strVal.length < 3) {
            return t('form.validation.codeMinLength');
          }
          if (strVal && /[0-9]/.test(strVal)) {
            return t('form.validation.codeFormat');
          }
          const isDuplicate = existingAttributes.some(
            (attr) => attr.id !== id && attr.socialAttributeCode.trim().toUpperCase() === strVal
          );
          if (isDuplicate) return t('form.validation.codeExists');
          return undefined;
        },
        socialAttributeName: (val: unknown) => {
          const baseErr = commonValidations.masterDescription(t, SOCIAL_ATTRIBUTE_NAME_MAX, {
            required: 'form.validation.nameRequired',
            format: 'form.validation.nameFormat',
            maxLength: 'form.validation.nameMaxLength',
          })(val);
          if (baseErr) return baseErr;

          const strVal = String(val ?? '').trim();
          if (strVal.length < 3) {
            return t('form.validation.nameMinLength');
          }

          const lowerStrVal = strVal.toLowerCase();
          const isDuplicate = existingAttributes.some(
            (attr) => attr.id !== id && attr.socialAttributeName.trim().toLowerCase() === lowerStrVal
          );
          if (isDuplicate) return t('form.validation.nameExists');
          return undefined;
        },
        dataType: (val: unknown) => {
          const strVal = String(val ?? '').trim();
          if (!strVal) return t('form.validation.dataTypeRequired');
          return undefined;
        },
        unit: (val: unknown) => {
          const strVal = String(val ?? '').trim();
          if (strVal && !/^[\p{L}\p{M}\p{N}.%²³\s]+$/u.test(strVal)) {
            return t('form.validation.unitFormat');
          }
          return undefined;
        },
        parentAttributeId: (val: unknown) => {
          if (isChild) {
            if (val === null || val === undefined || val === '') {
              return t('form.validation.parentRequired');
            }
          }
          return undefined;
        },
        isActive: commonValidations.masterActiveStatus(t, isEdit, 'form.validation.mustBeActive'),
      };
      return validateForm(data, schema);
    },
    [t, isEdit, id, existingAttributes, isChild]
  );

  const showError = useCallback(
    (field: keyof SocialAttributeFormModel): boolean =>
      (submittedOnce || touched[field as string]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      const { name, value } = e.target;

      let sanitizedValue = value;
      if (name === 'socialAttributeName') {
        sanitizedValue = value.replace(/[^\p{L}\p{M}\s\-()]/gu, '');
        if (sanitizedValue.length > SOCIAL_ATTRIBUTE_NAME_MAX) {
          sanitizedValue = sanitizedValue.substring(0, SOCIAL_ATTRIBUTE_NAME_MAX);
        }
      } else if (name === 'socialAttributeCode') {
        sanitizedValue = value.replace(/[^A-Za-z_]/g, '').toUpperCase();
        if (sanitizedValue.length > SOCIAL_ATTRIBUTE_CODE_MAX) {
          sanitizedValue = sanitizedValue.substring(0, SOCIAL_ATTRIBUTE_CODE_MAX);
        }
      }

      if (name === 'parentAttributeId') {
        setFormData((p) => ({
          ...p,
          parentAttributeId: value === '' ? null : Number(value),
          isRequiredWhenParentTrue: value === '' ? false : p.isRequiredWhenParentTrue,
        }));
        return;
      }

      setFormData((p) => ({
        ...p,
        [name]: sanitizedValue,
      }));
    },
    []
  );

  const handleParentAttributeChange = useCallback(
    (name: string, value: string): void => {
      setFormData((p) => {
        const updated = {
          ...p,
          parentAttributeId: value === '' ? null : Number(value),
          isRequiredWhenParentTrue: value === '' ? false : p.isRequiredWhenParentTrue,
        };

        // Validate updated state
        const fieldErrors = validate(updated);
        setErrors((prev) => {
          const next = { ...prev };
          if (fieldErrors.parentAttributeId) {
            next.parentAttributeId = fieldErrors.parentAttributeId;
          } else {
            delete next.parentAttributeId;
          }
          return next;
        });

        return updated;
      });
      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    [validate]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>): void => {
      const { name, value } = e.target;
      setTouched((p) => ({ ...p, [name]: true }));

      const updatedFormData = {
        ...formData,
        [name]: name === 'parentAttributeId' ? (value === '' ? null : Number(value)) : value,
      };

      setFormData(updatedFormData);

      const fieldErrors = validate(updatedFormData);
      setErrors((p) => {
        const newErrors = { ...p };
        const fieldName = name as keyof SocialAttributeFormModel;

        if (fieldErrors[fieldName]) {
          newErrors[fieldName] = fieldErrors[fieldName];
        } else {
          delete newErrors[fieldName];
        }

        return newErrors;
      });
    },
    [formData, validate]
  );

  const mapApiError = useCallback(
    (result: { statusCode?: number; message?: string }) => {
      const errorMap: Record<number, string> = {
        409: t('apiErrors.duplicateRecord'),
        404: t('apiErrors.notFound'),
        401: tCommon('errors.unauthorized'),
        403: tCommon('errors.unauthorized'),
      };

      const code = result.statusCode ?? 0;
      if (errorMap[code]) return errorMap[code];

      if (code === 400) {
        const msg = result.message || '';
        if (msg.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(msg);
            if (parsed.errors && typeof parsed.errors === 'object') {
              const errMsgs: string[] = [];
              Object.entries(parsed.errors).forEach(([field, messages]) => {
                if (Array.isArray(messages)) {
                  messages.forEach((m) => {
                    if (m === 'SocialAttribute_Name_MinLength') {
                      errMsgs.push(t('form.validation.nameMinLength'));
                    } else if (m === 'SocialAttribute_Code_MinLength') {
                      errMsgs.push(t('form.validation.codeMinLength'));
                    } else {
                      errMsgs.push(`${field}: ${m}`);
                    }
                  });
                } else if (typeof messages === 'string') {
                  errMsgs.push(messages);
                }
              });
              if (errMsgs.length > 0) return errMsgs.join(', ');
            }
            if (parsed.detail) return parsed.detail;
            if (parsed.title) return parsed.title;
          } catch (_e) {
            // fallback if JSON parsing fails
          }
        }

        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('duplicate') || lowerMsg.includes('already exists')) {
          return t('apiErrors.duplicateRecord');
        }
        return msg || t('apiErrors.invalidData');
      }

      if (code >= 500) return tCommon('errors.serverError');
      return result.message || t('apiErrors.operationFailed');
    },
    [t, tCommon]
  );

  const [open, setOpen] = useState(true);
  const [, startTransition] = React.useTransition();

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      startTransition(() => {
        router.push(`/${locale}/property-tax/social-attribute-master`);
      });
    }, 400);
  }, [router, locale]);

  const handleCancel = useCallback(() => {
    const isDirty =
      formData.socialAttributeCode !== (initialData?.socialAttributeCode ?? '') ||
      formData.socialAttributeName !== (initialData?.socialAttributeName ?? '') ||
      formData.dataType !== (initialData?.dataType ?? '') ||
      formData.unit !== (initialData?.unit ?? '') ||
      formData.displayOrder !== (initialData?.displayOrder ?? null) ||
      formData.parentAttributeId !== (initialData?.parentAttributeId ?? null) ||
      formData.isRequiredWhenParentTrue !== (initialData?.isRequiredWhenParentTrue ?? false) ||
      formData.isDiscountApplicable !== (initialData?.isDiscountApplicable ?? false) ||
      formData.isPhotoRequired !== (initialData?.isPhotoRequired ?? false) ||
      formData.isDocumentRequired !== (initialData?.isDocumentRequired ?? false) ||
      formData.isActive !== (initialData?.isActive ?? true);

    if (isDirty) {
      confirm({
        variant: 'warning',
        title: t('confirmClose.title'),
        description: t('confirmClose.description'),
        confirmText: t('confirmClose.confirmText'),
        cancelText: t('confirmClose.cancelText'),
        onConfirm: () => {
          onCancel();
          closeAndRoute();
        },
      });
    } else {
      onCancel();
      closeAndRoute();
    }
  }, [formData, initialData, onCancel, closeAndRoute, confirm, t]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmittedOnce(true);

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) return;

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateSocialAttributeAction(formData)
        : await createSocialAttributeAction(formData);

      if (!result.success) {
        toast.error(mapApiError(result));
        return;
      }

      toast.success(
        isEdit
          ? t('success.updated', { code: formData.socialAttributeCode })
          : t('success.created', { code: formData.socialAttributeCode })
      );

      onSuccess();
      startTransition(() => {
        router.refresh();
        closeAndRoute();
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback((): void => {
    setIsActive((prev) => {
      const newValue = !prev;
      setFormData((p) => ({ ...p, isActive: newValue }));
      return newValue;
    });
  }, []);

  const handleToggleIsRequiredWhenParentTrue = useCallback((): void => {
    setFormData((p) => ({
      ...p,
      isRequiredWhenParentTrue: !p.isRequiredWhenParentTrue,
    }));
  }, []);

  const handleToggleIsDiscountApplicable = useCallback((): void => {
    setFormData((p) => ({
      ...p,
      isDiscountApplicable: !p.isDiscountApplicable,
    }));
  }, []);

  const handleToggleIsPhotoRequired = useCallback((): void => {
    setFormData((p) => ({
      ...p,
      isPhotoRequired: !p.isPhotoRequired,
    }));
  }, []);

  const handleToggleIsDocumentRequired = useCallback((): void => {
    setFormData((p) => ({
      ...p,
      isDocumentRequired: !p.isDocumentRequired,
    }));
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    isActive,
    isChild,
    open,
    setOpen,
    handleChange,
    handleParentAttributeChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleToggleIsChild,
    handleToggleIsRequiredWhenParentTrue,
    handleToggleIsDiscountApplicable,
    handleToggleIsPhotoRequired,
    handleToggleIsDocumentRequired,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  };
}
