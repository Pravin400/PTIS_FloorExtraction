import { getItemLevel, LEVEL_NAMES } from "@/lib/utils/ptis/social-details";
import { PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";

export interface DeleteAccessInfo {
    canDelete: boolean;
    isDeleteButtonVisible: boolean;
    deleteTooltip?: string;
    documentDeleteTooltip?: string;
    isActualOverride: boolean;
}

export interface CalculateDeleteAccessParams {
    attributeId: number;
    level?: 'Apartment' | 'Wing' | 'Unit';
    isSociety?: boolean;
    isInherited?: boolean;
    inheritedFrom?: string | null;
    isOverridden?: boolean;
    savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
    directRecordId?: number | null;
    editingUnitId?: number | null;
    wingDetailId?: number | null;
    isItemFilled?: boolean;
    itemType?: 'discount' | 'social';
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

/**
 * Calculates delete access and tooltips across Apartment, Wing, and Unit levels.
 * Enforces hierarchical delete access:
 * 1. Apartment level: Only deletes apartment-level records.
 * 2. Wing level: Only deletes wing-level records. If inherited from Apartment, disabled with tooltip.
 * 3. Unit level: Only deletes direct-applied unit records. If inherited from Apartment or Wing, disabled with tooltip.
 */
export function calculateDiscountDeleteAccess(params: CalculateDeleteAccessParams): DeleteAccessInfo {
    const {
        attributeId,
        level,
        isSociety = true,
        isInherited = false,
        inheritedFrom,
        isOverridden = false,
        savedPropertyDetails = [],
        directRecordId,
        editingUnitId,
        wingDetailId,
        isItemFilled = false,
        itemType = 'discount',
        t,
    } = params;

    if (!isSociety) {
        const hasSavedDirectRecord = (typeof directRecordId === 'number' && directRecordId > 0) ||
            savedPropertyDetails.some((p) => {
                const attrId = 'socialAttributeId' in p && p.socialAttributeId != null ? Number(p.socialAttributeId) : Number(p.id);
                return attrId === attributeId && p.isActive !== false;
            });

        const isDeleteButtonVisible = Boolean(isItemFilled || hasSavedDirectRecord);
        const canDelete = hasSavedDirectRecord;
        const notSavedKey = itemType === 'social' ? 'discount.deleteDisabledNotSavedIndividualSocial' : 'discount.deleteDisabledNotSavedIndividual';
        const notSavedFallback = itemType === 'social' ? 'This detail has not been saved yet.' : 'This discount has not been saved yet.';

        return {
            canDelete,
            isDeleteButtonVisible,
            deleteTooltip: !canDelete && isItemFilled ? (t(notSavedKey) || notSavedFallback) : undefined,
            documentDeleteTooltip: !canDelete ? (t(notSavedKey) || notSavedFallback) : undefined,
            isActualOverride: false,
        };
    }

    // Check if there is a saved direct record at current level in DB
    let hasSavedDirectRecord = false;
    if (level === 'Wing') {
        const currentWingId = wingDetailId && Number(wingDetailId) > 0 ? Number(wingDetailId) : undefined;
        hasSavedDirectRecord = savedPropertyDetails.some((p) => {
            const attrId = 'socialAttributeId' in p && p.socialAttributeId != null ? Number(p.socialAttributeId) : Number(p.id);
            if (attrId !== attributeId || p.isActive === false) return false;
            const lvl = getItemLevel(p);
            const itemWingId = 'wingDetailId' in p && p.wingDetailId != null ? Number(p.wingDetailId) : undefined;
            return lvl === LEVEL_NAMES.WING && (currentWingId ? itemWingId === currentWingId : true);
        });
    } else if (level === 'Unit') {
        const targetUnitId = editingUnitId && Number(editingUnitId) > 0 ? Number(editingUnitId) : undefined;
        if (typeof directRecordId === 'number' && directRecordId > 0) {
            hasSavedDirectRecord = true;
        } else if (targetUnitId) {
            hasSavedDirectRecord = savedPropertyDetails.some((p) => {
                const attrId = 'socialAttributeId' in p && p.socialAttributeId != null ? Number(p.socialAttributeId) : Number(p.id);
                if (attrId !== attributeId || p.isActive === false) return false;
                const pId = 'propertyId' in p && p.propertyId != null ? Number(p.propertyId) : undefined;
                const lvl = getItemLevel(p);
                return lvl === LEVEL_NAMES.UNIT && pId === targetUnitId;
            });
        }
    } else {
        // Apartment level
        hasSavedDirectRecord = (typeof directRecordId === 'number' && directRecordId > 0) ||
            savedPropertyDetails.some((p) => {
                const attrId = 'socialAttributeId' in p && p.socialAttributeId != null ? Number(p.socialAttributeId) : Number(p.id);
                if (attrId !== attributeId || p.isActive === false) return false;
                return getItemLevel(p) === LEVEL_NAMES.APARTMENT;
            });
    }

    const isActualOverride = Boolean(isOverridden && hasSavedDirectRecord);
    const isDeleteButtonVisible = Boolean(isItemFilled || hasSavedDirectRecord || isInherited);

    if (!level || level === 'Apartment') {
        const canDelete = !isInherited && hasSavedDirectRecord;
        const notSavedKey = itemType === 'social' ? 'discount.deleteDisabledNotSavedSocial' : 'discount.deleteDisabledNotSaved';
        const notSavedFallback = itemType === 'social' ? 'This detail has not been saved yet.' : 'This discount has not been saved yet.';
        return {
            canDelete,
            isDeleteButtonVisible,
            deleteTooltip: !canDelete && isItemFilled ? (t(notSavedKey) || notSavedFallback) : undefined,
            documentDeleteTooltip: !canDelete ? (t(notSavedKey) || notSavedFallback) : undefined,
            isActualOverride: false,
        };
    }

    if (level === 'Wing') {
        if (hasSavedDirectRecord) {
            return {
                canDelete: true,
                isDeleteButtonVisible,
                isActualOverride,
            };
        }
        // Inherited from Apartment level
        const tooltipKey = itemType === 'social'
            ? 'discount.deleteDisabledInheritedApartmentSocial'
            : 'discount.deleteDisabledInheritedApartment';
        const fallback = itemType === 'social'
            ? 'This detail is inherited from Apartment level. It can only be deleted from Apartment level.'
            : 'This discount is inherited from Apartment level. It can only be deleted from Apartment level.';
        const docTooltip = t('discount.deleteDocumentDisabledInheritedApartment') || 'This document is inherited from Apartment level. It can only be deleted from Apartment level.';
        return {
            canDelete: false,
            isDeleteButtonVisible,
            deleteTooltip: t(tooltipKey) || fallback,
            documentDeleteTooltip: docTooltip,
            isActualOverride: false,
        };
    }

    // Unit level
    if (hasSavedDirectRecord) {
        return {
            canDelete: true,
            isDeleteButtonVisible,
            isActualOverride,
        };
    }

    // Inherited from Wing or Apartment
    const origin = (inheritedFrom || '').toUpperCase();
    if (origin === 'WING') {
        const tooltipKey = itemType === 'social'
            ? 'discount.deleteDisabledInheritedWingSocial'
            : 'discount.deleteDisabledInheritedWing';
        const fallback = itemType === 'social'
            ? 'This detail is inherited from Wing level. It can only be deleted from Wing level.'
            : 'This discount is inherited from Wing level. It can only be deleted from Wing level.';
        const docTooltip = t('discount.deleteDocumentDisabledInheritedWing') || 'This document is inherited from Wing level. It can only be deleted from Wing level.';
        return {
            canDelete: false,
            isDeleteButtonVisible,
            deleteTooltip: t(tooltipKey) || fallback,
            documentDeleteTooltip: docTooltip,
            isActualOverride: false,
        };
    }

    if (origin === 'APARTMENT' || origin === 'SOCIETY') {
        const tooltipKey = itemType === 'social'
            ? 'discount.deleteDisabledInheritedApartmentSocial'
            : 'discount.deleteDisabledInheritedApartment';
        const fallback = itemType === 'social'
            ? 'This detail is inherited from Apartment level. It can only be deleted from Apartment level.'
            : 'This discount is inherited from Apartment level. It can only be deleted from Apartment level.';
        const docTooltip = t('discount.deleteDocumentDisabledInheritedApartment') || 'This document is inherited from Apartment level. It can only be deleted from Apartment level.';
        return {
            canDelete: false,
            isDeleteButtonVisible,
            deleteTooltip: t(tooltipKey) || fallback,
            documentDeleteTooltip: docTooltip,
            isActualOverride: false,
        };
    }

    if (!isInherited) {
        const notSavedKey = itemType === 'social' ? 'discount.deleteDisabledNotSavedSocial' : 'discount.deleteDisabledNotSaved';
        const notSavedFallback = itemType === 'social' ? 'This detail has not been saved yet.' : 'This discount has not been saved yet.';
        return {
            canDelete: false,
            isDeleteButtonVisible,
            deleteTooltip: isItemFilled ? (t(notSavedKey) || notSavedFallback) : undefined,
            documentDeleteTooltip: t(notSavedKey) || notSavedFallback,
            isActualOverride: false,
        };
    }

    const tooltipKey = itemType === 'social'
        ? 'discount.deleteDisabledInheritedApartmentWingSocial'
        : 'discount.deleteDisabledInheritedApartmentWing';
    const fallback = itemType === 'social'
        ? 'This detail is inherited from Apartment or Wing level. It can only be deleted from Apartment or Wing level.'
        : 'This discount is inherited from Apartment or Wing level. It can only be deleted from Apartment or Wing level.';
    const docTooltip = t('discount.deleteDocumentDisabledInheritedApartmentWing') || 'This document is inherited from Apartment or Wing level. It can only be deleted from Apartment or Wing level.';
    return {
        canDelete: false,
        isDeleteButtonVisible,
        deleteTooltip: t(tooltipKey) || fallback,
        documentDeleteTooltip: docTooltip,
        isActualOverride: false,
    };
}
