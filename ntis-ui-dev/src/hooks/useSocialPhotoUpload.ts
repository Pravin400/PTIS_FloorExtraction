import { useCallback } from "react";
import { toast } from "sonner";
import { FlatSocialAttributeState } from "@/lib/utils/social-details";

export const useSocialPhotoUpload = (
    socialData: Record<number, FlatSocialAttributeState>,
    setFormState: React.Dispatch<React.SetStateAction<{
        data: Record<number, FlatSocialAttributeState>;
        errors: Record<number, string>;
    }>>,
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    }
) => {
    const handlePhotoUpload = useCallback((socialAttributeId: number, file: File) => {
        if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
            toast.error(t("discount.uploadInvalidPhoto") || "Invalid file type or size. Only PNG and JPG under 5MB are allowed.");
            return;
        }

        const item = socialData[socialAttributeId];
        if (!item) return;

        setFormState(prev => {
            const nextData = { ...prev.data };
            if (nextData[socialAttributeId]) {
                const currentItem = nextData[socialAttributeId];
                const isOverridden = currentItem.isInherited ? true : currentItem.isOverridden;
                nextData[socialAttributeId] = {
                    ...currentItem,
                    pendingFile: file,
                    fileName: file.name,
                    documentGuid: "pending",
                    photoGuid: "pending",
                    documentUrl: undefined,
                    isOverridden,
                };

                const findAndEnableRoot = (item: FlatSocialAttributeState) => {
                    if (item.parentAttributeId && nextData[item.parentAttributeId]) {
                        const parent = nextData[item.parentAttributeId]!;
                        if (parent.bitValue !== true) {
                            nextData[parent.socialAttributeId] = {
                                ...parent,
                                bitValue: true,
                                isOverridden: parent.isInherited ? true : parent.isOverridden
                            };
                        }
                        findAndEnableRoot(parent);
                    } else if (!item.parentAttributeId && (item.dataType || '').toUpperCase() === 'BIT') {
                        if (item.bitValue !== true) {
                            nextData[item.socialAttributeId] = {
                                ...item,
                                bitValue: true,
                                isOverridden: item.isInherited ? true : item.isOverridden
                            };
                        }
                    }
                };
                findAndEnableRoot(nextData[socialAttributeId]);
            }
            const nextErrors = { ...prev.errors };
            delete nextErrors[socialAttributeId];
            return { ...prev, data: nextData, errors: nextErrors };
        });
    }, [socialData, t, setFormState]);

    const handlePhotoDelete = useCallback((socialAttributeId: number) => {
        const item = socialData[socialAttributeId];
        if (!item) return;
        const isOverridden = item.isInherited ? true : item.isOverridden;

        setFormState(prev => {
            const nextData = { ...prev.data };
            if (nextData[socialAttributeId]) {
                nextData[socialAttributeId] = {
                    ...nextData[socialAttributeId],
                    pendingFile: undefined,
                    documentGuid: null,
                    documentBindingId: null,
                    documentUrl: null,
                    photoBindingId: null,
                    photoGuid: null,
                    fileName: undefined,
                    isUploading: false,
                    isDeleting: false,
                    isOverridden,
                };
            }
            const nextErrors = { ...prev.errors };
            delete nextErrors[socialAttributeId];
            return { data: nextData, errors: nextErrors };
        });
        toast.success(t("discount.fileRemoved") || "File removed from form. Click Save Changes to apply.");
    }, [socialData, t, setFormState]);

    return { handlePhotoUpload, handlePhotoDelete };
};
