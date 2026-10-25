import React from 'react';
import { SearchSelect } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { COLUMN_WIDTHS } from '../../RoomTableConfig';
import { useConfirm } from '@/components/common';
import { RoomFormData } from '@/types/common-details.types';
import { OffsetData } from '@/types/offset-details.types';
import { isRecordOpenPlot } from '@/hooks/ptis/floorSubmission/useFloorAreaValidation';

interface OffsetOuterFieldsProps {
  formData: RoomFormData;
  handleInputChange: (field: string, value: string) => void;
  isEditMode: boolean;
  focusRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  t: (key: string) => string;
  offsetModalOpen: boolean;
  setOffsetModalOpen: (open: boolean) => void;
  setOffsetList: (list: OffsetData[]) => void;
  setOffsetData: (data: OffsetData) => void;
  setSelectedOperation: (op: "add" | "subtract" | null) => void;
  setSelectedShape: (shape: string) => void;
  currentRoomOffsets: OffsetData[];
  setCurrentRoomOffsets: (offsets: OffsetData[]) => void;
  calculatedArea: number;
}

export const OffsetOuterFields: React.FC<OffsetOuterFieldsProps & { floorData?: Record<string, unknown> }> = ({
  formData,
  handleInputChange,
  isEditMode,
  focusRefs,
  t,
  offsetModalOpen,
  setOffsetModalOpen,
  setOffsetList,
  setOffsetData,
  setSelectedOperation,
  setSelectedShape,
  currentRoomOffsets,
  setCurrentRoomOffsets,
  calculatedArea,
  floorData,
}) => {
  const { confirm } = useConfirm();

  const isOpenSpace = isRecordOpenPlot(floorData);

  return (
    <>
      {/* Offset */}
      <div
        ref={(el) => {
          if (focusRefs?.current && el) {
            const btn = el.querySelector('input[role="combobox"]') as HTMLElement | null;
            // eslint-disable-next-line react-hooks/immutability
            focusRefs.current['offset'] = btn;
          }
        }}
        className={cn("px-1 flex-shrink-0 flex flex-col justify-center", formData.offsetMinus === 'Yes' && isEditMode ? 'cursor-pointer' : '')}
        style={{ width: COLUMN_WIDTHS.offset }}
        onClick={() => {
          if (formData.offsetMinus === 'Yes' && isEditMode && !offsetModalOpen) {
            setOffsetModalOpen(true); setOffsetList([...currentRoomOffsets]);
            setOffsetData({ length: '', width: '', radius: '', base: '', height: '', side: '', base1: '', base2: '', area: 0, shape: 'Rectangle', operation: 'subtract', shapeType: 'Rectangle' });
            setSelectedOperation('subtract'); setSelectedShape('Rectangle');
          }
        }}
      >
        <SearchSelect
          id="room-offset-select"
          name="offsetMinus"
          options={[{ label: 'No', value: 'No' }, { label: 'Yes', value: 'Yes' }]}
          value={formData.offsetMinus}
          onChange={(_, value) => {
            if (value === 'Yes') {
              if (calculatedArea === 0) { confirm({ variant: 'warning', title: t('offset.cannotEnable.title'), description: t('offset.cannotEnable.message'), onConfirm: () => { } }); return; }
              handleInputChange('offsetMinus', 'Yes');
              setTimeout(() => {
                setOffsetModalOpen(true); setOffsetList([...currentRoomOffsets]);
                setOffsetData({ length: '', width: '', radius: '', base: '', height: '', side: '', base1: '', base2: '', area: 0, shape: 'Rectangle', operation: 'subtract', shapeType: 'Rectangle' });
                setSelectedOperation('subtract'); setSelectedShape('Rectangle');
              }, 100);
            } else {
              setCurrentRoomOffsets([]); handleInputChange('offsetMinus', value);
              setTimeout(() => {
                const outerInput = focusRefs?.current['outer'] as HTMLElement | null;
                if (outerInput) {
                  outerInput.focus();
                  const outerClickable = outerInput.querySelector('input[role="combobox"]') as HTMLElement | null;
                  if (outerClickable) outerClickable.click();
                }
              }, 100);
            }
          }}
          disabled={!isEditMode || offsetModalOpen}
          className="w-full h-[40px]"
          disableSearch={true}
        />
      </div>

      {!isOpenSpace && (
        <div
          ref={(el) => {
            if (focusRefs?.current && el) {
              const btn = el.querySelector('input[role="combobox"]') as HTMLElement | null;
              // eslint-disable-next-line react-hooks/immutability
              focusRefs.current['outer'] = btn;
            }
          }}
          className="flex flex-col justify-center flex-shrink-0 px-1"
          style={{ width: COLUMN_WIDTHS.outer }}
        >
          <SearchSelect
            id="room-outer-select"
            name="outer"
            options={[{ label: 'No', value: 'No' }, { label: 'Yes', value: 'Yes' }]}
            value={formData.outer}
            onChange={(_, value) => { handleInputChange('outer', value); setTimeout(() => { focusRefs?.current['submit']?.focus(); }, 100); }}
            disabled={!isEditMode || offsetModalOpen}
            className="w-full h-[40px]"
            disableSearch={true}
          />
        </div>
      )}
    </>
  );
};
