'use client';

import { Input } from '@/components/common';
import { SubUnitContactIdentityFields } from './SubUnitContactIdentityFields';
import { SubUnitBusinessIdFields } from './SubUnitBusinessIdFields';
import { RoomOccupantFieldsProps } from '@/types/asset/sub-units.types';

export function RoomOccupantFields({ formData, setFormData, errors, handleChange, handleLocalRenterNameChange, handleLocalRenterNameBlur, inp, t }: RoomOccupantFieldsProps) {
  return (
    <>
      <Input
        label={t('subunit.fields.roomType')}
        name="roomTypeDesc"
        value={formData.roomTypeDesc || ''}
        onChange={handleChange}
        className={inp}
      />
      <Input
        label={t('subunit.fields.occupantName')}
        required={!!formData.rentType || formData.isRenter === 'Yes' || formData.isRenter === true}
        name="renterName"
        value={formData.renterName || ''}
        error={errors?.renterName}
        onChange={handleChange}
        className={inp}
      />
      <Input
        label={t('subunit.fields.renterNameLocal') || 'Owner / Resident Name (Local)'}
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
      <Input
        label={t('subunit.fields.usagePurpose')}
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
