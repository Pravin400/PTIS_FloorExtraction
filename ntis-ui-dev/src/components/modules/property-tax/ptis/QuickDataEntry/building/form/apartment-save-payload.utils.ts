import type { WingOption } from "@/types/building-permission.types";
import type { SaveCertificateRecordPayload } from "../permission/building-permission.types";
import type { FloorData } from "@/types/room-details.types";

interface ResolveIdsInput {
    isSociety: boolean;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    initialFloors: FloorData[];
    initialWings: WingOption[];
    wingOptions: WingOption[];
    payload: SaveCertificateRecordPayload;
    searchParams: URLSearchParams;
    propertyId: string;
}

export function resolveEffectiveSaveIds({
    isSociety,
    societyDetailId,
    wingDetailId,
    initialFloors,
    initialWings,
    wingOptions,
    payload,
    searchParams,
    propertyId,
}: ResolveIdsInput): {
    effectiveSocietyDetailId: number | null;
    effectiveWingDetailId: number | null;
    finalUnitIds: number[];
} {
    const urlSocietyDetailId = searchParams.get("societyDetailId") || searchParams.get("societyId");
    const urlWingDetailId = searchParams.get("wingDetailId") || searchParams.get("wingId");
    const floorWingDetailId =
        initialFloors.length > 0
            ? (initialFloors[0] as unknown as { wingDetailId?: number; societyWingId?: number }).wingDetailId ||
              (initialFloors[0] as unknown as { societyWingId?: number }).societyWingId
            : null;

    const wingSocId = initialWings.find(
        (w) =>
            (w as unknown as { societyDetailId?: number; societyId?: number }).societyDetailId ||
            (w as unknown as { societyDetailId?: number; societyId?: number }).societyId
    ) as unknown as { societyDetailId?: number; societyId?: number } | undefined;
    const fallbackSocDetailId = wingSocId?.societyDetailId || wingSocId?.societyId || null;

    const effectiveSocietyDetailId = isSociety
        ? societyDetailId ??
          (urlSocietyDetailId
              ? Number(urlSocietyDetailId)
              : fallbackSocDetailId
              ? Number(fallbackSocDetailId)
              : null)
        : null;

    const parsedPropId = Number(propertyId);
    const finalUnitIds =
        payload.selectedUnitIds && payload.selectedUnitIds.length > 0
            ? payload.selectedUnitIds
            : !isNaN(parsedPropId) && parsedPropId > 0
            ? [parsedPropId]
            : [];

    const firstWingOptionId =
        initialWings.length > 0
            ? initialWings[0].wingDetailId
            : wingOptions.length > 0
            ? wingOptions[0].wingDetailId
            : null;

    let effectiveWingDetailId: number | null = null;
    if (isSociety && effectiveSocietyDetailId && effectiveSocietyDetailId > 0) {
        effectiveWingDetailId =
            payload.selectedWingDetailId ??
            (wingDetailId ?? (urlWingDetailId ? Number(urlWingDetailId) : floorWingDetailId ?? firstWingOptionId));
        if (payload.level === "Unit" && finalUnitIds.length > 0) {
            const matchedFloor = initialFloors.find((f) => {
                const pId =
                    f.id ??
                    (f as unknown as { propertyDetailsId?: number }).propertyDetailsId ??
                    (f as unknown as { propertyId?: number }).propertyId;
                return pId === finalUnitIds[0];
            });
            const matchedWingId =
                (matchedFloor as unknown as { wingDetailId?: number; societyWingId?: number })?.wingDetailId ||
                (matchedFloor as unknown as { societyWingId?: number })?.societyWingId;
            if (matchedWingId) {
                effectiveWingDetailId = Number(matchedWingId);
            }
        }
    }

    return { effectiveSocietyDetailId, effectiveWingDetailId, finalUnitIds };
}

export function buildApartmentFormData(
    payload: SaveCertificateRecordPayload,
    effectiveSocietyDetailId: number,
    effectiveWingDetailId: number | null,
    finalUnitIds: number[]
): FormData {
    const hasNewFile = Boolean(payload.attachedFiles && payload.attachedFiles.length > 0);
    const isFileModified = payload.isFileModified ?? hasNewFile;
    const selectedUnitDetailsIds = (payload as unknown as { selectedUnitDetailsIds?: number[] })
        .selectedUnitDetailsIds;

    const payloadObj: Record<string, unknown> = {
        level: payload.level,
        selectedWingDetailId: effectiveWingDetailId,
        selectedUnitIds: finalUnitIds,
        selectedUnitDetailsIds:
            selectedUnitDetailsIds && selectedUnitDetailsIds.length > 0 ? selectedUnitDetailsIds : finalUnitIds,
        isAllUnitsSelected: (payload as unknown as { isAllUnitsSelected?: boolean }).isAllUnitsSelected,
        certificateTypeId: payload.certificateTypeId,
        certificateDate: payload.certificateDate,
        certificateNumber: payload.certificateNumber,
        status: payload.status,
        societyDetailId: effectiveSocietyDetailId,
        isFileModified,
        hasNewDocument: hasNewFile,
        preserveExistingDocument:
            !isFileModified && Boolean(payload.hasExistingDocument || payload.documentGuid),
    };

    if (payload.documentGuid) {
        payloadObj.documentGuid = payload.documentGuid;
        payloadObj.existingDocumentGuid = payload.documentGuid;
    }
    if (hasNewFile && payload.attachedFiles[0]) {
        payloadObj.fileName = payload.attachedFiles[0].name;
    } else if (payload.fileName) {
        payloadObj.fileName = payload.fileName;
    }
    if (payload.propertyCertificateId) {
        payloadObj.propertyCertificateId = payload.propertyCertificateId;
    }

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payloadObj));
    if (hasNewFile && payload.attachedFiles[0]) {
        formData.append("file", payload.attachedFiles[0]);
    }
    return formData;
}
