import { useCallback } from "react";
import { toast } from "sonner";
import { BuildingPermissionState } from "@/types/building-permission.types";

export const useBuildingFileUpload = (
    buildingPermission: BuildingPermissionState,
    setBuildingPermission: React.Dispatch<React.SetStateAction<BuildingPermissionState>>,
    clearError: (id: number) => void,
    t: (key: string, values?: Record<string, string | number>) => string
) => {
    const handleFileUpload = useCallback(async (certificateTypeId: number, file: File) => {
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
        if (file.size > MAX_FILE_SIZE || !ALLOWED_TYPES.includes(file.type)) {
            toast.error(t("building.uploadInvalidFile") || "Invalid file");
            return;
        }

        const certificate = buildingPermission[certificateTypeId];
        if (!certificate) {
            toast.error(t("building.errors.notFound") || "Certificate not found.");
            return;
        }

        setBuildingPermission((prev) => ({
            ...prev,
            [certificateTypeId]: {
                ...prev[certificateTypeId],
                enabled: true,
                pendingFile: file,
                documentGuid: "pending",
                fileName: file.name,
                isUploading: false
            },
        }));
        clearError(certificateTypeId);
    }, [buildingPermission, clearError, setBuildingPermission, t]);

    const handleFileDelete = useCallback((certificateTypeId: number, options?: { silent?: boolean }) => {
        const certificate = buildingPermission[certificateTypeId];
        if (!certificate) return;

        setBuildingPermission((prev) => ({
            ...prev,
            [certificateTypeId]: {
                ...prev[certificateTypeId],
                pendingFile: undefined,
                documentGuid: undefined,
                fileName: undefined,
                isUploading: false,
                isDeleting: false
            }
        }));
        clearError(certificateTypeId);
        if (!options?.silent) {
            toast.success(t("building.fileRemoved") || "File removed from form. Click Save Changes to apply.");
        }
    }, [buildingPermission, clearError, setBuildingPermission, t]);

    return { handleFileUpload, handleFileDelete };
};
