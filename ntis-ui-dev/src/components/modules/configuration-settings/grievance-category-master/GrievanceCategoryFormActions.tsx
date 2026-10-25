'use client';

import { CancelButton, SaveButton } from '@/components/common';
import type { GrievanceCategoryFormActionsProps } from '@/types/grievance-category-master/grievanceCategory.types';

export function GrievanceCategoryFormActions({
  onCancel,
  onSubmit,
  isSubmitting,
  isEdit,
  hasChanges,
  t,
  canSave,
}: GrievanceCategoryFormActionsProps) {
  return (
    <div className="px-6 py-5 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
      <CancelButton
        label={t.buttons.cancel}
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-8 font-semibold hover:bg-slate-50 transition-all duration-200 cursor-pointer"
      />
      <SaveButton
        label={isEdit ? t.buttons.update : t.buttons.add}
        onClick={onSubmit}
        isLoading={isSubmitting}
        disabled={isSubmitting || !canSave || (isEdit && !hasChanges)}
        className="px-8 bg-linear-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] hover:brightness-110 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] transition-all duration-300 font-bold active:scale-95 cursor-pointer"
      />
    </div>
  );
}
