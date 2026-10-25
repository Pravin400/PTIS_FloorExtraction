import React from 'react';
import { Input, Tooltip } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { convertSqMToSqFt, convertSqFtToSqM } from '@/lib/utils/RoomSubmission/conversions';
import { RoomFormData } from '@/types/common-details.types';
import { COLUMN_WIDTHS } from '../../../../QuickDataEntry/floorSubmission/RoomSubmission/RoomTableConfig';

interface DimensionAreaFieldsProps {
  formData: RoomFormData;
  handleInputChange: (field: string, value: string) => void;
  isEditMode: boolean;
  validationErrors: Record<string, string>;
  focusRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  t: (key: string) => string;
  areaUnit: string;
  calculatedArea: number;
  adjustedArea: number;
}

export const DimensionAreaFields: React.FC<DimensionAreaFieldsProps> = ({
  formData,
  handleInputChange,
  isEditMode: _isEditMode,
  validationErrors,
  focusRefs,
  t,
  areaUnit,
  calculatedArea,
  adjustedArea,
}) => {
  const setRoomCountRef = (el: HTMLInputElement | null) => {
    if (focusRefs.current) {
      // eslint-disable-next-line react-hooks/immutability
      focusRefs.current['roomCount'] = el;
    }
  };
  return (
    <>
      {/* Area */}
      <div className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.area }}>
        <Tooltip
          content={
            formData.outer === 'Yes' ? (
              <div className="p-1 text-xs">
                {t('roomSubmission.input.tooltips.deduction')}<br />
                {t('roomSubmission.input.tooltips.original')} {calculatedArea.toFixed(2)} {t('roomSubmission.table.unit')}<br />
                {t('roomSubmission.input.tooltips.adjusted')} {adjustedArea.toFixed(2)} {areaUnit}
              </div>
            ) : (
              <div className="p-1 text-xs">
                {areaUnit === 'sq.m' ? (
                  <>{convertSqMToSqFt(calculatedArea).toFixed(2)} {t('roomSubmission.input.buttons.sqft')}</>
                ) : (
                  <>{convertSqFtToSqM(calculatedArea).toFixed(2)} {t('roomSubmission.input.buttons.sqm')}</>
                )}
              </div>
            )
          }
        >
          <Input
            id="calculated-area-input"
            type="text"
            value={adjustedArea.toFixed(2)}
            onFocus={(e) => e.target.select()}
            onChange={(e) => { if (!formData.shape || formData.shape === '-Select-') handleInputChange('length', e.target.value); }}
            disabled={!!formData.shape && formData.shape !== '-Select-'}
            className={cn(
              'text-center h-[40px] font-semibold',
              formData.outer === 'Yes' ? 'bg-amber-50 border-amber-300 text-amber-900' :
                (!formData.shape || formData.shape === '-Select-') ? 'bg-white border-blue-300 text-gray-900' :
                  'bg-[#F8F9FA] border-[#E0E0E0] text-[#333333]'
            )}
          />
        </Tooltip>
      </div>

      {/* Room Count */}
      <div className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.roomCount }}>
        <Input
          ref={setRoomCountRef}
          id="room-count-input"
          type="text"
          value={formData.roomCount}
          maxLength={2}
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleInputChange('roomCount', e.target.value)}
          disabled={false}
          className="text-center h-[40px]"
          placeholder={t('roomSubmission.input.placeholders.roomCount')}
          error={validationErrors.roomCount ? t(validationErrors.roomCount) : undefined}
          data-field="roomCount"
        />
      </div>
    </>
  );
};
