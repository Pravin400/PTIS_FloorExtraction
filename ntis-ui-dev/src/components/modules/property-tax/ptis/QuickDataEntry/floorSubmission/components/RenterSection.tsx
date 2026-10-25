'use client';

import React from 'react';
import { UserCheck } from 'lucide-react';
import { SearchSelect, IconButton } from '@/components/common';
import { RenterSectionProps } from '@/types/floor-details.types';
import { FieldWrapper } from './SectionField';

export const RenterSection: React.FC<RenterSectionProps> = ({
  t,
  editingFloorForm,
  setEditingFloorForm,
  handleOpenRenterManagement,
  isOperationLoading,
}) => {
  return (
    <FieldWrapper label={t('floor.renter')} htmlFor="floor-renter">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchSelect
            id="floor-renter"
            name="renter"
            menuPlacement="top"
            options={[
              { label: t('floor.no'), value: 'No' },
              { label: t('floor.yes'), value: 'Yes' },
            ]}
            value={(editingFloorForm.renter as string) || 'No'}
            onChange={(_name, value) => {
              setEditingFloorForm({ ...editingFloorForm, renter: value });
              if (value === 'Yes') {
                handleOpenRenterManagement({ ...editingFloorForm, renter: value });
              }
            }}
            placeholder={t('floor.select')}
            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        {editingFloorForm.renter === 'Yes' && (
          <IconButton
            icon={UserCheck}
            aria-label={t('floor.openRenterPage')}
            title={t('floor.openRenterPage')}
            onClick={() => handleOpenRenterManagement()}
            disabled={isOperationLoading}
            className="h-9 w-9 bg-blue-50 text-blue-600 border-blue-200 rounded-md hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          />
        )}
      </div>
    </FieldWrapper>
  );
};
