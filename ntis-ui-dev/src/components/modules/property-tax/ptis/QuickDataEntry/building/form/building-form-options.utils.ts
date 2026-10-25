import type {
    WingOption,
    UnitSelectionItem,
    ApplicationLevel,
    CertificateTypeMasterOption,
} from "@/types/building-permission.types";
import type { FloorData } from "@/types/room-details.types";

export function buildWingOptions(initialFloors: FloorData[] = []): WingOption[] {
    const map = new Map<string, WingOption>();
    initialFloors.forEach((f, idx) => {
        const rawItem = f as unknown as Record<string, unknown>;
        const rawWing =
            rawItem.societyWingName ||
            rawItem.wingName ||
            rawItem.wingDescription ||
            rawItem.wing ||
            rawItem.societyWing ||
            rawItem.wingNo ||
            rawItem.blockName;
        if (typeof rawWing === "string" && rawWing.trim().length > 0) {
            const wingName = rawWing.trim();
            const wingDetailId = Number(
                rawItem.wingDetailId ||
                rawItem.societyWingId ||
                rawItem.wingId ||
                rawItem.wingMasterId ||
                idx + 1
            );
            if (!map.has(wingName)) {
                map.set(wingName, {
                    wingDetailId,
                    wingName,
                });
            }
        }
    });
    return Array.from(map.values());
}

export function buildUnitOptions(initialFloors: FloorData[] = []): UnitSelectionItem[] {
    return initialFloors.map((f, idx) => {
        const rawPropId = Number(f.propertyId || (f as unknown as { PropertyId?: number }).PropertyId || 0);
        const rawDetailsId = Number(
            f.id ||
            f.propertyDetailsId ||
            (f as unknown as { PropertyDetailsId?: number }).PropertyDetailsId ||
            0
        );
        const resolvedId = rawDetailsId > 0 ? rawDetailsId : rawPropId > 0 ? rawPropId : idx + 1;
        const resolvedPropId = rawPropId > 0 ? rawPropId : resolvedId;
        const rawWing = f.wing || (f as unknown as { wingName?: string }).wingName;
        const wingName = typeof rawWing === "string" ? rawWing : "A Wing";
        const wingDetailId = f.wingDetailId || 1;
        const floorName = typeof f.floor === "string" ? f.floor : String(f.floorDescription || "1st Floor");
        const useName = typeof f.use === "string" ? f.use : "Residential";
        const unitNo = f.flatNo || f.flatNumber || f.unitNo || `Unit ${resolvedId}`;
        return {
            propertyDetailsId: resolvedId,
            propertyId: resolvedPropId,
            unitNo: String(unitNo),
            wingDetailId: Number(wingDetailId),
            wingName,
            floorName: String(floorName),
            useName: String(useName),
            isSelected: false,
            constructionYear: (f as unknown as { constructionYear?: string | number }).constructionYear,
        };
    });
}

export function resolveEffectiveCertTypeId(
    urlCertTypeId: string | null,
    urlCertTypeCode: string | null,
    initialCertificateTypes: CertificateTypeMasterOption[],
    activeSelectedTypeId: number | null
): number {
    if (urlCertTypeId && !isNaN(Number(urlCertTypeId))) {
        return Number(urlCertTypeId);
    }
    if (urlCertTypeCode) {
        const matched = initialCertificateTypes.find(
            (ct) => ct.certificateTypeCode?.toLowerCase() === urlCertTypeCode.toLowerCase()
        );
        if (matched?.certificateTypeId) {
            return matched.certificateTypeId;
        }
    }
    return activeSelectedTypeId || 3;
}

export function resolveEffectiveLevel(
    urlLevel: ApplicationLevel | null,
    hasUnitParam: boolean,
    activeScope: string
): ApplicationLevel {
    if (urlLevel === "Apartment" || urlLevel === "Wing" || urlLevel === "Unit") {
        return urlLevel;
    }
    if (hasUnitParam || activeScope === "Floor") {
        return "Unit";
    }
    return "Apartment";
}
