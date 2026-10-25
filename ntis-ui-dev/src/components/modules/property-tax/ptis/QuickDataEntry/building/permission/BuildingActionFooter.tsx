import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button, SaveButton, Tooltip } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import type { DeleteAccessInfo } from './building-permission.types';

interface BuildingActionFooterProps {
  canRenderDelete: boolean;
  deleteAccessInfo: DeleteAccessInfo;
  isSaving: boolean;
  isDeletingRecord: boolean;
  onDeleteClick: () => void;
  onSaveClick: () => void;
  isFormDisabled: boolean;
  isDirty: boolean;
  isCertificateFilled: boolean;
  t: (key: string) => string;
}

export function BuildingActionFooter({
  canRenderDelete,
  deleteAccessInfo,
  isSaving,
  isDeletingRecord,
  onDeleteClick,
  onSaveClick,
  isFormDisabled,
  isDirty,
  isCertificateFilled,
  t,
}: BuildingActionFooterProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-shrink-0">
      {canRenderDelete ? (
        <Tooltip content={deleteAccessInfo.tooltip || undefined} placement="top">
          <span className="inline-block" title={deleteAccessInfo.tooltip || undefined}>
            <Button
              variant="delete"
              size="sm"
              icon={Trash2}
              disabled={isSaving || isDeletingRecord || !deleteAccessInfo.canDelete}
              isLoading={isDeletingRecord}
              onClick={onDeleteClick}
              className={cn(
                'text-xs font-bold border rounded-lg',
                deleteAccessInfo.canDelete
                  ? 'border-red-200 text-red-700 hover:bg-red-50/50 hover:border-red-500 cursor-pointer'
                  : 'border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
              )}
            >
              {t('building.deleteCertificate') || 'Delete Certificate'}
            </Button>
          </span>
        </Tooltip>
      ) : (
        <div />
      )}
      <SaveButton
        onClick={onSaveClick}
        disabled={isFormDisabled || isDeletingRecord || !isDirty || !isCertificateFilled}
        isLoading={isSaving}
        label={t('common.saveChanges') || 'Save Changes'}
      />
    </div>
  );
}
