import React from 'react';
import { Input, Tooltip, AnimatedDigitInput } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { COLUMN_WIDTHS } from '../../RoomTableConfig';
import { convertSqMToSqFt, convertSqFtToSqM } from '@/lib/utils/RoomSubmission/conversions';
import { RoomFormData } from '@/types/common-details.types';

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
  isUtilityCategory?: boolean;
}

export const DimensionAreaFields: React.FC<DimensionAreaFieldsProps> = ({
  formData,
  handleInputChange,
  isEditMode,
  focusRefs,
  t,
  areaUnit,
  calculatedArea,
  adjustedArea,
  isUtilityCategory,
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
            value={calculatedArea.toFixed(2)}
            readOnly
            className={cn(
              'text-center h-[40px] font-semibold',
              formData.outer === 'Yes' ? 'bg-amber-50 border-amber-300 text-amber-900' :
                (!formData.shape || formData.shape === '-Select-') && isEditMode ? 'bg-white border-blue-300 text-gray-900' :
                  'bg-[#F8F9FA] border-[#E0E0E0] text-[#333333]'
            )}
          />
        </Tooltip>
      </div>


      {/* Room Count */}
      <div className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.roomCount }}>
        <AnimatedDigitInput
          ref={setRoomCountRef}
          id="room-count-input"
          data-field="roomCount"
          value={formData.roomCount}
          maxLength={2}
          onFocus={(e) => e.target.select()}
          onChange={(val) => handleInputChange('roomCount', val)}
          disabled={!isEditMode}
          readOnly={isUtilityCategory}
          className={cn(
            "text-center h-[40px] leading-[40px]",
            isUtilityCategory && "bg-gray-50 text-gray-500 cursor-not-allowed"
          )}
          placeholder={t('roomSubmission.input.placeholders.roomCount')}
        />
      </div>
    </>
  );
};
