'use client';

import { Layers } from 'lucide-react';
import { Drawer } from '@/components/common/Drawer';
import { CancelButton, SaveButton } from '@/components/common';
import { StatusToggleSection } from './components/StatusToggleSection';
import { FormFieldsSection } from './components/FormFieldsSection';
import { ValidationSection } from './components/ValidationSection';
import { SocialAttribute } from '@/types/social-attribute.types';
import { useSocialAttributeForm } from '@/hooks/social-attribute-master/useSocialAttributeForm';

export interface SocialAttributeFormProps {
  id: number | null;
  initialData?: SocialAttribute;
  parentAttributes?: SocialAttribute[];
  existingAttributes?: SocialAttribute[];
}

export default function SocialAttributeForm({
  id,
  initialData,
  parentAttributes = [],
  existingAttributes = [],
}: SocialAttributeFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    isActive,
    isChild,
    open,
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
  } = useSocialAttributeForm({
    id,
    initialData,
    existingAttributes,
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
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t('form.editTitle') : t('form.addTitle')}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t('form.editSubtitle') : t('form.subtitle')}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={tCommon('buttons.cancel')}
            onClick={handleCancel}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? t('form.actions.update') : t('form.actions.save')}
            type="submit"
            form="form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="form" onSubmit={handleSubmit} noValidate className="space-y-6 bg-[#F8FAFF] p-5">
        <StatusToggleSection
          isEdit={isEdit}
          isActive={isActive}
          handleToggleStatus={handleToggleStatus}
          error={errors.isActive}
          t={t}
          tCommon={tCommon}
        />

        <FormFieldsSection
          formData={formData}
          handleChange={handleChange}
          handleBlur={handleBlur}
          onParentAttributeChange={handleParentAttributeChange}
          isChild={isChild}
          handleToggleIsChild={handleToggleIsChild}
          handleToggleIsRequiredWhenParentTrue={handleToggleIsRequiredWhenParentTrue}
          handleToggleIsDiscountApplicable={handleToggleIsDiscountApplicable}
          handleToggleIsPhotoRequired={handleToggleIsPhotoRequired}
          handleToggleIsDocumentRequired={handleToggleIsDocumentRequired}
          errors={errors}
          showError={showError}
          t={t}
          parentAttributes={parentAttributes}
          isEdit={isEdit}
          isActive={isActive}
        />

        <ValidationSection tCommon={tCommon} />
      </form>
    </Drawer>
  );
}
