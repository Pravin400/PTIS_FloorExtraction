import React from 'react';
import { Select } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { useConfirm } from '@/components/common';
import { RoomFormData } from '@/types/common-details.types';
import { OffsetData } from '@/types/offset-details.types';
import { COLUMN_WIDTHS } from '../../../../QuickDataEntry/floorSubmission/RoomSubmission/RoomTableConfig';

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

export const OffsetOuterFields: React.FC<OffsetOuterFieldsProps> = ({
  formData,
  handleInputChange,
  isEditMode: _isEditMode,
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
}) => {
  const { confirm } = useConfirm();


  return (
    <>
      {/* Offset */}
      <div className={cn("px-1 flex-shrink-0 flex flex-col justify-center", formData.offsetMinus === 'Yes' ? 'cursor-pointer' : '')} 
           style={{ width: COLUMN_WIDTHS.offset }}
           onClick={() => {
             if (formData.offsetMinus === 'Yes' && !offsetModalOpen) {
               setOffsetModalOpen(true); setOffsetList([...currentRoomOffsets]);
               setOffsetData({ length: '', width: '', radius: '', base: '', height: '', side: '', base1: '', base2: '', area: 0, shape: 'Rectangle', operation: 'subtract', shapeType: 'Rectangle' });
               setSelectedOperation('subtract'); setSelectedShape('Rectangle');
             }
           }}>
        <Select
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
              setTimeout(() => { focusRefs?.current['outer']?.focus(); (focusRefs?.current['outer'] as HTMLElement)?.click(); }, 100);
            }
          }}
          disabled={offsetModalOpen}
          className="w-full h-[40px]"
        />
      </div>

      <div className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.outer }}>
        <Select
          options={[{ label: 'No', value: 'No' }, { label: 'Yes', value: 'Yes' }]}
          value={formData.outer}
          onChange={(_, value) => { handleInputChange('outer', value); setTimeout(() => { focusRefs?.current['submit']?.focus(); }, 100); }}
          disabled={offsetModalOpen}
          className="w-full h-[40px]"
        />
      </div>
    </>
  );
};
