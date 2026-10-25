import React from 'react';
import { Input, Select } from '@/components/common';
import { RoomFormData } from '@/types/common-details.types';
// import { RoomTypeSelect } from '../../../../QuickDataEntry/floorSubmission/RoomSubmission/components/RoomTypeSelect';
import { COLUMN_WIDTHS } from '../../../../QuickDataEntry/floorSubmission/RoomSubmission/RoomTableConfig';
import { RoomTypeSelect } from '../RoomTypeSelect';

interface RoomTypeShapeFieldsProps {
  formData: RoomFormData;
  handleInputChange: (field: string, value: string) => void;
  isEditMode: boolean;
  validationErrors: Record<string, string>;
  focusRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  t: (key: string) => string;
}

export const RoomTypeShapeFields: React.FC<RoomTypeShapeFieldsProps> = ({
  formData,
  handleInputChange,
  isEditMode: _isEditMode,
  validationErrors,
  focusRefs,
  t,
}) => {
  const setRoomNoRef = (el: HTMLElement | null) => {
    if (focusRefs.current) {
      // eslint-disable-next-line react-hooks/immutability
      focusRefs.current['roomNo'] = el;
    }
  };



  return (
    <>
      {/* Room No */}
      <div className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.roomNo }}>
         <Input
          ref={setRoomNoRef}
          id="room-no-input"
          type="text"
          fullWidth
          value={formData.roomNo}
          maxLength={2}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            let value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
            if (value && (value === '0' || parseFloat(value) < 1)) value = '';
            handleInputChange('roomNo', value);
          }}
          disabled={true}
          className="text-center h-[40px]"
          placeholder={t('roomSubmission.input.placeholders.auto')}
          // error={validationErrors.roomNo ? t(validationErrors.roomNo) : undefined}
        />
      </div>

      {/* Room Type */}
      <div className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.roomType }}>
        <RoomTypeSelect
          value={formData.utilities}
          onChange={(value, roomTypeId) => {
            handleInputChange('utilities', value);
            // Always set roomTypeId - use empty string if undefined to clear previous value
            handleInputChange('roomTypeId', roomTypeId !== undefined ? String(roomTypeId) : '');
            setTimeout(() => { 
              const shapeContainer = document.getElementById('shape-select-container');
              const shapeBtn = shapeContainer?.querySelector('button[role="combobox"]');
              if (shapeBtn instanceof HTMLElement) {
                shapeBtn.focus();
                shapeBtn.click();
              }
            }, 100);
          }}
          disabled={false}
          className="w-full h-[40px]"
          autoFocus={true}
        />
        {validationErrors.utilities && (
          <span className="text-[10px] text-red-500 mt-0.5">{t(validationErrors.utilities)}</span>
        )}
      </div>

      <div id="shape-select-container" className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.shape }}>
        <Select
          options={[
            { label: t('roomSubmission.input.shapes.select'), value: '-Select-' },
            { label: t('roomSubmission.input.shapes.rectangle'), value: 'Rectangle' },
            { label: t('roomSubmission.input.shapes.square'), value: 'Square' },
            { label: t('roomSubmission.input.shapes.triangle'), value: 'Triangle' },
            { label: t('roomSubmission.input.shapes.trapezoid'), value: 'Trapezoid' },
            { label: t('roomSubmission.input.shapes.circle'), value: 'Circle' },
            { label: t('roomSubmission.input.shapes.semiCircle'), value: 'Semi Circle' },
            { label: t('roomSubmission.input.shapes.quarterCircle'), value: 'Quarter Circle' },
          ]}
          value={formData.shape || '-Select-'}
          onChange={(_, value) => {
            handleInputChange('shape', value);
            setTimeout(() => {
              const firstParam = document.querySelector('input[data-param]');
              if (firstParam instanceof HTMLElement) firstParam.focus();
              else focusRefs?.current['roomCount']?.focus();
            }, 100);
          }}
          disabled={false}
          className="w-full h-[40px]"
        />
      </div>
    </>
  );
};
