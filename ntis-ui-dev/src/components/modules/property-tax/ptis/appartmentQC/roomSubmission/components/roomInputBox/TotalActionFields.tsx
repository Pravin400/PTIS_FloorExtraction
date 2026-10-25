import React from 'react';
import { Input, Button, Tooltip } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { COLUMN_WIDTHS } from '../../../../QuickDataEntry/floorSubmission/RoomSubmission/RoomTableConfig';

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
}

export const TotalActionFields: React.FC<TotalActionFieldsProps> = ({
  isEditMode: _isEditMode,

  t,
  totalAreaValue,
  isActualUpdate,
  handleUpdateRoom,
  handleAddRoom,
  maxRooms: _maxRooms,
  availableRooms: _availableRooms,
  rooms: _rooms,
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
        <Tooltip content={ totalAreaValue <= 0 ? 
          <p>{t('roomSubmission.input.tooltips.minArea')}</p> : '' }>
          <Button
            id="add-update-room-button"
            onClick={isActualUpdate ? handleUpdateRoom : handleAddRoom}
            disabled={false}
            variant="primary"
            className="w-full h-[40px] font-bold shadow-md"
            data-enter-navigable="true"
          >
            {isActualUpdate ? t('roomSubmission.input.buttons.update') : t('roomSubmission.input.buttons.add')}
          </Button>
        </Tooltip>
      </div>
    </>
  );
};
