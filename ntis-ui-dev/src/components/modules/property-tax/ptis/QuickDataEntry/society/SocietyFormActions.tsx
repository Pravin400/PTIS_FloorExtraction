import { UpdateButton } from "@/components/common/ActionButtons";

interface SocietyFormActionsProps {
    t: (key: string) => string;
    isUpdating: boolean;
    hasChanges: boolean;
    canSubmit?: boolean;
}

export const SocietyFormActions = ({ t, isUpdating, hasChanges = true }: SocietyFormActionsProps) => {
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
