'use client';

import { EditButton, DeleteButton } from '@/components/common/ActionButtons';
import type { GrievanceCategoryActionsProps } from '@/types/grievance-category-master/grievanceCategory.types';

export function GrievanceCategoryActions({
  onEdit,
  onDelete,
  categoryId,
  isDeleting = false,
  isEditing = false,
}: GrievanceCategoryActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1.5 md:gap-2">
      <EditButton
        onClick={() => onEdit(categoryId)}
        disabled={isDeleting || isEditing}
        isLoading={isEditing}
        className="cursor-pointer"
        data-testid={`edit-button-${categoryId}`}
      />
      <DeleteButton
        onClick={() => onDelete(categoryId)}
        disabled={isDeleting || isEditing}
        isLoading={isDeleting}
        className="cursor-pointer"
        data-testid={`delete-button-${categoryId}`}
      />
    </div>
  );
}
