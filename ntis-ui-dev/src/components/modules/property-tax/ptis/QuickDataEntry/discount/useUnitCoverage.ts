import { useMemo, useCallback } from "react";
import type { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import type { PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import { getItemLevel, LEVEL_NAMES } from "@/lib/utils/ptis/social-details";
import type { CoverageStatus } from "./unit-selection.types";

interface UseUnitCoverageParams {
    levelState: NonNullable<ReturnType<typeof useDiscountLevelState>>;
    savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
    activeSelectedId?: number | null;
}

export function useUnitCoverage({
    levelState,
    savedPropertyDetails = [],
    activeSelectedId,
}: UseUnitCoverageParams) {
    const uploadedUnitsMap = useMemo(() => {
        const map = new Map<number, PropertySocialDetailsDto | SocialAttributeHierarchyDto>();
        if (savedPropertyDetails && activeSelectedId) {
            savedPropertyDetails.forEach((item) => {
                const attrId = 'socialAttributeId' in item && item.socialAttributeId != null
                    ? Number(item.socialAttributeId)
                    : Number(item.id);
                const rawPropId = 'propertyId' in item ? item.propertyId : undefined;
                const propId = rawPropId != null ? Number(rawPropId) : undefined;
                if (attrId === activeSelectedId && propId && !isNaN(propId) && (item.documentGuid || item.documentBindingId)) {
                    map.set(propId, item);
                }
            });
        }
        return map;
    }, [savedPropertyDetails, activeSelectedId]);

    const wingDocumentMap = useMemo(() => {
        const map = new Map<number, PropertySocialDetailsDto | SocialAttributeHierarchyDto>();
        if (!savedPropertyDetails || !activeSelectedId) return map;
        savedPropertyDetails.forEach((item) => {
            const attrId = 'socialAttributeId' in item && item.socialAttributeId != null
                ? Number(item.socialAttributeId)
                : Number(item.id);
            if (attrId !== activeSelectedId) return;
            const level = getItemLevel(item);
            const wId = 'wingDetailId' in item && item.wingDetailId != null ? Number(item.wingDetailId) : undefined;
            if (level === LEVEL_NAMES.WING && wId && wId > 0 && (item.documentGuid || item.documentBindingId)) {
                map.set(wId, item);
            }
        });
        return map;
    }, [savedPropertyDetails, activeSelectedId]);

    const apartmentDocumentItem = useMemo<PropertySocialDetailsDto | SocialAttributeHierarchyDto | null>(() => {
        if (!savedPropertyDetails || !activeSelectedId) return null;
        return savedPropertyDetails.find((item) => {
            const attrId = 'socialAttributeId' in item && item.socialAttributeId != null
                ? Number(item.socialAttributeId)
                : Number(item.id);
            if (attrId !== activeSelectedId) return false;
            const level = getItemLevel(item);
            return level === LEVEL_NAMES.APARTMENT && !!(item.documentGuid || item.documentBindingId);
        }) || null;
    }, [savedPropertyDetails, activeSelectedId]);

    const unitCoverageMap = useMemo(() => {
        const map = new Map<number, CoverageStatus>();
        if (!activeSelectedId) return map;

        const unitDirectSet = new Set<number>();
        savedPropertyDetails.forEach((d) => {
            const attrId = 'socialAttributeId' in d && d.socialAttributeId != null ? Number(d.socialAttributeId) : Number(d.id);
            if (attrId !== activeSelectedId) return;
            const level = getItemLevel(d);
            const pId = 'propertyId' in d && d.propertyId != null ? Number(d.propertyId) : undefined;
            const bitValue = 'bitValue' in d ? d.bitValue : true;
            if (pId != null && pId > 0 && (level === LEVEL_NAMES.UNIT || String(d.entityType).toUpperCase() === 'P') && bitValue !== false) {
                unitDirectSet.add(pId);
            }
        });

        const wingCoverageSet = new Set<number>();
        savedPropertyDetails.forEach((d) => {
            const attrId = 'socialAttributeId' in d && d.socialAttributeId != null ? Number(d.socialAttributeId) : Number(d.id);
            if (attrId !== activeSelectedId) return;
            const level = getItemLevel(d);
            const wId = 'wingDetailId' in d && d.wingDetailId != null ? Number(d.wingDetailId) : undefined;
            const pId = 'propertyId' in d && d.propertyId != null ? Number(d.propertyId) : undefined;
            const bitValue = 'bitValue' in d ? d.bitValue : true;
            if (level === LEVEL_NAMES.WING && (!pId || pId === 0) && wId && bitValue !== false) {
                wingCoverageSet.add(wId);
            }
        });

        const hasApartmentCoverage = savedPropertyDetails.some((d) => {
            const attrId = 'socialAttributeId' in d && d.socialAttributeId != null ? Number(d.socialAttributeId) : Number(d.id);
            if (attrId !== activeSelectedId) return false;
            const level = getItemLevel(d);
            const wId = 'wingDetailId' in d && d.wingDetailId != null ? Number(d.wingDetailId) : undefined;
            const pId = 'propertyId' in d && d.propertyId != null ? Number(d.propertyId) : undefined;
            const bitValue = 'bitValue' in d ? d.bitValue : true;
            return level === LEVEL_NAMES.APARTMENT && (!wId || wId === 0) && (!pId || pId === 0) && bitValue !== false;
        });

        levelState.filteredUnits.forEach((u) => {
            const pId = u.propertyId != null ? Number(u.propertyId) : undefined;
            const pdId = u.propertyDetailsId != null ? Number(u.propertyDetailsId) : undefined;
            const isDirect = (pId != null && (unitDirectSet.has(pId) || uploadedUnitsMap.has(pId))) ||
                             (pdId != null && (unitDirectSet.has(pdId) || uploadedUnitsMap.has(pdId)));
            const wId = u.wingDetailId != null ? Number(u.wingDetailId) : undefined;
            const primaryId = (pId ?? pdId) as number;

            if (isDirect) {
                map.set(primaryId, "direct");
                if (pId != null) map.set(pId, "direct");
                if (pdId != null) map.set(pdId, "direct");
            } else if (wId && wingCoverageSet.has(wId)) {
                map.set(primaryId, "wing");
                if (pId != null) map.set(pId, "wing");
                if (pdId != null) map.set(pdId, "wing");
            } else if (hasApartmentCoverage) {
                map.set(primaryId, "apartment");
                if (pId != null) map.set(pId, "apartment");
                if (pdId != null) map.set(pdId, "apartment");
            } else {
                map.set(primaryId, "none");
                if (pId != null) map.set(pId, "none");
                if (pdId != null) map.set(pdId, "none");
            }
        });

        return map;
    }, [savedPropertyDetails, activeSelectedId, levelState.filteredUnits, uploadedUnitsMap]);

    const isUnitApplied = useCallback((unitPropId: number): boolean => {
        const num = Number(unitPropId);
        return unitCoverageMap.get(num) === "direct" || uploadedUnitsMap.has(num);
    }, [unitCoverageMap, uploadedUnitsMap]);

    const appliedUnitsCount = useMemo(() => {
        let count = 0;
        levelState.filteredUnits.forEach((u) => {
            const unitPropId = (u.propertyId ?? u.propertyDetailsId) as number;
            if (isUnitApplied(unitPropId)) count++;
        });
        return count;
    }, [levelState.filteredUnits, isUnitApplied]);

    const selectableUnits = useMemo(() => {
        return levelState.filteredUnits.filter((u) => {
            const unitPropId = (u.propertyId ?? u.propertyDetailsId) as number;
            return !isUnitApplied(unitPropId);
        });
    }, [levelState.filteredUnits, isUnitApplied]);

    const appliedUnits = useMemo(() => {
        return levelState.filteredUnits.filter((u) => {
            const unitPropId = (u.propertyId ?? u.propertyDetailsId) as number;
            return isUnitApplied(unitPropId);
        });
    }, [levelState.filteredUnits, isUnitApplied]);

    return {
        uploadedUnitsMap,
        wingDocumentMap,
        apartmentDocumentItem,
        unitCoverageMap,
        isUnitApplied,
        appliedUnitsCount,
        selectableUnits,
        appliedUnits,
    };
}
