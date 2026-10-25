'use client';

import { Input } from '@/components/common';
import { AnimatedDigitInput } from '@/components/common/AnimatedDigitInput';
import { SubUnitContactIdentityFields } from './SubUnitContactIdentityFields';
import { SubUnitBusinessIdFields } from './SubUnitBusinessIdFields';
import { DepartmentOccupantFieldsProps } from '@/types/asset/sub-units.types';

export function DepartmentOccupantFields({
  formData,
  setFormData,
  errors,
  handleChange,
  selectOnFocus,
  handleLocalRenterNameChange,
  handleLocalRenterNameBlur,
  inp,
  t,
}: DepartmentOccupantFieldsProps) {
  return (
    <>
      <Input
        label={t('subunit.fields.departmentName')}
        name="unitName"
        value={formData.unitName || ''}
        onChange={handleChange}
        className={inp}
      />
      <Input
        required={!!formData.rentType || formData.isRenter === 'Yes' || formData.isRenter === true}
        name="renterName"
        value={formData.renterName || ''}
        error={errors?.renterName}
        onChange={handleChange}
        className={inp}
      />
      <Input
        label={t('subunit.fields.renterNameLocal') || 'Department Head (Local)'}
        name="renterNameLocal"
        value={formData.renterNameLocal || ''}
        onChange={handleLocalRenterNameChange}
        onBlur={handleLocalRenterNameBlur}
        className={inp}
      />
      <Input
        label={t('subunit.fields.emailId')}
        name="emailId"
        value={formData.emailId || ''}
        error={errors?.emailId}
        onChange={handleChange}
        className={inp}
      />
      <Input
        label={(t as { has?: (k: string) => boolean })?.has?.('floorDetails.tenantAddress') ? t('floorDetails.tenantAddress') : 'Tenant Address'}
        name="tenantAddress"
        value={formData.tenantAddress || ''}
        onChange={handleChange}
        className={inp}
      />
      <AnimatedDigitInput
        label={t('subunit.fields.noOfStaff')}
        name="noOfStaff"
        onFocus={selectOnFocus}
        value={String(formData.noOfStaff || '')}
        onChange={(val) => setFormData((p: Record<string, unknown>) => ({ ...p, noOfStaff: val ? Number(val) : '' }))}
        className={inp}
      />
      <Input
        label={t('subunit.fields.remarks')}
        name="propertyDescription"
        value={formData.propertyDescription || ''}
        onChange={handleChange}
        className={inp}
      />
      <SubUnitBusinessIdFields formData={formData} handleChange={handleChange} errors={errors} inp={inp} t={t} />
      <SubUnitContactIdentityFields formData={formData} setFormData={setFormData} errors={errors} t={t} isRequired={!!formData.rentType || formData.isRenter === 'Yes' || formData.isRenter === true} />
    </>
  );
}
