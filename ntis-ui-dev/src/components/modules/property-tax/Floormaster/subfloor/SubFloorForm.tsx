'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';

import { Drawer } from '@/components/common/Drawer';
import { CancelButton, SaveButton } from '@/components/common';

import {
  createSubFloorAction,
  updateSubFloorAction,
} from '@/app/[locale]/property-tax/floormaster/actions';

import { SubFloorFormModel, SubFloor } from '@/types/floor.types';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';
import { SubFloorFormFields } from './SubFloorFormFields';
import { StatusToggleField } from '../StatusToggleField';
import { MandatoryFieldsNotice } from '../MandatoryFieldsNotice';

import type React from 'react';
import { getApiErrorMessage, parseApiFieldErrors } from '../form-errors';
import {
  validateSubFloorForm,
  sanitizeSubFloorCode,
  sanitizeDescription,
  sanitizeDescriptionEnglish,
} from './validation';

/* ================= PROPS ================= */
export interface SubFloorFormProps {
  id: number | null;
  initialData?: SubFloor;
}

/* ================= MAIN ================= */
export default function SubFloorForm({ id, initialData }: Readonly<SubFloorFormProps>) {
  const router = useRouter();
  const t = useTranslations('floor.subfloor');
  const tCommon = useTranslations('common');
  const floorLabel = useAliasLabel('Floor', t('aliasFallback.floor'));
  const isEdit = Boolean(id);

  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const [formData, setFormData] = useState<SubFloorFormModel>({
    id: initialData?.id,
    subFloorCode: initialData?.subFloorCode ?? '',
    descriptionEnglish: initialData?.descriptionEnglish ?? '',
    description: initialData?.description ?? '',
    sequenceNo: initialData?.sequenceNo ?? '',
    isActive: initialData?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SubFloorFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const locale = useLocale();

  const handleClose = useCallback(() => {
    setOpen(false);
    router.push(`/${locale}/property-tax/floormaster/subfloor`);
  }, [router, locale]);

  /* ================= VALIDATION ================= */
  const validate = useCallback(
    (data: SubFloorFormModel) => {
      return validateSubFloorForm(data, t, isEdit);
    },
    [isEdit, t]
  );

  const showError = (field: keyof SubFloorFormModel) =>
    (submittedOnce || touched[field]) && !!errors[field];

  /* ================= CHANGE ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue: string | number = value;

    if (name === 'descriptionEnglish') {
      newValue = sanitizeDescriptionEnglish(value);
    }

    if (name === 'description') {
      newValue = sanitizeDescription(value);
    }

    if (name === 'subFloorCode') {
      newValue = sanitizeSubFloorCode(value);
    }

    if (name === 'sequenceNo') {
      newValue = value === '' ? '' : Number(value);
    }

    setFormData((p) => ({
      ...p,
      [name]: newValue,
    }));
  };

  /* ================= BLUR ================= */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const fieldErrors = validate({
      ...formData,
      [name]: value,
    });

    setErrors((p) => {
      const newErrors = { ...p };
      const key = name as keyof SubFloorFormModel;

      if (fieldErrors[key]) newErrors[key] = fieldErrors[key];
      else delete newErrors[key];

      return newErrors;
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmittedOnce(true);

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) return;

    setIsSubmitting(true);

    try {
      const result = isEdit
        ? await updateSubFloorAction(formData)
        : await createSubFloorAction(formData);

      if (!result.success) {
        // Try to parse field-specific errors from API response
        if (result.message) {
          const { fieldErrors, genericError, isRfc9110 } = parseApiFieldErrors(result.message);
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...fieldErrors }));
            return;
          }
          // Only use genericError if it came from a valid RFC9110 payload
          if (isRfc9110 && genericError) {
            toast.error(genericError);
            return;
          }
        }
        toast.error(getApiErrorMessage(result, { t, tCommon }));
        return;
      }

      toast.success(
        isEdit
          ? t('messages.updateSuccess', { code: formData.subFloorCode, floor: floorLabel })
          : t('messages.createSuccess', { code: formData.subFloorCode, floor: floorLabel })
      );

      handleClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('apiErrors.operationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = () => {
    setFormData((p) => ({ ...p, isActive: !p.isActive }));
  };

  /* ================= UI ================= */
  return (
    <Drawer
      open={open}
      onClose={handleClose}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t('form.editTitle', { floor: floorLabel }) : t('form.addTitle', { floor: floorLabel })}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t('form.editSubtitle', { floor: floorLabel }) : t('form.addSubtitle', { floor: floorLabel })}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={tCommon('buttons.cancel')}
            onClick={handleClose}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? tCommon('actions.update') : tCommon('actions.save')}
            type="submit"
            form="subfloor-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="subfloor-form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
        {isEdit && (
          <StatusToggleField
            isActive={formData.isActive}
            onChange={handleToggleStatus}
            error={errors.isActive}
            labels={{
              title: t('form.activeStatusTitle'),
              activeText: t('form.activeStatusOn'),
              inactiveText: t('form.activeStatusOff'),
            }}
          />
        )}
        <SubFloorFormFields
          formData={formData}
          errors={errors}
          showError={showError}
          onChange={handleChange}
          onBlur={handleBlur}
          isEdit={isEdit}
          labels={{
            code: t('form.code', { floor: floorLabel }),
            codePlaceholder: t('form.codePlaceholder'),
            descriptionEnglish: t('form.descriptionEnglish'),
            descriptionEnglishPlaceholder: t('form.descriptionEnglishPlaceholder'),
            description: t('form.description'),
            descriptionPlaceholder: t('form.descriptionPlaceholder'),
            sequenceNo: t('form.sequenceNo'),
            sequenceNoPlaceholder: t('form.sequenceNoPlaceholder'),
          }}
        />
        <MandatoryFieldsNotice message={tCommon('note.mandatory')} />
      </form>
    </Drawer>
  );
}
