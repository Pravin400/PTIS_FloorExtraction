'use client';

import { Input } from '@/components/common';
import { SubUnitBusinessIdFieldsProps } from '@/types/asset/sub-units.types';

/** GST No / Shop Act No pair — identical across Shop, Office, Room, and
 * Department occupant types (only the Flat/default type omits them). */
export function SubUnitBusinessIdFields({ formData, handleChange, errors, inp, t }: SubUnitBusinessIdFieldsProps) {
  return (
    <>
      <Input
        label={t('subunit.fields.gstNo')}
        name="gstNo"
        value={formData.gstNo || ''}
        error={errors?.gstNo}
        onChange={handleChange}
        className={inp}
      />
      <Input
        label={t('subunit.fields.shopActNo') || 'Shop Act No.'}
        name="shopActNo"
        value={formData.shopActNo || ''}
        error={errors?.shopActNo}
        onChange={handleChange}
        className={inp}
      />
    </>
  );
}
