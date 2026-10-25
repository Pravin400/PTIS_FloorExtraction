import React from 'react';
import { UpdateButton } from '@/components/common/ActionButtons';

interface KycFormActionsProps {
  t: (key: string) => string;
  isUpdating: boolean;
  hasChanges: boolean;
  canSubmit?: boolean;
}

export const KycFormActions: React.FC<KycFormActionsProps> = ({
  t,
  isUpdating,
  hasChanges,
}) => {
  return (
    <div className="flex justify-end space-x-2 mt-4">
      <UpdateButton
        label={isUpdating ? t('footer.saving') : t('commonbuttonmessages.UpdateChanges')}
        type="submit"
        isLoading={isUpdating}
        disabled={isUpdating || !hasChanges}
      />
    </div>
  );
};
