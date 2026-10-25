"use client"

import { ClearButton } from "@/components/common";
import { UpdateButton, AddButton } from "@/components/common/ActionButtons";
import { FloorFormActionsProps } from "@/types/OldDetails/property-old-floor-info.types";

/**
 * FloorFormActions Component
 * Renders action buttons (Add/Update/Reset) for floor information form
 * Button state changes based on edit mode and form state
 */
export function FloorFormActions({
    t,
    isEditMode,
    isSubmitting,
    isChanged,
    onSave,
    onReset
}: FloorFormActionsProps) {
    return (
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 w-full">
            {!isEditMode ? (
                <AddButton
                    label={t('oldDetails.button.add')}
                    onClick={onSave}
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className="h-10 w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all duration-200 flex flex-row items-center justify-center gap-2 active:scale-[0.98]"
                />

            ) : (
                <>
                    <UpdateButton
                        label={isSubmitting ? t('footer.saving') : t('commonbuttonmessages.UpdateChanges')}
                        onClick={onSave}
                        type="submit"
                        isLoading={isSubmitting}
                        disabled={isSubmitting || !isChanged}
                        className="h-10 w-full sm:flex-1 shadow-lg shadow-blue-200 transition-all duration-200"
                    />

                    <ClearButton
                        label={t('commonbuttonmessages.clear')}
                        onClick={onReset}
                        className="h-10 w-full sm:flex-1 border border-blue-100 text-blue-600 hover:bg-blue-50 text-sm font-bold transition-all duration-200 flex flex-row items-center justify-center gap-2 active:scale-[0.98]"
                    />
                </>
            )}
        </div>
    );
}
