import { useState, useMemo } from "react";
import { CertificateData, FloorCertificateDto } from "@/types/building-permission.types";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type { FloorData } from "@/types/room-details.types";
import {
    resolveDisplayData,
    findSelectedFloor,
    getSelectedFloorName,
    calculateDateLimits,
    checkIsCertificateFilled,
} from "./detail-pane-calculations.utils";

interface UseBuildingDetailPaneStateProps {
    data: CertificateData | null | undefined;
    propertyWideCert?: CertificateData | null;
    activeScope?: string;
    activeFloorId?: string | number | null;
    initialFloors?: FloorData[];
    floors?: FloorCertificateDto[];
    displayName: string;
    onFileUpload: (file: File) => void;
    onFileDelete?: (certificateTypeId: number) => void;
    onDeleteCertificate?: () => void | Promise<unknown>;
    onSave?: () => void | Promise<unknown>;
    isSaving?: boolean;
    isDeletingCertificate?: boolean;
    isDisabled?: boolean;
    hasChanges?: boolean;
    t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useBuildingDetailPaneState({
    data,
    propertyWideCert,
    activeScope = "Property",
    activeFloorId = null,
    initialFloors = [],
    floors = [],
    displayName,
    onFileUpload,
    onFileDelete,
    onDeleteCertificate,
    onSave,
    isSaving = false,
    isDeletingCertificate = false,
    isDisabled = false,
    hasChanges = false,
    t,
}: UseBuildingDetailPaneStateProps) {
    const { confirm } = useConfirm();
    const [localIsDeleting, setLocalIsDeleting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const isDeleting = isDeletingCertificate || localIsDeleting;

    const currentContextKey = `${data?.certificateTypeId}-${activeScope}-${activeFloorId}`;
    const [prevContextKey, setPrevContextKey] = useState(currentContextKey);
    if (prevContextKey !== currentContextKey) {
        setPrevContextKey(currentContextKey);
        setActionError(null);
    }

    const displayData = useMemo(
        () => resolveDisplayData(activeScope, data, propertyWideCert),
        [activeScope, data, propertyWideCert]
    );

    const selectedFloorObj = useMemo(
        () => findSelectedFloor(initialFloors, activeScope, activeFloorId),
        [activeScope, activeFloorId, initialFloors]
    );

    const selectedFloorName = useMemo(
        () => getSelectedFloorName(selectedFloorObj, activeFloorId),
        [selectedFloorObj, activeFloorId]
    );

    const { minDate, maxDate } = useMemo(
        () => calculateDateLimits(activeScope, activeFloorId, floors),
        [activeScope, activeFloorId, floors]
    );

    const isUpdateCase = useMemo(() => {
        if (!displayData) return false;
        return typeof displayData.propertyCertificateId === "number" && displayData.propertyCertificateId > 0;
    }, [displayData]);

    const isCertificateFilled = useMemo(() => checkIsCertificateFilled(displayData), [displayData]);

    const handleFileUploadWithConfirm = (file: File) => {
        if (data && data.documentGuid) {
            confirm({
                title: t("building.confirmReplaceTitle") || "Replace Document",
                description:
                    t("building.confirmReplaceDesc") ||
                    "Are you sure you want to replace the existing document with a new one?",
                confirmText: t("building.confirmReplaceOk") || "Yes, Replace",
                cancelText: t("building.confirmReplaceCancel") || "No, Cancel",
                variant: "warning",
                onConfirm: () => onFileUpload(file),
            });
        } else {
            onFileUpload(file);
        }
    };

    const handleFileDeleteWithConfirm = () => {
        if (onFileDelete && data) {
            confirm({
                title: t("building.confirmDeleteTitle") || "Delete Document",
                description:
                    t("building.confirmDeleteDesc") ||
                    "Are you sure you want to delete the attached document? This action cannot be undone.",
                confirmText: t("building.confirmDeleteOk") || "Yes, Delete",
                cancelText: t("building.confirmDeleteCancel") || "No, Cancel",
                variant: "delete",
                onConfirm: () => onFileDelete(data.certificateTypeId),
            });
        }
    };

    const handleDeleteCertificateWithConfirm = () => {
        if (onDeleteCertificate && displayData) {
            const hasNum = !!displayData.number?.trim();
            const hasDt = !!displayData.date?.trim();
            const detailsList: string[] = [];
            if (hasNum) detailsList.push(`${t("building.number") || "Number"}: ${displayData.number}`);
            if (hasDt) detailsList.push(`${t("building.date") || "Date"}: ${displayData.date}`);

            confirm({
                title: t("building.confirmDeleteCertificateTitle") || "Delete Certificate & Data",
                description: `${t("building.confirmToggleOffWarning") || "You have an attached certificate with details:"}\n${displayName}${
                    detailsList.length > 0 ? ` (${detailsList.join(", ")})` : ""
                }\n\n${t("building.confirmDeleteCertificateDesc") || "Are you sure you want to delete this certificate and all its associated data?"}`,
                confirmText: t("building.confirmDeleteCertificateOk") || "Yes, Delete",
                cancelText: t("building.confirmDeleteCertificateCancel") || "No, Cancel",
                variant: "delete",
                onConfirm: async () => {
                    setLocalIsDeleting(true);
                    setActionError(null);
                    try {
                        const res = await onDeleteCertificate();
                        if (res && typeof res === "object" && (res as { success?: boolean }).success === false) {
                            const errorMsg =
                                (res as { message?: string; error?: string }).error ||
                                (res as { message?: string; error?: string }).message ||
                                t("building.deleteError") ||
                                "Failed to delete certificate";
                            setActionError(errorMsg);
                        }
                    } catch (err: unknown) {
                        const errorMsg =
                            err instanceof Error ? err.message : t("building.deleteError") || "Failed to delete certificate";
                        setActionError(errorMsg);
                    } finally {
                        setLocalIsDeleting(false);
                    }
                },
            });
        }
    };

    const handleSaveClick = async () => {
        if (!onSave || isSaving || isDeleting || isDisabled || !hasChanges || !isCertificateFilled) return;
        setActionError(null);
        try {
            const res = await onSave();
            if (res && typeof res === "object") {
                const saveResult = res as { success?: boolean; isValid?: boolean; message?: string; error?: string };
                if (saveResult.isValid === false) {
                    setActionError(null);
                    return;
                }
                if (saveResult.success === false) {
                    const errorMsg = saveResult.error || saveResult.message || t("building.saveError") || "Failed to save changes";
                    setActionError(errorMsg);
                }
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : t("building.saveError") || "Failed to save changes";
            setActionError(errorMsg);
        }
    };

    return {
        displayData, selectedFloorName, maxDate, minDate,
        isUpdateCase, isCertificateFilled, isDeleting,
        actionError, setActionError,
        handleFileUploadWithConfirm, handleFileDeleteWithConfirm,
        handleDeleteCertificateWithConfirm, handleSaveClick,
    };
}
