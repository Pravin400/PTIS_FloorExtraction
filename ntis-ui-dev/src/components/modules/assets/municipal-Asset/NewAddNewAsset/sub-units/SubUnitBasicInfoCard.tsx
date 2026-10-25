'use client';

import { FileText } from 'lucide-react';
import { Input, SearchSelect, Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { SubUnitOccupantFields } from './SubUnitOccupantFields';
import { SubUnitBasicInfoCardProps } from '@/types/asset/sub-units.types';
import { withSelectPlaceholder } from '@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils';

export function SubUnitBasicInfoCard({
  formData,
  setFormData,
  handleChange,
  handleLocalNameChange,
  handleLocalNameBlur,
  handleLocalRenterNameChange,
  handleLocalRenterNameBlur,
  handleRenterToggle,
  selectOnFocus,
  errors,
  departments,
  sectionTitle,
  showRentSection,
    isShop,
  isOffice,
  isRoom,
  isDepartment,
  inp,
  t,
}: SubUnitBasicInfoCardProps) {
  return (
    <Card
      variant="bordered"
      padding="sm"
      className="shadow-sm border-slate-200/80 bg-white rounded-2xl"
    >
      <CardHeader className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF] border border-[#A3CBFA] rounded-xl py-1 px-2.5 mb-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#1d4ed8] p-1 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
            <FileText className="size-3.5 text-white" />
          </div>
          <CardTitle className="text-xs font-bold text-[#1d4ed8] uppercase tracking-widest">
            {sectionTitle}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2 items-start">
        <SearchSelect
          label={t('subunit.fields.departmentName')}
          required={true}
          name="departmentId"
          value={formData.departmentId || ''}
          onChange={(_name, val) => {
            const matched = departments.find((d: { value?: string | number; label?: string }) => String(d.value) === String(val));
            setFormData((prev: Record<string, unknown>) => ({
              ...prev,
              departmentId: val,
              departmentName: matched ? matched.label : '',
            }));
          }}
          options={withSelectPlaceholder(departments)}
          placeholder="--Select--"
        />
        <Input
          label={t('subunit.fields.propertyNo')}
          name="propertyNo"
          value={formData.propertyNo || ''}
          error={errors?.propertyNo}
          onChange={handleChange}
          className={inp}
        />
        <Input
          label={t('subunit.fields.partitionNo') || 'Partition No.'}
          name="partitionNo"
          value={formData.partitionNo || ''}
          error={errors?.partitionNo}
          onChange={handleChange}
          className={inp}
        />

        {showRentSection && (
          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-bold text-slate-600">
              {t('floorDetails.renter') || 'Renter'}
            </label>
            <SearchSelect
              name="isRenter"
              options={withSelectPlaceholder([
                { label: t('floorDetails.no') || 'No', value: 'false' },
                { label: t('floorDetails.yes') || 'Yes', value: 'true' },
              ])}
              value={
                formData.isRenter === true || formData.isRenter === 'true'
                  ? 'true'
                  : formData.isRenter === false || formData.isRenter === 'false'
                    ? 'false'
                    : ''
              }
              onChange={(_name, val) => handleRenterToggle(val)}
              placeholder="--Select--"
            />
          </div>
        )}

        <Input
          label={t('subunit.fields.unitNo') || 'Unit No.'}
          name="unitNo"
          value={formData.unitNo || ''}
          error={errors?.unitNo}
          onChange={handleChange}
          className={inp}
        />

        <Input
          label={t('subunit.fields.mpmsNo') || 'MPMS No.'}
          name="mpmsNo"
          value={formData.mpmsNo || ''}
          onChange={handleChange}
          className={inp}
        />

        <Input
          label={t('subunit.fields.pTaxId') || 'PTax ID'}
          name="pTaxId"
          value={formData.pTaxId || formData.PTaxId || ''}
          onChange={handleChange}
          className={inp}
        />

        {isDepartment && (
          <SubUnitOccupantFields
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            handleChange={handleChange}
            handleLocalNameChange={handleLocalNameChange}
            handleLocalNameBlur={handleLocalNameBlur}
            handleLocalRenterNameChange={handleLocalRenterNameChange}
            handleLocalRenterNameBlur={handleLocalRenterNameBlur}
            selectOnFocus={selectOnFocus}
            isShop={isShop}
            isOffice={isOffice}
            isRoom={isRoom}
            isDepartment={isDepartment}
            inp={inp}
            t={t}
          />
        )}
      </CardContent>
    </Card>
  );
}
