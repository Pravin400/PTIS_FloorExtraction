'use client';

import type { ChangeEvent, FocusEvent, RefObject } from 'react';
import { Input, SearchSelect, ValidationMessage } from '@/components/common';
import type { AssetTypeOfUseFormModel } from '@/types/asset-masters/type-of-use.types';

type FormChangeHandler = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
type FormBlurHandler = (event: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
type Translation = (key: string, values?: Record<string, string | number>) => string;

interface TypeOfUseFormFieldsProps {
  formData: AssetTypeOfUseFormModel;
  errors: Partial<Record<keyof AssetTypeOfUseFormModel, string>>;
  categories: { id: number; name: string }[];
  groups: { id: number; name: string }[];
  types: { id: number; name: string }[];
  typeOptions: { value: string; label: string }[];
  codeRef: RefObject<HTMLInputElement | null>;
  handleChange: FormChangeHandler;
  handleBlur: FormBlurHandler;
  showError: (field: keyof AssetTypeOfUseFormModel) => boolean;
  t: Translation;
}

export default function TypeOfUseFormFields({
  formData,
  errors,
  categories,
  groups,
  types,
  typeOptions,
  codeRef,
  handleChange,
  handleBlur,
  showError,
  t,
}: TypeOfUseFormFieldsProps) {
  const selectChange = (name: string, value: string) => {
    handleChange({ target: { name, value } } as ChangeEvent<HTMLSelectElement>);
  };

  const selectBlur = (name: string, value: string) => {
    handleBlur({ target: { name, value } } as FocusEvent<HTMLSelectElement>);
  };

  return (
    <div className="space-y-4">
      <Input
        ref={codeRef}
        name="typeOfUseCode"
        label={t('type.fields.typeId', { default: 'Type Of Use Code' })}
        required
        placeholder={t('type.placeholders.typeId', { default: 'e.g., RES, COM' })}
        value={formData.typeOfUseCode}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
      />
      <ValidationMessage message={errors.typeOfUseCode} visible={showError('typeOfUseCode')} />

      <Input
        name="description"
        label={t('type.fields.description.label', { default: 'Description' })}
        required
        placeholder={t('type.placeholders.description', { default: 'Enter description' })}
        value={formData.description}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
      />
      <ValidationMessage message={errors.description} visible={showError('description')} />

      <Input
        type="number"
        name="searchSequence"
        label={t('type.fields.sequence', { default: 'Sequence' })}
        required
        min={0}
        max={999}
        value={formData.searchSequence === '' ? '' : formData.searchSequence}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (['-', '+', 'e', 'E'].includes(event.key)) event.preventDefault();
        }}
        fullWidth
      />
      <ValidationMessage message={errors.searchSequence} visible={showError('searchSequence')} />

      <SearchSelect
        name="assetCategoryId"
        label={t('type.fields.category', { default: 'Asset Category' })}
        required
        value={String(formData.assetCategoryId || '')}
        onChange={selectChange}
        onBlur={() => selectBlur('assetCategoryId', String(formData.assetCategoryId || ''))}
        options={categories.map((category) => ({
          value: String(category.id),
          label: category.name,
        }))}
      />
      <ValidationMessage message={errors.assetCategoryId} visible={showError('assetCategoryId')} />

      <SearchSelect
        name="assetTypeId"
        label={t('type.fields.assetType', { default: 'Asset Type' })}
        required
        disabled={formData.assetCategoryId <= 0}
        value={String(formData.assetTypeId || '')}
        onChange={selectChange}
        onBlur={() => selectBlur('assetTypeId', String(formData.assetTypeId || ''))}
        options={types.map((type) => ({ value: String(type.id), label: type.name }))}
      />
      <ValidationMessage message={errors.assetTypeId} visible={showError('assetTypeId')} />

      <SearchSelect
        name="typeOfUseGroupId"
        label={t('group.title', { default: 'Use Groups' })}
        required
        value={String(formData.typeOfUseGroupId || '')}
        onChange={selectChange}
        onBlur={() => selectBlur('typeOfUseGroupId', String(formData.typeOfUseGroupId || ''))}
        options={groups.map((group) => ({ value: String(group.id), label: group.name }))}
      />
      <ValidationMessage
        message={errors.typeOfUseGroupId}
        visible={showError('typeOfUseGroupId')}
      />

      <SearchSelect
        name="type"
        label={t('type.fields.type.label', { default: 'Type' })}
        required
        value={formData.type}
        onChange={selectChange}
        onBlur={() => selectBlur('type', String(formData.type || ''))}
        options={typeOptions}
      />
      <ValidationMessage message={errors.type} visible={showError('type')} />
    </div>
  );
}
