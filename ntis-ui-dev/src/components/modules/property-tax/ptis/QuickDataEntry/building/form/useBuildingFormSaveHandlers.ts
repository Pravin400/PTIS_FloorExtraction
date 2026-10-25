import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    postApartmentQcCertificateRecordAction,
    deletePropertyCertificateRecordAction,
    DeletePropertyCertificateRecordParams,
} from "@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action";
import { CertificateData, WingOption } from "@/types/building-permission.types";
import type { SaveCertificateRecordPayload } from "../permission/building-permission.types";
import type { FloorData } from "@/types/room-details.types";
import { resolveEffectiveSaveIds, buildApartmentFormData } from "./apartment-save-payload.utils";
import { useQdeSaveTracker } from "@/hooks/ptis/QuickDataEntry/useQdeSaveTracker";

interface UseBuildingFormSaveHandlersProps {
    propertyId: string;
    locale: string;
    isSociety: boolean;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    initialFloors: FloorData[];
    initialWings: WingOption[];
    wingOptions: WingOption[];
    buildingPermission: Record<number, CertificateData>;
    handleToggleEnabled: (typeId: number, enabled: boolean) => void;
    handleInputChange: (typeId: number, field: "number" | "date", value: string) => void;
    handleFileUpload: (typeId: number, file: File) => void;
    handleFileDelete: (typeId: number) => void;
    handleSave: (options?: {
        skipPropertyWideConfirmation?: boolean;
        onlyCertificateTypeId?: number;
        overrideData?: Record<string, unknown>;
    }) => Promise<unknown>;
    searchParams: URLSearchParams;
    t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useBuildingFormSaveHandlers({
    propertyId,
    locale,
    isSociety,
    societyDetailId,
    wingDetailId,
    initialFloors,
    initialWings,
    wingOptions,
    buildingPermission,
    handleToggleEnabled,
    handleInputChange,
    handleFileUpload,
    handleFileDelete,
    handleSave,
    searchParams,
    t,
}: UseBuildingFormSaveHandlersProps) {
    const router = useRouter();
    const [isSectionSaving, setIsSectionSaving] = useState(false);
    const { markChangesSaved } = useQdeSaveTracker(propertyId);

    const handleToggleWithConfirm = (typeId: number, checked: boolean) => {
        if (checked) {
            handleToggleEnabled(typeId, true);
            return;
        }

        const cert = buildingPermission[typeId];
        const hasData =
            cert &&
            ((typeof cert.propertyCertificateId === "number" && cert.propertyCertificateId > 0) ||
                (Boolean(cert.documentGuid) && cert.documentGuid !== "null" && cert.documentGuid !== "temp-guid") ||
                Boolean(cert.fileName) ||
                Boolean(cert.hasExistingData));

        if (hasData) {
            return;
        }

        handleToggleEnabled(typeId, false);
        handleInputChange(typeId, "number", "");
        handleInputChange(typeId, "date", "");
        handleFileDelete(typeId);
    };

    const handleDeleteRecord = async (params: DeletePropertyCertificateRecordParams) => {
        setIsSectionSaving(true);
        try {
            const urlSocietyDetailId = searchParams.get("societyDetailId") || searchParams.get("societyId");
            const effectiveSocietyDetailId =
                params.societyDetailId ?? societyDetailId ?? (urlSocietyDetailId ? Number(urlSocietyDetailId) : null);
            const res = await deletePropertyCertificateRecordAction(locale, propertyId, {
                ...params,
                societyDetailId: effectiveSocietyDetailId,
            });
            if (res.success) {
                markChangesSaved();
                toast.success(res.message || t("building.deleteSuccess") || "Certificate deleted successfully!");
                router.refresh();
            } else {
                toast.error(res.error || res.message || "Failed to delete certificate.");
            }
            return res;
        } finally {
            setIsSectionSaving(false);
        }
    };

    const handleSectionSave = async (payload: SaveCertificateRecordPayload) => {
        setIsSectionSaving(true);
        try {
            handleToggleEnabled(payload.certificateTypeId, true);
            if (payload.certificateDate) {
                handleInputChange(payload.certificateTypeId, "date", payload.certificateDate);
            }
            if (payload.certificateNumber) {
                handleInputChange(payload.certificateTypeId, "number", payload.certificateNumber);
            }
            if (payload.attachedFiles && payload.attachedFiles.length > 0) {
                handleFileUpload(payload.certificateTypeId, payload.attachedFiles[0]);
            }

            const { effectiveSocietyDetailId, effectiveWingDetailId, finalUnitIds } = resolveEffectiveSaveIds({
                isSociety,
                societyDetailId,
                wingDetailId,
                initialFloors,
                initialWings,
                wingOptions,
                payload,
                searchParams,
                propertyId,
            });

            const hasNewFile = Boolean(payload.attachedFiles && payload.attachedFiles.length > 0);
            const isFileModified = payload.isFileModified ?? hasNewFile;

            if (effectiveSocietyDetailId && effectiveSocietyDetailId > 0) {
                const formData = buildApartmentFormData(
                    payload,
                    effectiveSocietyDetailId,
                    effectiveWingDetailId,
                    finalUnitIds
                );
                const res = await postApartmentQcCertificateRecordAction(locale, propertyId, formData);

                if (res && res.success) {
                    markChangesSaved();
                    toast.success(
                        res.message ||
                            t("building.saveSuccess") ||
                            "Certificate saved successfully! Tax recalculation is running in the background."
                    );
                    router.refresh();
                    return res;
                } else if (res && !res.success) {
                    toast.error(res.error || res.message || "Failed to save certificate record.");
                    return res;
                }
                return res;
            } else {
                const certNo =
                    payload.certificateNumber?.trim() ||
                    buildingPermission[payload.certificateTypeId]?.number ||
                    undefined;
                const certDate =
                    payload.certificateDate || buildingPermission[payload.certificateTypeId]?.date || undefined;

                await handleSave({
                    skipPropertyWideConfirmation: true,
                    onlyCertificateTypeId: payload.certificateTypeId,
                    overrideData: {
                        date: certDate,
                        number: certNo,
                        pendingFile: hasNewFile ? payload.attachedFiles[0] : undefined,
                        propertyDetailsId: null,
                        entityType: "P",
                        societyDetailId: null,
                        wingDetailId: null,
                        documentGuid: payload.documentGuid,
                        existingDocumentGuid: payload.documentGuid,
                        propertyCertificateId: payload.propertyCertificateId,
                        isFileModified,
                    },
                });
                markChangesSaved();
            }
        } finally {
            setIsSectionSaving(false);
        }
    };

    const handleSaveStandalone = async () => {
        const urlSocietyDetailId = searchParams.get("societyDetailId") || searchParams.get("societyId");
        const urlWingDetailId = searchParams.get("wingDetailId") || searchParams.get("wingId");
        const effectiveSocietyDetailId = societyDetailId ?? (urlSocietyDetailId ? Number(urlSocietyDetailId) : null);
        const effectiveWingDetailId = urlWingDetailId ? Number(urlWingDetailId) : null;
        return await handleSave({
            overrideData: {
                societyDetailId: effectiveSocietyDetailId,
                wingDetailId: effectiveWingDetailId,
            },
        });
    };

    return {
        isSectionSaving,
        handleToggleWithConfirm,
        handleDeleteRecord,
        handleSectionSave,
        handleSaveStandalone,
    };
}
