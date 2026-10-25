'use client';

import { Database } from 'lucide-react';
import {
  Button,
  Input,
  Drawer,
  Select,
  ValidationMessage,
  RequiredFieldsNote,
} from '@/components/common';
import { Label } from '@/components/common/label';
import { useTranslations } from 'next-intl';
import type { AddConfigValueModalProps } from '@/types/configMaster.types';
import { useAddConfigValue } from '../../../../hooks/useAddConfigValue';
import { ConfigValueInput } from './ConfigValueInput';

/**
 * Drawer for adding a new Configuration Value
 */
export function AddConfigValueModal(props: AddConfigValueModalProps) {
  const t = useTranslations('configMaster');
  const {
    formData,
    errors,
    isPending,
    selectedCategory,
    categoryOptions,
    configKeyOptions,
    selectedConfigKey,
    handleCategoryChange,
    handleChange,
    handleSubmit,
    handleClose,
  } = useAddConfigValue(props);

  return (
    <Drawer
      open={props.isOpen}
      onClose={handleClose}
      width="md"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-sm shadow-violet-200 shrink-0">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
              {t('modals.addValue.title')}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {t('modals.addValue.subtitle')}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={isPending} className="cursor-pointer">
            {t('modals.addValue.buttons.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit()}
            disabled={isPending}
            isLoading={isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
          >
            {isPending
              ? t('modals.addValue.buttons.creating')
              : t('modals.addValue.buttons.create')}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5 light">
        <RequiredFieldsNote text={t('modals.addValue.form.requiredFields')} />
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            {t('modals.addValue.form.filterCategory')}
          </Label>
          <Select
            options={categoryOptions}
            value={selectedCategory}
            onChange={(_, value) => handleCategoryChange(value)}
            disabled={isPending}
            className="cursor-pointer [&_button]:cursor-pointer"
          />
          <p className="text-xs text-slate-500">{t('modals.addValue.form.filterCategoryDesc')}</p>
        </div>

        <div className="space-y-2">
          <Label required className="text-sm font-medium text-slate-700">
            {t('modals.addValue.form.configKey')}
          </Label>
          <Select            options={configKeyOptions}
            value={formData.configKeyId}
            onChange={(_, value) => handleChange('configKeyId', value)}
            disabled={isPending}
            placeholder={t('modals.addValue.form.placeholders.configKey')}
            error={errors.configKeyId}
            className="cursor-pointer [&_button]:cursor-pointer"
          />
          {selectedConfigKey && (
            <p className="text-xs text-slate-500">
              {selectedConfigKey.description}
              {selectedConfigKey.controlType && ` • Type: ${selectedConfigKey.controlType}`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {t('modals.addValue.form.departmentId')}
            </Label>
            <Input
              id="departmentId"
              type="number"
              value={formData.departmentId}
              onChange={(e) => handleChange('departmentId', e.target.value)}
              onKeyDown={(e) => {
                if (/^[eE+\-.,]$/.test(e.key)) e.preventDefault();
              }}
              disabled={isPending}
              placeholder={t('modals.addValue.form.placeholders.departmentId')}
            />
            <ValidationMessage message={errors.departmentId} visible={!!errors.departmentId} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              {t('modals.addValue.form.moduleId')}
            </Label>
            <Input
              id="moduleId"
              type="number"
              value={formData.moduleId}
              onChange={(e) => handleChange('moduleId', e.target.value)}
              onKeyDown={(e) => {
                if (/^[eE+\-.,]$/.test(e.key)) e.preventDefault();
              }}
              disabled={isPending}
              placeholder={t('modals.addValue.form.placeholders.moduleId')}
            />
            <ValidationMessage message={errors.moduleId} visible={!!errors.moduleId} />
          </div>
        </div>

        <div className="space-y-2">
          <Label required className="text-sm font-medium text-slate-700">
            {t('modals.addValue.form.value')}
          </Label>
          <ConfigValueInput
            selectedKey={selectedConfigKey}
            value={formData.value}
            onChange={(val) => handleChange('value', val)}
            disabled={isPending}
            error={errors.value}
          />
          <ValidationMessage message={errors.value} visible={!!errors.value} />
        </div>
      </form>
    </Drawer>
  );
}
