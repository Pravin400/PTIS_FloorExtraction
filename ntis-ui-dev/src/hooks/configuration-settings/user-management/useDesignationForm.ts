'use client';

import { useState } from 'react';
import { Designation } from '@/types/user-management';
import {
  createDesignationAction,
  updateDesignationAction,
} from '@/app/[locale]/configuration-settings/user-management/actions.mutations';
import { userManagementValidations } from '@/lib/utils/user-management-validation';
import { toast } from 'sonner';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { useTranslations } from 'next-intl';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function useDesignationForm(
  onSuccess: (designation: Designation) => void,
  initialData?: Designation
) {
  const t = useTranslations('userManagement');
  const designationLabel = useAliasLabel('Designation', t('aliasFallback.designation'));

  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(
    initialData || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [designationFormData, setDesignationFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    localName: initialData?.localName || '',
    description: initialData?.description || '',
    status: initialData?.status || 'Active',
    isActive: initialData ? !!initialData.isActive : true,
  });

  const resetDesignationForm = () => {
    setDesignationFormData({
      code: '',
      name: '',
      localName: '',
      description: '',
      status: 'Active',
      isActive: true,
    });
    setEditingDesignation(null);
    setErrors({});
  };

  const handleDesignationEdit = (designation: Designation) => {
    setEditingDesignation(designation);
    setDesignationFormData({
      code: designation.code,
      name: designation.name,
      localName: designation.localName,
      description: designation.description,
      status: designation.status,
      isActive: !!designation.isActive,
    });
    setErrors({});
  };

  const handleDesignationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validationErrors = userManagementValidations.validateDesignation(
      designationFormData,
      t,
      {
        designation: designationLabel,
      }
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDesignation) {
        const updatedDesignation: Designation = {
          ...editingDesignation,
          ...designationFormData,
        };
        const res = await updateDesignationAction(updatedDesignation);
        if (res.success) {
          onSuccess(updatedDesignation);
          toast.success(
            t('messages.designationUpdateSuccess', { designation: designationLabel })
          );
          resetDesignationForm();
        } else {
          setErrors(res.validationErrors || {});
          let errorMsg =
            res.message ||
            t('messages.designationUpdateError', { designation: designationLabel });
          if (res.message) {
            if (res.message.startsWith('messages.') || res.message.startsWith('errors.')) {
              errorMsg = t(res.message, { designation: designationLabel });
            } else {
              errorMsg = getCleanErrorMessage(res.message);
            }
          }
          toast.error(errorMsg);
        }
      } else {
        const res = await createDesignationAction(designationFormData);
        if (res.success && res.data) {
          onSuccess(res.data);
          toast.success(
            t('messages.designationCreateSuccess', { designation: designationLabel })
          );
          resetDesignationForm();
        } else {
          setErrors(res.validationErrors || {});
          let errorMsg =
            res.message ||
            t('messages.designationCreateError', { designation: designationLabel });
          if (res.message) {
            if (res.message.startsWith('messages.') || res.message.startsWith('errors.')) {
              errorMsg = t(res.message, { designation: designationLabel });
            } else {
              errorMsg = getCleanErrorMessage(res.message);
            }
          }
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error during designation submission:', error);
      toast.error(getCleanErrorMessage(error, t('messages.unknownError')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    designationFormData,
    setDesignationFormData,
    editingDesignation,
    handleDesignationEdit,
    handleDesignationSubmit,
    resetDesignationForm,
    isSubmitting,
    errors,
  };
}
