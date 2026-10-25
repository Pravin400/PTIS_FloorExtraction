'use client';

import { Input } from '@/components/common';
import { FlatOccupantFields } from './FlatOccupantFields';
import { ShopOccupantFields } from './ShopOccupantFields';
import { OfficeOccupantFields } from './OfficeOccupantFields';
import { RoomOccupantFields } from './RoomOccupantFields';
import { DepartmentOccupantFields } from './DepartmentOccupantFields';
import { SubUnitOccupantFieldsProps } from '@/types/asset/sub-units.types';
import { getUnitNameConfig } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/unit-name-config.utils';

export function SubUnitOccupantFields(props: SubUnitOccupantFieldsProps) {
  const {
    formData,
    setFormData,
    errors,
    handleChange,
    handleLocalNameChange,
    handleLocalNameBlur,
    handleLocalRenterNameChange,
    handleLocalRenterNameBlur,
    selectOnFocus,
    isShop,
    isOffice,
    isRoom,
    isDepartment,
    inp,
    t,
  } = props;

  const isFlat = !isShop && !isOffice && !isRoom && !isDepartment;
  const isUnitWithName = isFlat || isShop || isOffice;
  const nameConfig = getUnitNameConfig({ isShop, isOffice, isFlat }, t);

  return (
    <>
      {isUnitWithName && (
        <>
          <Input
            label={nameConfig.nameLabel}
            name="unitName"
            value={formData.unitName || ''}
            onChange={handleChange}
            placeholder={nameConfig.namePlaceholder}
            className={inp}
          />
          <Input
            label={nameConfig.localNameLabel}
            name="unitNameLocal"
            value={formData.unitNameLocal || ''}
            onChange={handleLocalNameChange}
            onBlur={handleLocalNameBlur}
            placeholder={nameConfig.localNamePlaceholder}
            className={inp}
          />
        </>
      )}
      {isFlat && (
        <FlatOccupantFields
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          handleChange={handleChange}
          handleLocalRenterNameChange={handleLocalRenterNameChange}
          handleLocalRenterNameBlur={handleLocalRenterNameBlur}
          inp={inp}
          t={t}
        />
      )}
      {isShop && (
        <ShopOccupantFields
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          handleChange={handleChange}
          handleLocalNameChange={handleLocalNameChange}
          handleLocalNameBlur={handleLocalNameBlur}
          handleLocalRenterNameChange={handleLocalRenterNameChange}
          handleLocalRenterNameBlur={handleLocalRenterNameBlur}
          inp={inp}
          t={t}
        />
      )}
      {isOffice && (
        <OfficeOccupantFields
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          handleChange={handleChange}
          handleLocalNameChange={handleLocalNameChange}
          handleLocalNameBlur={handleLocalNameBlur}
          handleLocalRenterNameChange={handleLocalRenterNameChange}
          handleLocalRenterNameBlur={handleLocalRenterNameBlur}
          inp={inp}
          t={t}
        />
      )}
      {isRoom && (
        <RoomOccupantFields
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          handleChange={handleChange}
          handleLocalRenterNameChange={handleLocalRenterNameChange}
          handleLocalRenterNameBlur={handleLocalRenterNameBlur}
          inp={inp}
          t={t}
        />
      )}
      {isDepartment && (
        <DepartmentOccupantFields
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          handleChange={handleChange}
          selectOnFocus={selectOnFocus}
          handleLocalRenterNameChange={handleLocalRenterNameChange}
          handleLocalRenterNameBlur={handleLocalRenterNameBlur}
          inp={inp}
          t={t}
        />
      )}
    </>
  );
}
