'use client';

import { Label, Input, TextArea, Button, Drawer, ToggleSwitch, ValidationMessage } from '@/components/common';
import { useTranslations } from 'next-intl';
import { DesignationFormProps } from '@/types/user-management';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function DesignationForm({
  isOpen,
  onClose,
  editingDesignation,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  errors,
}: DesignationFormProps) {
  const t = useTranslations('userManagement');
  const designationLabel = useAliasLabel('Designation', t('aliasFallback.designation'));
  const designationCodeLabel = useAliasLabel(
    'Designation_Code',
    t('aliasFallback.designationCode')
  );
  const designationNameLabel = useAliasLabel(
    'Designation_Name',
    t('aliasFallback.designationName')
  );
  const descriptionLabel = useAliasLabel('Description', t('aliasFallback.description'));

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      width="md"
      title={
        <div className="flex flex-col">
          <span className="font-semibold text-xl text-slate-700">
            {editingDesignation
              ? t('roles.editDesignation', { designation: designationLabel })
              : t('roles.addDesignation', { designation: designationLabel })}
          </span>
          <span className="text-sm text-slate-700 font-normal">
            {t('roles.subtitleDesignation', { designation: designationLabel })}
          </span>
        </div>
      }
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1 border-1">
            {t('actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="designation-form"
            disabled={isSubmitting}
            className="flex-1 text-white"
          >
            {isSubmitting
              ? t('actions.saving')
              : editingDesignation
                ? t('actions.updateDesignation', { designation: designationLabel })
                : t('actions.createDesignation', { designation: designationLabel })}
          </Button>
        </div>
      }
    >
      <form id="designation-form" onSubmit={onSubmit} className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{designationCodeLabel} *</Label>
            <Input
              required
              maxLength={10}
              value={formData.code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value.replace(/[^a-zA-Z\u0900-\u097F0-9]/g, '');
                setFormData({ ...formData, code: val });
              }}
              placeholder={designationCodeLabel}
            />
            {errors?.code && (
              <ValidationMessage message={errors.code} />
            )}
          </div>
          <div className="space-y-2">
            <Label>{designationNameLabel || t('roles.designationsTab', { designation: designationLabel })} *</Label>
            <Input
              required
              maxLength={20}
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value.replace(/[^a-zA-Z\u0900-\u097F\s]/g, '');
                setFormData({ ...formData, name: val });
              }}
              placeholder={designationNameLabel || designationLabel}
            />
            {errors?.name && (
              <ValidationMessage message={errors.name} />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{descriptionLabel}</Label>
          <TextArea
            maxLength={50}
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              const val = e.target.value.replace(/[^a-zA-Z\u0900-\u097F\s]/g, '');
              setFormData({ ...formData, description: val });
            }}
            rows={3}
            placeholder={descriptionLabel}
            className="text-black"
          />
          {errors?.description && (
            <ValidationMessage message={errors.description} />
          )}
        </div>

        {editingDesignation && (
          <div className="pt-2">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">{t('filters.status')}</Label>
              </div>
              <ToggleSwitch
                checked={formData.isActive}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                showPopup={false}
              />
            </div>
          </div>
        )}
      </form>
    </Drawer>
  );
}
