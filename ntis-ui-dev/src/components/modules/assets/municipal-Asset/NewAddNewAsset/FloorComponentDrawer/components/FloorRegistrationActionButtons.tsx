'use client';

import { Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/common';
import type { FloorRegistrationActionButtonsProps } from '@/types/asset/floor-details.types';

export function FloorRegistrationActionButtons({
  t,
  editingId,
  onCancelEdit,
  onAddFloor,
  isLoading,
}: FloorRegistrationActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-2 w-full h-8">
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        {editingId ? (
          <>
            <Button
              onClick={onCancelEdit}
              variant="secondary"
              size="sm"
              className="px-2.5 text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs shrink-0 h-8"
              
            >
              {t('floorDetails.cancel')}
            </Button>
            <Button
              onClick={onAddFloor}
              isLoading={isLoading}
              variant="primary"
              size="sm"
              icon={Edit2}
              className="px-3 text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm shrink-0 h-8 !bg-blue-600 !text-white"
              
            >
              {t('floorDetails.updateFloor')}
            </Button>
          </>
        ) : (
          <Button
            onClick={onAddFloor}
            isLoading={isLoading}
            variant="primary"
            size="sm"
            icon={Plus}
            className="px-4 text-[10.5px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm w-full h-8 !bg-blue-600 !text-white"
            
          >
            {t('floorDetails.addFloor')}
          </Button>
        )}
      </div>
    </div>
  );
}
