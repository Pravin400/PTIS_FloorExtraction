'use client';

import React, { useMemo } from 'react';
import { Input, ValidationMessage, Select, SearchSelect, ToggleSwitch } from '@/components/common';
import { SocialAttributeFormModel, SocialAttribute } from '@/types/social-attribute.types';

interface FormFieldsSectionProps {
  formData: SocialAttributeFormModel;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onParentAttributeChange: (name: string, value: string) => void;
  isChild: boolean;
  handleToggleIsChild: () => void;
  handleToggleIsRequiredWhenParentTrue: () => void;
  handleToggleIsDiscountApplicable: () => void;
  handleToggleIsPhotoRequired: () => void;
  handleToggleIsDocumentRequired: () => void;
  errors: Partial<Record<keyof SocialAttributeFormModel, string>>;
  showError: (field: keyof SocialAttributeFormModel) => boolean;
  t: (key: string) => string;
  parentAttributes: SocialAttribute[];
  isEdit: boolean;
  isActive: boolean;
}

export const FormFieldsSection = ({
  formData,
  handleChange,
  handleBlur,
  onParentAttributeChange,
  isChild,
  handleToggleIsChild,
  handleToggleIsRequiredWhenParentTrue,
  handleToggleIsDiscountApplicable,
  handleToggleIsPhotoRequired,
  handleToggleIsDocumentRequired,
  errors,
  showError,
  t,
  parentAttributes,
  isEdit,
  isActive,
}: FormFieldsSectionProps) => {
  const areFieldsDisabled = !isActive;

  const dataTypeOptions = useMemo(
    () => [
      { label: t('form.fields.dataType.placeholder'), value: '' },
      { label: t('form.fields.dataType.options.decimal'), value: 'DECIMAL' },
      { label: t('form.fields.dataType.options.bit'), value: 'BIT' },
      { label: t('form.fields.dataType.options.integer'), value: 'INT' },
      { label: t('form.fields.dataType.options.text'), value: 'TEXT' },
      { label: t('form.fields.dataType.options.date'), value: 'DATE' },
    ],
    [t]
  );

  const unitOptions = useMemo(
    () => [
      { label: t('form.fields.unit.placeholder') || 'Select Unit', value: '' },
      { label: 'Litre - L', value: 'Litre' },
      { label: 'Millilitre - mL', value: 'Millilitre' },
      { label: 'Kilolitre - kL', value: 'Kilolitre' },
      { label: 'Watt - W', value: 'Watt' },
      { label: 'Kilowatt - kW', value: 'Kilowatt' },
      { label: 'Megawatt - MW', value: 'Megawatt' },
      { label: 'Kilowatt Hour - kWh', value: 'Kilowatt Hour' },
      { label: 'Meter - m', value: 'Meter' },
      { label: 'Centimeter - cm', value: 'Centimeter' },
      { label: 'Millimeter - mm', value: 'Millimeter' },
      { label: 'Kilometer - km', value: 'Kilometer' },
      { label: 'Feet - ft', value: 'Feet' },
      { label: 'Inch - in', value: 'Inch' },
      { label: 'Square Meter - m²', value: 'Square Meter' },
      { label: 'Square Feet - ft²', value: 'Square Feet' },
      { label: 'Cubic Meter - m³', value: 'Cubic Meter' },
      { label: 'Cubic Feet - ft³', value: 'Cubic Feet' },
      { label: 'Kilogram - kg', value: 'Kilogram' },
      { label: 'Gram - g', value: 'Gram' },
      { label: 'Ton - t', value: 'Ton' },
      { label: 'Number - No.', value: 'Number' },
      { label: 'Percentage - %', value: 'Percentage' },
      { label: 'Star - Star', value: 'Star' },
    ],
    [t]
  );

  const parentAttributeOptions = useMemo(
    () =>
      parentAttributes
        .filter((attr) => attr.id !== formData.id && attr.parentAttributeId === null)
        .map((attr) => ({
          label: `${attr.socialAttributeName} (${attr.socialAttributeCode})`,
          value: String(attr.id),
        })),
    [parentAttributes, formData.id]
  );

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      {/* Code */}
      <Input
        name="socialAttributeCode"
        label={t('form.fields.socialAttributeCode.label')}
        required
        placeholder={t('form.fields.socialAttributeCode.placeholder')}
        value={formData.socialAttributeCode}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
        disabled={isEdit || areFieldsDisabled}
      />
      <ValidationMessage
        message={errors.socialAttributeCode}
        visible={showError('socialAttributeCode')}
      />

      {/* Name */}
      <Input
        name="socialAttributeName"
        label={t('form.fields.socialAttributeName.label')}
        required
        placeholder={t('form.fields.socialAttributeName.placeholder')}
        value={formData.socialAttributeName}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
        disabled={areFieldsDisabled}
      />
      <ValidationMessage
        message={errors.socialAttributeName}
        visible={showError('socialAttributeName')}
      />

      {/* Data Type */}
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-medium text-slate-700">
          {t('form.fields.dataType.label')} <span className="text-red-500">*</span>
        </label>
        <Select
          name="dataType"
          value={formData.dataType}
          onChange={handleChange}
          onBlur={handleBlur}
          options={dataTypeOptions}
          selectSize="md"
          className="w-full text-gray-700"
          ariaLabel={t('form.fields.dataType.label') || 'Data Type'}
          disabled={areFieldsDisabled}
        />
        <ValidationMessage message={errors.dataType} visible={showError('dataType')} />
      </div>

      {/* Unit */}
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-medium text-slate-700">{t('form.fields.unit.label')}</label>
        <Select
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          onBlur={handleBlur}
          options={unitOptions}
          selectSize="md"
          className="w-full text-gray-700"
          ariaLabel={t('form.fields.unit.label') || 'Unit'}
          disabled={areFieldsDisabled}
        />
        <ValidationMessage message={errors.unit} visible={showError('unit')} />
      </div>

      {/* Is Child Attribute Toggle */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <div>
          <div className="text-sm font-medium text-slate-700">{t('form.fields.isChild.label')}</div>
        </div>
        <ToggleSwitch
          checked={isChild}
          onChange={handleToggleIsChild}
          showPopup={false}
          disabled={areFieldsDisabled}
        />
      </div>

      {/* Parent Attribute & Conditional field (Required when parent true) */}
      {isChild && (
        <>
          <div className="flex flex-col gap-1.5 w-full">
            <SearchSelect
              name="parentAttributeId"
              value={formData.parentAttributeId != null ? String(formData.parentAttributeId) : ''}
              onChange={onParentAttributeChange}
              options={parentAttributeOptions}
              placeholder={t('form.fields.parentAttribute.placeholder')}
              className="w-full text-gray-700"
              label={t('form.fields.parentAttribute.label') || 'Parent Attribute'}
              disabled={areFieldsDisabled}
              required
            />
            <ValidationMessage
              message={errors.parentAttributeId}
              visible={showError('parentAttributeId')}
            />
          </div>

          {formData.parentAttributeId != null && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <div>
                <div className="text-sm font-medium text-slate-700">
                  {t('form.fields.isRequiredWhenParentTrue.label')}
                </div>
              </div>
              <ToggleSwitch
                checked={formData.isRequiredWhenParentTrue}
                onChange={handleToggleIsRequiredWhenParentTrue}
                showPopup={false}
                disabled={areFieldsDisabled}
              />
            </div>
          )}
        </>
      )}

      {/* Discount Applicable */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <div>
          <div className="text-sm font-medium text-slate-700">
            {t('form.fields.isDiscountApplicable.label')}
          </div>
        </div>
        <ToggleSwitch
          checked={formData.isDiscountApplicable}
          onChange={handleToggleIsDiscountApplicable}
          showPopup={false}
          disabled={areFieldsDisabled}
        />
      </div>

      {/* Photo Required & Document Required (Side-by-side) */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">
            {t('form.fields.isPhotoRequired.label')}
          </div>
          <ToggleSwitch
            checked={formData.isPhotoRequired}
            onChange={handleToggleIsPhotoRequired}
            showPopup={false}
            disabled={areFieldsDisabled}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">
            {t('form.fields.isDocumentRequired.label')}
          </div>
          <ToggleSwitch
            checked={formData.isDocumentRequired}
            onChange={handleToggleIsDocumentRequired}
            showPopup={false}
            disabled={areFieldsDisabled}
          />
        </div>
      </div>
    </div>
  );
};
