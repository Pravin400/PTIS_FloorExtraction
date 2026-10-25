'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, Layers } from 'lucide-react';
import { Drawer } from '@/components/common/Drawer';
import { CancelButton, SaveButton } from '@/components/common';
import type { AssetTypeOfUse } from '@/types/asset-masters/type-of-use.types';
import { useTypeOfUseForm } from '@/hooks/asset-masters/type-of-use/useTypeOfUseForm';
import TypeOfUseFormFields from './TypeOfUseFormFields';
import TypeOfUseStatusSection from './TypeOfUseStatusSection';

export interface TypeOfUseFormDrawerProps {
  id: number | null;
  initialData?: AssetTypeOfUse;
  categories: { id: number; name: string }[];
  groups: { id: number; name: string }[];
  types?: { id: number; name: string }[];
  onCategoryChange?: (categoryId: number) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TypeOfUseFormDrawer({
  id,
  initialData,
  categories,
  groups,
  types: initialTypes = [],
  onCategoryChange,
  onSuccess,
  onCancel,
}: TypeOfUseFormDrawerProps) {
  const form = useTypeOfUseForm({
    id,
    initialData,
    onSuccess,
    onCancel,
    initialTypes,
    onCategoryChange,
  });
  const statusToggleRef = useRef<HTMLButtonElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (form.open) {
      setTimeout(() => {
        if (form.isEdit && statusToggleRef.current) statusToggleRef.current.focus();
        else if (!form.isEdit && codeRef.current) codeRef.current.focus();
      }, 150);
    }
  }, [form.open, form.isEdit]);

  const typeOptions = [
    { value: 'R', label: form.t('type.options.residential', { default: 'R - Residential' }) },
    { value: 'C', label: form.t('type.options.commercial', { default: 'C - Commercial' }) },
    { value: 'I', label: form.t('type.options.industrial', { default: 'I - Industrial' }) },
    { value: 'N', label: form.t('type.options.nontaxable', { default: 'N - Non-taxable' }) },
  ];

  return (
    <Drawer
      open={form.open}
      onClose={form.handleCancel}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {form.isEdit
                ? form.t('type.edit', { default: 'Edit Type of Use' })
                : form.t('type.add', { default: 'Add Type of Use' })}
            </div>
            <div className="text-sm text-slate-500">
              {!form.isEdit &&
              form.formData.typeOfUseGroupId > 0 &&
              groups.find((group) => group.id === form.formData.typeOfUseGroupId)
                ? form.t('messages.addingTo', {
                    name:
                      groups.find((group) => group.id === form.formData.typeOfUseGroupId)?.name ||
                      '',
                  })
                : form.t('subtitle', { default: 'Configure Types of Use' })}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={form.tCommon('buttons.cancel')}
            onClick={form.handleCancel}
            disabled={form.isSubmitting}
          />
          <SaveButton
            label={
              form.isEdit
                ? form.tCommon('actions.update', { default: 'Update' })
                : form.tCommon('buttons.save', { default: 'Save' })
            }
            type="submit"
            form="typeofuse-form"
            isLoading={form.isSubmitting}
          />
        </>
      }
    >
      <form id="typeofuse-form" onSubmit={form.handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
        {form.isEdit && (
          <TypeOfUseStatusSection
            isActive={form.isActive}
            error={form.errors.isActive}
            statusToggleRef={statusToggleRef}
            onToggle={form.handleToggleStatus}
            t={form.t}
          />
        )}
        <TypeOfUseFormFields
          formData={form.formData}
          errors={form.errors}
          categories={categories}
          groups={groups}
          types={form.types}
          typeOptions={typeOptions}
          codeRef={codeRef}
          handleChange={form.handleChange}
          handleBlur={form.handleBlur}
          showError={form.showError}
          t={form.t}
        />
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>{form.tCommon('note.mandatory')}</span>
        </div>
      </form>
    </Drawer>
  );
}
