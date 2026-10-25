'use client';

import { Label } from '@/components/common/label';
import { Input, Select, ValidationMessage, TextArea, StatusToggleCard } from '@/components/common';
import type { Option } from '@/components/common';
import { useTranslations } from 'next-intl';
import type { FormState } from '@/types/configMaster.types';
import { DateUtils } from '@/lib/utils/date-helpers';


interface ConfigKeyFormFieldsProps {
  formData: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  categoryOptions: Option[];
  isPending: boolean;
  isEdit: boolean;
  onFieldChange: (field: keyof FormState, value: string | number | boolean | null) => void;
  onDataTypeChange: (value: string) => void;
}



const DATA_TYPES: Option[] = [
  { value: 'string', label: 'String' }, { value: 'int', label: 'Integer' },
  { value: 'decimal', label: 'Decimal' }, { value: 'datetime', label: 'DateTime' },
  { value: 'boolean', label: 'Boolean' }
];

const BOOLEAN_OPTIONS: Option[] = [
  { value: 'true', label: 'True' }, { value: 'false', label: 'False' }
];

export function ConfigKeyFormFields({
  formData,
  errors,
  categoryOptions,
  isPending,
  isEdit,
  onFieldChange,
  onDataTypeChange,
}: ConfigKeyFormFieldsProps) {
  const t = useTranslations('configMaster');

  return (
    <div className="p-6 space-y-5">
      {/* Category Selection */}
      <div className="space-y-2">
        <Label htmlFor="categoryId" required>
          {t('modals.addKey.form.category')}
        </Label>
        <Select options={categoryOptions}
          value={formData.categoryId}
          onChange={(_, value) => onFieldChange('categoryId', value)}
          placeholder={t('modals.addKey.form.placeholders.category')}
          error={errors.categoryId}
          disabled={isPending}
          className="cursor-pointer [&_button]:cursor-pointer"
        />
      </div>

      {/* Config Code */}
      <div className="space-y-2">
        <Label htmlFor="configCode" required>
          {t('modals.addKey.form.code')}
        </Label>
        <Input
          id="configCode"
          value={formData.configCode || ''}
          onChange={(e) => {
            const sanitized = e.target.value.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
            onFieldChange('configCode', sanitized);
          }}
          placeholder={t('modals.addKey.form.placeholders.code')}
          className={errors.configCode ? 'border-red-500' : ''}
          disabled={isPending}
          maxLength={50}
          autoComplete="off"
          aria-invalid={errors.configCode ? 'true' : 'false'}
          aria-describedby={errors.configCode ? 'configCode-error' : undefined}
        />
        <ValidationMessage id="configCode-error" message={errors.configCode} visible={!!errors.configCode} />
      </div>

      {/* Config Name */}
      <div className="space-y-2">
        <Label htmlFor="configName" required>
          {t('modals.addKey.form.name')}
        </Label>
        <TextArea
          id="configName"
          value={formData.configName || ''}
          onChange={(e) => {
            const sanitized = e.target.value.replace(/[^\p{L}\p{M}\p{N}\s]/gu, '');
            onFieldChange('configName', sanitized);
          }}
          placeholder={t('modals.addKey.form.placeholders.name')}
          className={errors.configName ? 'border-red-500' : ''}
          disabled={isPending}
          maxLength={100}
          rows={2}
          aria-invalid={errors.configName ? 'true' : 'false'}
          aria-describedby={errors.configName ? 'configName-error' : undefined}
        />
        <ValidationMessage id="configName-error" message={errors.configName} visible={!!errors.configName} />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('modals.addKey.form.description')}</Label>
        <TextArea
          id="description"
          value={formData.description || ''}
          onChange={(e) => {
            onFieldChange('description', e.target.value);
          }}
          placeholder={t('modals.addKey.form.placeholders.description')}
          className={errors.description ? 'border-red-500' : ''}
          rows={2}
          disabled={isPending}
          maxLength={255}
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        <ValidationMessage id="description-error" message={errors.description} visible={!!errors.description} />
      </div>

      {/* Data Type */}
      <div className="space-y-2">
        <Label htmlFor="dataType" required>
          {t('modals.addKey.form.dataType')}
        </Label>
        <Select options={DATA_TYPES}
          value={formData.dataType}
          onChange={(_, value) => onDataTypeChange(value)}
          placeholder={t('modals.addKey.form.placeholders.dataType')}
          disabled={isPending}
          error={errors.dataType}
          className="cursor-pointer [&_button]:cursor-pointer"
        />
      </div>

      {/* Default Value */}
      <div className="space-y-2">
        <Label htmlFor="defaultValue">{t('modals.addKey.form.defaultValue')}</Label>
        {formData.dataType === 'boolean' ? (
          <>
            <Select options={BOOLEAN_OPTIONS}
              value={formData.defaultValue}
              onChange={(_, value) => onFieldChange('defaultValue', value)}
              placeholder={t('modals.addKey.form.placeholders.defaultValue')}
              disabled={isPending}
              error={errors.defaultValue}
              className="cursor-pointer [&_button]:cursor-pointer"
            />
            <ValidationMessage id="defaultValue-error" message={errors.defaultValue} visible={!!errors.defaultValue} />
          </>
        ) : (
          (() => {
            const currentYear = new Date().getFullYear();
            const isDateTime = formData.dataType === 'datetime';
            const formattedDefaultValue = isDateTime
              ? DateUtils.formatForInput(formData.defaultValue || '', true)
              : formData.defaultValue || '';

            return (
              <>
                <Input
                  id="defaultValue"
                  type={
                    formData.dataType === 'int' || formData.dataType === 'decimal'
                      ? 'number'
                      : formData.dataType === 'datetime'
                        ? 'datetime-local'
                        : 'text'
                  }
                  min={
                    formData.dataType === 'int'
                      ? 1
                      : formData.dataType === 'decimal'
                        ? 0.01
                        : formData.dataType === 'datetime'
                          ? `${currentYear}-01-01T00:00`
                          : undefined
                  }
                  max={formData.dataType === 'datetime' ? '2100-12-31T23:59' : undefined}
                  step={formData.dataType === 'decimal' ? 'any' : formData.dataType === 'int' ? 1 : undefined}
                  value={formData.dataType === 'datetime' ? (formattedDefaultValue || formData.defaultValue || '') : (formData.defaultValue || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    onFieldChange('defaultValue', isDateTime && val ? val.replace('T', ' ') : val);
                  }}
                  onKeyDown={(e) => {
                    if (formData.dataType === 'int' && /^[eE+\-.,]$/.test(e.key)) e.preventDefault();
                    if (formData.dataType === 'decimal' && /^[eE+\-]$/.test(e.key)) e.preventDefault();
                  }}
                  placeholder={t('modals.addKey.form.placeholders.defaultValue')}
                  className={errors.defaultValue ? 'border-red-500' : ''}
                  disabled={isPending}
                  maxLength={100}
                  autoComplete="off"
                  aria-invalid={errors.defaultValue ? 'true' : 'false'}
                  aria-describedby={errors.defaultValue ? 'defaultValue-error' : undefined}
                />
                <ValidationMessage id="defaultValue-error" message={errors.defaultValue} visible={!!errors.defaultValue} />
              </>
            );
          })()
        )}
      </div>



      {/* Status Toggle - Only show in Edit mode */}
      {isEdit && (
        <div
          onClick={(e) => {
            if (isPending) return;
            const target = e.target as HTMLElement;
            if (target.closest('button')) return;
            onFieldChange('isActive', !formData.isActive);
          }}
          className="cursor-pointer"
        >
          <StatusToggleCard
            isActive={formData.isActive}
            onToggle={(checked) => onFieldChange('isActive', checked)}
            activeLabel={t('modals.addKey.form.active')}
            inactiveLabel={t('modals.addKey.form.inactive')}
            statusLabel={t('modals.addKey.form.status')}
            description={formData.isActive ? t('modals.addKey.form.activeDescription') : t('modals.addKey.form.inactiveDescription')}
            disabled={isPending}
            className="cursor-pointer [&_button]:cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}

