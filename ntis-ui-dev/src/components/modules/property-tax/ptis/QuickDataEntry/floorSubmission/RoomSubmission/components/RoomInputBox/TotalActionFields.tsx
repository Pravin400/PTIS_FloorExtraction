import React from 'react';
import { Input, Button, Tooltip } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { COLUMN_WIDTHS } from '../../RoomTableConfig';

interface TotalActionFieldsProps {
  isEditMode: boolean;

  t: (key: string, options?: Record<string, unknown>) => string;
  totalAreaValue: number;
  isActualUpdate: boolean;
  handleUpdateRoom: () => void;
  handleAddRoom: () => void;
  maxRooms: number | null;
  availableRooms: number | null;
  rooms: unknown[];
  isUtilityCategory?: boolean;
}

export const TotalActionFields: React.FC<TotalActionFieldsProps> = ({
  isEditMode,

  t,
  totalAreaValue,
  isActualUpdate,
  handleUpdateRoom,
  handleAddRoom,
  maxRooms,
  availableRooms,
  rooms,
  isUtilityCategory,
}) => {

  return (
    <>
      {/* Total */}
      <div className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.total }}>
        <Input
          id="total-area-input"
          type="text"
          value={totalAreaValue.toFixed(2)}
          disabled
          className={cn(
            'text-center h-[40px] font-bold',
            totalAreaValue < 0 ? 'bg-red-100 border-red-400 text-[#DC143C] animate-pulse' : 'bg-[#F8F9FA] border-[#E0E0E0] text-[#333333]'
          )}
        />
      </div>

      {/* Action */}
      <div className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.action }}>
        <div className="flex gap-1 w-full">
          <Tooltip content={ !isUtilityCategory && ((isEditMode && totalAreaValue <= 0) || (!isEditMode && maxRooms && availableRooms !== null && availableRooms <= 0)) ? 
            <p>{isActualUpdate ? t('roomSubmission.input.tooltips.minArea') : maxRooms && rooms.length >= maxRooms ? t('roomSubmission.input.tooltips.maxRooms', { maxRooms }) : t('roomSubmission.input.tooltips.noRooms')}</p> : '' }>
            <Button
              id="add-update-room-button"
              onClick={isActualUpdate ? handleUpdateRoom : handleAddRoom}
              disabled={!isUtilityCategory && !!(maxRooms && availableRooms !== null && availableRooms <= 0 && !isEditMode)}
              variant="primary"
              className="flex-grow h-[40px] font-bold shadow-md"
            >
              {isActualUpdate ? t('roomSubmission.input.buttons.update') : t('roomSubmission.input.buttons.add')}
            </Button>
          </Tooltip>
        </div>
      </div>
    </>
  );
};
