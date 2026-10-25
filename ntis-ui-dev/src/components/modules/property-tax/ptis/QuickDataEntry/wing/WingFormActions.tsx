import React from 'react';
import { UpdateButton } from '@/components/common/ActionButtons';

interface WingFormActionsProps {
  t: (key: string) => string;
  isUpdating: boolean;
  hasChanges: boolean;
  canSubmit?: boolean;
}

export const WingFormActions: React.FC<WingFormActionsProps> = ({
  t,
  isUpdating,
  hasChanges = true,
}) => {
  return (
    <div className="flex justify-end space-x-2 mt-4">
      <UpdateButton
        label={isUpdating ? t('wing.saving') || 'Saving...' : t('commonbuttonmessages.UpdateChanges') || 'Update Changes'}
        type="submit"
        isLoading={isUpdating}
        disabled={isUpdating || !hasChanges}
      />
    </div>
  );
};
