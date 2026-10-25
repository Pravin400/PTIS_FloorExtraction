import { useMemo, useCallback } from "react";
import {
    PropertySocialInfoResponseDto,
    SocialAttributeHierarchyDto,
} from "@/types/property-social-details.types";
import { SocialAttribute } from "@/types/social-attribute.types";
import { getLocalizedName, FlatSocialAttributeState, isAttributeEnabled } from "@/lib/utils/social-details";

interface UseSocialHierarchyParams {
    socialMasterAttributes: SocialAttribute[];
    initialSocialData: PropertySocialInfoResponseDto | null;
    socialData: Record<number, FlatSocialAttributeState>;
    selectedId: number | null;
    searchTerm: string;
    showActiveFirst: boolean;
    incompleteAttributes: { id: number; name: string }[];
    isUnitLevel?: boolean;
    t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const useSocialHierarchy = ({
    socialMasterAttributes,
    initialSocialData,
    socialData,
    selectedId,
    searchTerm,
    showActiveFirst,
    incompleteAttributes,
    isUnitLevel = false,
    t,
}: UseSocialHierarchyParams) => {
    const buildHierarchyFromMaster = useCallback((rootId: number) => {
        const flatSourceRaw = socialMasterAttributes.length > 0
            ? socialMasterAttributes
            : (initialSocialData?.socialAttributes || []).flatMap((attr) => [attr]);
        const flatSource = isUnitLevel
            ? flatSourceRaw.filter((attr) => !attr.isCommonAreaAttribute)
            : flatSourceRaw;

        const buildNode = (attributeId: number): SocialAttributeHierarchyDto | null => {
            const flatAttr = flatSource.find((attr) => attr.id === attributeId);
            if (!flatAttr) return null;
            const state = socialData[attributeId];

            const children = flatSource
                .filter((attr) => attr.parentAttributeId === attributeId)
                .map((child) => buildNode(child.id))
                .filter((child): child is SocialAttributeHierarchyDto => child !== null);

            return {
                id: flatAttr.id,
                socialAttributeCode: flatAttr.socialAttributeCode,
                socialAttributeName: flatAttr.socialAttributeName,
                dataType: flatAttr.dataType,
                unit: flatAttr.unit,
                displayOrder: flatAttr.displayOrder,
                parentAttributeId: flatAttr.parentAttributeId,
                isRequiredWhenParentTrue: flatAttr.isRequiredWhenParentTrue,
                isDiscountApplicable: flatAttr.isDiscountApplicable,
                propertySocialDetailId: state?.id ?? undefined,
                bitValue: state?.bitValue ?? (flatAttr.dataType.toUpperCase() === "BIT" ? false : null),
                intValue: (state?.intValue as number | null) ?? null,
                decimalValue: (state?.decimalValue as number | null) ?? null,
                textValue: state?.textValue ?? null,
                dateValue: state?.dateValue ?? null,
                documentBindingId: state?.documentBindingId ?? null,
                remark: state?.remark ?? null,
                photoTypeId: undefined,
                isPhotoRequired: flatAttr.isPhotoRequired,
                isDocumentRequired: flatAttr.isDocumentRequired,
                isActive: flatAttr.isActive,
                documentGuid: state?.documentGuid ?? null,
                photoBindingId: state?.photoBindingId ?? null,
                photoGuid: state?.photoGuid ?? null,
                children,
            };
        };

        return buildNode(rootId);
    }, [initialSocialData?.socialAttributes, socialData, socialMasterAttributes, isUnitLevel]);

    const rootAttributes = useMemo(() => {
        const rawSource = socialMasterAttributes.length > 0
            ? socialMasterAttributes.filter(attr => attr.isActive !== false)
            : (initialSocialData?.socialAttributes || []).filter(attr => attr.isActive !== false);

        const sourceData = isUnitLevel
            ? rawSource.filter(attr => !attr.isCommonAreaAttribute)
            : rawSource;

        return sourceData
            .map((attr) => socialData[attr.id])
            .filter(attr => Boolean(attr && !attr.parentAttributeId && (!isUnitLevel || !attr.isCommonAreaAttribute)));
    }, [initialSocialData, socialMasterAttributes, socialData, isUnitLevel]);

    const filteredAttributes = useMemo(() => {
        let list = [...rootAttributes];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter((attr) => {
                const displayName = getLocalizedName(attr.socialAttributeCode, attr.socialAttributeName, t);
                return displayName.toLowerCase().includes(term);
            });
        }
        if (showActiveFirst) {
            list = [...list].sort((a, b) => {
                const aActive = a.bitValue === true ? 1 : 0;
                const bActive = b.bitValue === true ? 1 : 0;
                if (bActive !== aActive) {
                    return bActive - aActive;
                }
                return 0;
            });
        }
        return list;
    }, [rootAttributes, searchTerm, showActiveFirst, t]);

    const activeSelectedId = useMemo(() => {
        if (selectedId !== null) {
            const findRoot = (id: number): number => {
                const item = socialData[id] || socialMasterAttributes.find(a => a.id === id);
                if (item?.parentAttributeId) {
                    return findRoot(item.parentAttributeId);
                }
                return id;
            };
            const rootId = findRoot(selectedId);
            const exists = filteredAttributes.some(d => d.socialAttributeId === rootId);
            if (exists) return rootId;
            if (!isUnitLevel) {
                if (socialData[rootId]) return rootId;
                if (socialData[selectedId]) return selectedId;
            }
        }
        return filteredAttributes.length > 0 ? filteredAttributes[0].socialAttributeId : null;
    }, [filteredAttributes, selectedId, socialData, socialMasterAttributes, isUnitLevel]);

    const selectedHierarchy = useMemo(() => {
        if (activeSelectedId === null) return null;
        const masterHierarchy = buildHierarchyFromMaster(activeSelectedId);
        if (masterHierarchy) return masterHierarchy;
        return initialSocialData?.socialAttributes?.find(attr => attr.id === activeSelectedId) || null;
    }, [activeSelectedId, buildHierarchyFromMaster, initialSocialData?.socialAttributes]);

    const activeIncompleteAttributes = useMemo(() => {
        return incompleteAttributes.filter(d => {
            const item = socialData[d.id];
            return item ? isAttributeEnabled(item, socialData) : false;
        });
    }, [incompleteAttributes, socialData]);

    return {
        filteredAttributes,
        activeSelectedId,
        selectedHierarchy,
        activeIncompleteAttributes,
    };
};
