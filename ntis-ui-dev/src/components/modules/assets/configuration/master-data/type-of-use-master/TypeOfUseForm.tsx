'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, Layers } from 'lucide-react';
import { Card, CancelButton, PageContainer, SaveButton } from '@/components/common';
import TableHeader from '@/components/common/TableHeader';
import type { AssetTypeOfUse } from '@/types/asset-masters/type-of-use.types';
import { useTypeOfUseForm } from '@/hooks/asset-masters/type-of-use/useTypeOfUseForm';
import TypeOfUseFormFields from './TypeOfUseFormFields';
import TypeOfUseStatusSection from './TypeOfUseStatusSection';

interface TypeOfUseFormProps {
  id: number | null;
  initialData?: AssetTypeOfUse;
  categories: { id: number; name: string }[];
  groups: { id: number; name: string }[];
  types?: { id: number; name: string }[];
  onCategoryChange?: (categoryId: number) => void;
}

export default function TypeOfUseForm({
  id,
  initialData,
  categories,
  groups,
  types: initialTypes = [],
  onCategoryChange,
}: TypeOfUseFormProps) {
  const form = useTypeOfUseForm({ id, initialData, initialTypes, onCategoryChange });
  const codeRef = useRef<HTMLInputElement>(null);
  const statusToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (form.isEdit && statusToggleRef.current) statusToggleRef.current.focus();
      else if (!form.isEdit && codeRef.current) codeRef.current.focus();
    }, 150);
  }, [form.isEdit]);

  const typeOptions = [
    { value: 'R', label: form.t('type.options.residential', { default: 'R - Residential' }) },
    { value: 'C', label: form.t('type.options.commercial', { default: 'C - Commercial' }) },
    { value: 'I', label: form.t('type.options.industrial', { default: 'I - Industrial' }) },
    { value: 'N', label: form.t('type.options.nontaxable', { default: 'N - Non-taxable' }) },
  ];

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <TableHeader
          title={
            form.isEdit
              ? form.t('type.edit', { default: 'Edit Type of Use' })
              : form.t('type.add', { default: 'Add Type of Use' })
          }
          subtitle={form.t('subtitle', { default: 'Configure Types of Use' })}
          icon={Layers}
        />
        <Card className="p-6">
          <form onSubmit={form.handleSubmit} noValidate className="space-y-6">
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
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                isLoading={form.isSubmitting}
              />
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
