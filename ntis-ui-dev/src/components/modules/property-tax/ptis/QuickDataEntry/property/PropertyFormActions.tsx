import { UpdateButton } from '@/components/common/ActionButtons';

interface PropertyFormActionsProps {
    t: (key: string) => string;
    isUpdating: boolean;
    hasChanges: boolean;
}

export const PropertyFormActions = ({
    t,
    isUpdating,
    hasChanges,
}: PropertyFormActionsProps) => {
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
