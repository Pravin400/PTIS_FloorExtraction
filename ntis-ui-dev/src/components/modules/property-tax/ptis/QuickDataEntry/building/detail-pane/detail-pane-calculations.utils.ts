import { CertificateData, FloorCertificateDto } from "@/types/building-permission.types";
import type { FloorData } from "@/types/room-details.types";

export function resolveDisplayData(
    activeScope: string,
    data: CertificateData | null | undefined,
    propertyWideCert?: CertificateData | null
): CertificateData | null | undefined {
    if (activeScope === "Floor" && data && !data.enabled && propertyWideCert) {
        const hasFloorData = Boolean(
            data.number?.trim() ||
            data.date?.trim() ||
            data.documentGuid ||
            data.propertyCertificateId ||
            data.pendingFile ||
            data.fileName
        );
        if (!hasFloorData) {
            return {
                ...data,
                number: propertyWideCert.number || "",
                date: propertyWideCert.date || "",
                documentGuid: propertyWideCert.documentGuid || "",
                fileName: propertyWideCert.fileName || "",
            };
        }
    }
    return data;
}

export function findSelectedFloor(
    initialFloors: FloorData[],
    activeScope?: string,
    activeFloorId?: string | number | null
): FloorData | null {
    if (activeScope !== "Floor" || activeFloorId === null || activeFloorId === undefined) return null;
    return (
        initialFloors.find(
            (f) =>
                Number(f.id) === Number(activeFloorId) ||
                Number((f as unknown as { propertyDetailsId?: number }).propertyDetailsId) === Number(activeFloorId)
        ) || null
    );
}

export function getSelectedFloorName(selectedFloorObj: FloorData | null, activeFloorId?: string | number | null): string {
    if (!selectedFloorObj) return activeFloorId ? `Floor #${activeFloorId}` : "";
    const name = selectedFloorObj.floor || selectedFloorObj.floorDescription || "";
    const sub = selectedFloorObj.subFloor || selectedFloorObj.subFloorDescription || "";
    return `${name}${sub ? ` - ${sub}` : ""}`.trim() || `Floor #${activeFloorId}`;
}

export function calculateDateLimits(
    activeScope?: string,
    activeFloorId?: string | number | null,
    floors: FloorCertificateDto[] = []
): { minDate?: string; maxDate: string } {
    const d = new Date();
    const maxDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    let targetConstructionYear: number | null = null;
    if (activeScope === "Floor" && activeFloorId !== undefined && activeFloorId !== null) {
        const activeFloor = floors.find((f) => f.propertyDetailsId === activeFloorId);
        if (activeFloor?.constructionYear) {
            targetConstructionYear = parseInt(activeFloor.constructionYear, 10);
        }
    } else {
        if (floors.length > 0) {
            const years = floors
                .map((f) => (f.constructionYear ? parseInt(f.constructionYear, 10) : null))
                .filter((y): y is number => y !== null && !isNaN(y));
            if (years.length > 0) {
                targetConstructionYear = Math.min(...years);
            }
        }
    }
    const minDate =
        targetConstructionYear && !isNaN(targetConstructionYear) ? `${targetConstructionYear}-01-01` : undefined;

    return { minDate, maxDate };
}

export function checkIsCertificateFilled(displayData: CertificateData | null | undefined): boolean {
    if (!displayData) return false;
    const hasFile = !!(
        displayData.pendingFile ||
        (displayData.documentGuid &&
            displayData.documentGuid !== "null" &&
            displayData.documentGuid !== "undefined" &&
            displayData.documentGuid !== "pending") ||
        (displayData.documentGuid === "pending" && displayData.pendingFile) ||
        displayData.fileName
    );
    const hasNumber = !!displayData.number?.trim();
    const hasDate = !!displayData.date?.trim();
    return Boolean(hasFile && hasNumber && hasDate);
}
