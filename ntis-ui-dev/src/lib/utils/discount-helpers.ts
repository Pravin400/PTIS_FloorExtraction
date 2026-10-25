import { 
    DiscountState, 
    PropertyDiscountInfoResponseDto,
    DiscountAttributeItemDto,
    DiscountAttributeState
} from "@/types/discount.types";
import { getLocalizedName, FlatSocialAttributeState } from "@/lib/utils/social-details";
import { SocialAttribute } from "@/types/social-attribute.types";
import { PropertySocialDetailsDto } from "@/types/property-social-details.types";
import { getItemLevel, LEVEL_NAMES } from "@/lib/utils/ptis/social-details";

function extractDocGuid(record: unknown): string | null {
    if (!record || typeof record !== 'object') return null;
    const r = record as Record<string, unknown>;
    const guid = r.documentGuid ?? r.photoGuid ?? r.DocumentGuid ?? r.PhotoGuid ?? r.guid ?? r.Guid ?? r.fileGuid;
    return guid != null && guid !== '' ? String(guid) : null;
}

function extractDocBindingId(record: unknown): number | null {
    if (!record || typeof record !== 'object') return null;
    const r = record as Record<string, unknown>;
    const id = r.documentBindingId ?? r.photoBindingId ?? r.DocumentBindingId ?? r.PhotoBindingId;
    return id != null && id !== '' ? Number(id) : null;
}

function extractDocFileName(record: unknown): string | undefined {
    if (!record || typeof record !== 'object') return undefined;
    const r = record as Record<string, unknown>;
    const name = r.fileName ?? r.FileName ?? r.originalFileName ?? r.OriginalFileName;
    return name != null && name !== '' ? String(name) : undefined;
}

/**
 * Maps the API response DTO to the dynamic local form state.
 * All document metadata (documentGuid, documentUrl) comes directly from the
 * server response — no client-side caching or fallback is used.
 */
export const mapApiToDiscountState = (
    data: PropertyDiscountInfoResponseDto | null,
    masterAttributes?: SocialAttribute[],
    currentLevel?: 'Apartment' | 'Wing' | 'Unit'
): DiscountState => {
    const state: DiscountState = {} as DiscountState;

    if (masterAttributes && masterAttributes.length > 0) {
        masterAttributes.forEach(attr => {
            const isBitType = attr.dataType.toUpperCase() === "BIT";
            state[attr.id] = {
                id: attr.id,
                socialAttributeCode: attr.socialAttributeCode,
                socialAttributeName: attr.socialAttributeName,
                dataType: attr.dataType,
                unit: attr.unit,
                displayOrder: attr.displayOrder,
                isDiscountApplicable: attr.isDiscountApplicable,
                isPhotoRequired: attr.isPhotoRequired,
                isDocumentRequired: attr.isDocumentRequired,
                isActive: attr.isActive,
                isCommonAreaAttribute: Boolean(attr.isCommonAreaAttribute),
                parentAttributeId: attr.parentAttributeId ?? null,
                isRequiredWhenParentTrue: attr.isRequiredWhenParentTrue ?? false,
                propertySocialDetailId: null,
                entityType: currentLevel === 'Apartment' ? 'S' : currentLevel === 'Wing' ? 'W' : 'P',
                bitValue: isBitType ? false : null,
                intValue: null,
                decimalValue: null,
                textValue: null,
                dateValue: null,
                documentBindingId: null,
                documentGuid: null,
                documentUrl: null,
                remark: null,
                enabled: false,
                isUploading: false,
            };
        });
    }

    if (data?.discountAttributes) {
        data.discountAttributes.forEach((attr) => {
            const isBitType = attr.dataType.toUpperCase() === "BIT";
            const bitValue = attr.bitValue ?? false;
            const docGuid = extractDocGuid(attr);
            const docUrl = attr.documentUrl || (docGuid ? `/api/documents/${encodeURIComponent(docGuid)}/view` : null);
            const fileName = extractDocFileName(attr);
            const docBindingId = extractDocBindingId(attr);

            const inheritedFromUpper = (attr.inheritedFrom || '').toUpperCase();
            const entityTypeUpper = (attr.entityType || '').toUpperCase();
            const inheritanceLevelUpper = (attr.inheritanceLevel || '').toUpperCase();

            const isFromApartment = inheritanceLevelUpper === 'APARTMENT' || inheritedFromUpper === 'APARTMENT' || inheritedFromUpper === 'SOCIETY' || entityTypeUpper === 'S';
            const isFromWing = inheritanceLevelUpper === 'WING' || inheritedFromUpper === 'WING' || entityTypeUpper === 'W';
            const isInherited = (currentLevel === 'Wing' && isFromApartment) ||
                                (currentLevel === 'Unit' && (isFromApartment || isFromWing));

            const resolvedInheritanceLevel: 'Self' | 'Wing' | 'Apartment' = 
                isInherited
                    ? (isFromWing && currentLevel === 'Unit' ? 'Wing' : 'Apartment')
                    : 'Self';
            const resolvedInheritedFrom: string | null = isInherited ? resolvedInheritanceLevel : null;

            const hasNumericVal = (attr.intValue !== null && attr.intValue !== undefined && Number(attr.intValue) !== 0) ||
                                  (attr.decimalValue !== null && attr.decimalValue !== undefined && Number(attr.decimalValue) !== 0);
            const hasTextVal = Boolean(attr.textValue && String(attr.textValue).trim() !== "");
            const hasDateVal = Boolean(attr.dateValue && String(attr.dateValue).trim() !== "");
            const hasDirectVal = hasNumericVal || hasTextVal || hasDateVal;

            const effectiveBitValue = isInherited ? true : bitValue;
            const effectiveEnabled = isInherited
                ? true
                : (isBitType
                    ? bitValue
                    : (hasDirectVal || (attr.propertySocialDetailId != null && bitValue)));
            
            state[attr.id] = {
                ...state[attr.id], // preserve master data fields if they exist
                ...attr,
                dataType: attr.dataType,
                intValue: attr.intValue ?? null,
                decimalValue: attr.decimalValue ?? null,
                bitValue: effectiveBitValue,
                enabled: effectiveEnabled,
                dateValue: attr.dateValue ? attr.dateValue.split("T")[0] : null,
                documentBindingId: docBindingId ?? attr.documentBindingId ?? null,
                documentGuid: docGuid,
                documentUrl: docUrl,
                fileName: fileName,
                entityType: attr.entityType || (currentLevel === 'Apartment' ? 'S' : currentLevel === 'Wing' ? 'W' : 'P'),
                propertySocialDetailId: attr.propertySocialDetailId ?? null,
                isInherited: isInherited,
                inheritedFrom: resolvedInheritedFrom,
                inheritanceLevel: resolvedInheritanceLevel,
                isOverridden: false,
                isUploading: false,
                isCommonAreaAttribute: Boolean(attr.isCommonAreaAttribute ?? state[attr.id]?.isCommonAreaAttribute),
                parentAttributeId: attr.parentAttributeId ?? state[attr.id]?.parentAttributeId ?? null,
                isRequiredWhenParentTrue: attr.isRequiredWhenParentTrue ?? state[attr.id]?.isRequiredWhenParentTrue ?? false,
            };
        });
    }

    return state;
};

/**
 * Maps the local form state back to the PUT payload structure
 */
export const mapDiscountStateToApi = (state: DiscountState): DiscountAttributeItemDto[] => {
    const discountAttributes: DiscountAttributeItemDto[] = [];

    Object.values(state).forEach((item) => {
        // If an item is inherited and NOT overridden, do not send it — it is dynamically inherited top-down!
        if (item.isInherited && !item.isOverridden) {
            return;
        }

        const isBitType = item.dataType.toUpperCase() === "BIT";
        const enabled = isBitType ? (item.bitValue ?? false) : item.enabled;
        const hasBeenSavedAtThisLevel = !item.isInherited && item.propertySocialDetailId != null;

        if (item.id && item.isDiscountApplicable && (enabled || hasBeenSavedAtThisLevel || item.isOverridden)) {
            
            // Format numeric values safely
            let intValue = null;
            if (enabled && item.intValue !== undefined && item.intValue !== null && String(item.intValue).trim() !== "") {
                const parsed = parseInt(String(item.intValue), 10);
                intValue = isNaN(parsed) ? null : parsed;
            }

            let decimalValue = null;
            if (enabled && item.decimalValue !== undefined && item.decimalValue !== null && String(item.decimalValue).trim() !== "") {
                const parsed = parseFloat(String(item.decimalValue));
                decimalValue = isNaN(parsed) ? null : parsed;
            }

            const textValue = enabled ? (item.textValue || null) : null;
            const dateValue = enabled ? (item.dateValue ? new Date(item.dateValue).toISOString() : null) : null;

            // When updating a direct record, preserve its ID. When overriding an inherited attribute, pass null to create a new direct record.
            const targetDetailId = (item.propertySocialDetailId && Number(item.propertySocialDetailId) > 0 && (!item.isInherited || item.inheritanceLevel === 'Self'))
                ? Number(item.propertySocialDetailId)
                : null;

            discountAttributes.push({
                propertySocialDetailId: targetDetailId,
                socialAttributeId: item.id,
                dataType: item.dataType,
                bitValue: enabled,
                intValue,
                decimalValue,
                textValue,
                dateValue,
                documentBindingId: enabled ? (item.documentBindingId ?? null) : null,
                remark: enabled ? (item.remark || null) : null,
                isActive: true,
                entityType: item.entityType || (item.inheritanceLevel === 'Apartment' ? 'S' : item.inheritanceLevel === 'Wing' ? 'W' : 'P'),
                inheritedFrom: item.inheritedFrom,
                inheritanceLevel: item.inheritanceLevel,
            });
        }
    });

    return discountAttributes;
};

/**
 * Filters and sorts discount attributes based on search term and show-active-first option.
 */
export const getFilteredDiscounts = (
    discountData: DiscountState,
    searchTerm: string,
    showActiveFirst: boolean,
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    }
) => {
    let list = Object.values(discountData)
        .filter((discount) => discount.isActive !== false && !discount.parentAttributeId)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        list = list.filter((discount) => {
            const displayName = getLocalizedName(
                discount.socialAttributeCode,
                discount.socialAttributeName,
                t
            );
            if (displayName.toLowerCase().includes(term)) return true;
            // Also match if any descendant child matches the search term
            return Object.values(discountData).some((child) => {
                if (child.parentAttributeId !== discount.id) return false;
                const childName = getLocalizedName(child.socialAttributeCode, child.socialAttributeName, t);
                return childName.toLowerCase().includes(term);
            });
        });
    }
    if (showActiveFirst) {
        list = [...list].sort((a, b) => {
            const aIsBit = a.dataType?.toUpperCase() === "BIT";
            const bIsBit = b.dataType?.toUpperCase() === "BIT";
            const aActive = (aIsBit ? a.bitValue === true : a.enabled) ? 1 : 0;
            const bActive = (bIsBit ? b.bitValue === true : b.enabled) ? 1 : 0;
            if (bActive !== aActive) {
                return bActive - aActive;
            }
            return (a.displayOrder || 0) - (b.displayOrder || 0);
        });
    }
    return list;
};

/**
 * Returns the direct children of a discount attribute.
 */
export const getDiscountChildren = (
    parentId: number,
    discountData: DiscountState
): DiscountAttributeState[] => {
    return Object.values(discountData)
        .filter((item) => item.parentAttributeId === parentId && item.isActive !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
};

/**
 * Checks if the current discount state has changes compared to the initial state.
 */
export const hasDiscountChangesComparedToInitial = (
    current: DiscountState,
    initial: DiscountState
): boolean => {
    const currentKeys = Object.keys(current);
    const initialKeys = Object.keys(initial);
    if (currentKeys.length !== initialKeys.length) return true;

    for (const keyStr of currentKeys) {
        const key = Number(keyStr);
        const currItem = current[key];
        const initItem = initial[key];
        if (!initItem) return true;

        if (Boolean(currItem.isOverridden) !== Boolean(initItem.isOverridden)) return true;
        if ((currItem.enabled ?? false) !== (initItem.enabled ?? false)) return true;
        if ((currItem.bitValue ?? false) !== (initItem.bitValue ?? false)) return true;

        const currInt = currItem.intValue === "" || currItem.intValue === undefined ? null : currItem.intValue;
        const initInt = initItem.intValue === "" || initItem.intValue === undefined ? null : initItem.intValue;
        if (String(currInt ?? "") !== String(initInt ?? "")) return true;

        const currDec = currItem.decimalValue === "" || currItem.decimalValue === undefined ? null : currItem.decimalValue;
        const initDec = initItem.decimalValue === "" || initItem.decimalValue === undefined ? null : initItem.decimalValue;
        if (String(currDec ?? "") !== String(initDec ?? "")) return true;

        if ((currItem.textValue ?? "") !== (initItem.textValue ?? "")) return true;
        if ((currItem.dateValue ?? "") !== (initItem.dateValue ?? "")) return true;
        if ((currItem.remark ?? "") !== (initItem.remark ?? "")) return true;
        if (currItem.pendingFile !== undefined) return true;
        if ((currItem.documentGuid ?? "") !== (initItem.documentGuid ?? "")) return true;
        if ((currItem.documentBindingId ?? null) !== (initItem.documentBindingId ?? null)) return true;
        if ((currItem.fileName ?? "") !== (initItem.fileName ?? "")) return true;
    }

    return false;
};

/**
 * Hydrates discount state with direct unit-level details from savedPropertyDetails when editing a specific unit.
 */
export const buildUnitDiscountState = (
    masterAttributes: SocialAttribute[] | undefined,
    baseState: DiscountState,
    savedPropertyDetails: PropertySocialDetailsDto[] | undefined,
    editingUnitId: number | null | undefined,
    level: 'Apartment' | 'Wing' | 'Unit' | undefined,
    wingDetailId?: number | null | undefined,
    isSociety?: boolean
): DiscountState => {
    if (isSociety === false || (level !== 'Unit' && level !== 'Wing')) {
        return baseState;
    }

    const currentWingId = wingDetailId && Number(wingDetailId) > 0 ? Number(wingDetailId) : undefined;
    const result: DiscountState = {};
    const attrs = masterAttributes && masterAttributes.length > 0
        ? masterAttributes
        : Object.values(baseState);

    attrs.forEach((attr) => {
        const base = baseState[attr.id];

        // 1. Direct unit record (only applicable when editingUnitId is provided at Unit level)
        const directRecord = (level === 'Unit' && editingUnitId)
            ? (savedPropertyDetails || []).find((item) => {
                const attrId = item.socialAttributeId ?? item.id;
                const itemPropId = item.propertyId;
                return (
                    attrId === attr.id &&
                    itemPropId === editingUnitId &&
                    (getItemLevel(item) === LEVEL_NAMES.UNIT) &&
                    item.isActive !== false
                );
            })
            : undefined;

        // 2. Wing record for the active wing (or any wing if wingDetailId not specified)
        const wingRecord = (savedPropertyDetails || []).find((item) => {
            const attrId = item.socialAttributeId ?? item.id;
            const itemWingId = item.wingDetailId && Number(item.wingDetailId) > 0 ? Number(item.wingDetailId) : undefined;
            const isMatchingWing = currentWingId ? itemWingId === currentWingId : true;
            return (
                attrId === attr.id &&
                isMatchingWing &&
                (getItemLevel(item) === LEVEL_NAMES.WING) &&
                item.isActive !== false
            );
        });

        // 3. Apartment record
        const apartmentRecord = (savedPropertyDetails || []).find((item) => {
            const attrId = item.socialAttributeId ?? item.id;
            return (
                attrId === attr.id &&
                (getItemLevel(item) === LEVEL_NAMES.APARTMENT) &&
                item.isActive !== false
            );
        });

        if (directRecord) {
            const isBitType = (attr.dataType || base?.dataType || 'BIT').toUpperCase() === 'BIT';
            const resolvedDocGuid = extractDocGuid(directRecord) || null;
            const resolvedFileName = extractDocFileName(directRecord);
            const resolvedDocUrl = directRecord.documentUrl || (resolvedDocGuid ? `/api/documents/${encodeURIComponent(resolvedDocGuid)}/view` : undefined);
            const resolvedDocBindingId = extractDocBindingId(directRecord);

            result[attr.id] = {
                id: attr.id,
                socialAttributeCode: attr.socialAttributeCode || base?.socialAttributeCode || '',
                socialAttributeName: attr.socialAttributeName || base?.socialAttributeName || '',
                dataType: attr.dataType || base?.dataType || 'BIT',
                unit: attr.unit ?? base?.unit,
                displayOrder: attr.displayOrder ?? base?.displayOrder,
                isPhotoRequired: attr.isPhotoRequired ?? base?.isPhotoRequired,
                isDocumentRequired: attr.isDocumentRequired ?? base?.isDocumentRequired,
                isDiscountApplicable: attr.isDiscountApplicable ?? base?.isDiscountApplicable ?? true,
                isCommonAreaAttribute: Boolean(attr.isCommonAreaAttribute ?? base?.isCommonAreaAttribute),
                parentAttributeId: attr.parentAttributeId ?? base?.parentAttributeId ?? null,
                isRequiredWhenParentTrue: attr.isRequiredWhenParentTrue ?? base?.isRequiredWhenParentTrue ?? false,
                propertySocialDetailId: directRecord.id,
                bitValue: directRecord.bitValue ?? (isBitType ? true : false),
                enabled: directRecord.bitValue !== false,
                intValue: directRecord.intValue != null ? String(directRecord.intValue) : null,
                decimalValue: directRecord.decimalValue != null ? String(directRecord.decimalValue) : null,
                textValue: directRecord.textValue || null,
                dateValue: directRecord.dateValue ? String(directRecord.dateValue).split("T")[0] : null,
                documentBindingId: resolvedDocBindingId,
                documentGuid: resolvedDocGuid,
                fileName: resolvedFileName,
                documentUrl: resolvedDocUrl,
                remark: directRecord.remark || '',
                entityType: 'P',
                propertyId: directRecord.propertyId || editingUnitId,
                isInherited: false,
                inheritanceLevel: 'Self',
                inheritedFrom: null,
                isOverridden: false,
                pendingFile: undefined,
            };
        } else if (level === 'Wing' && wingRecord) {
            const isBitType = (attr.dataType || base?.dataType || 'BIT').toUpperCase() === 'BIT';
            const resolvedDocGuid = extractDocGuid(wingRecord) || null;
            const resolvedFileName = extractDocFileName(wingRecord);
            const resolvedDocUrl = wingRecord.documentUrl || (resolvedDocGuid ? `/api/documents/${encodeURIComponent(resolvedDocGuid)}/view` : undefined);
            const resolvedDocBindingId = extractDocBindingId(wingRecord);

            result[attr.id] = {
                id: attr.id,
                socialAttributeCode: attr.socialAttributeCode || base?.socialAttributeCode || '',
                socialAttributeName: attr.socialAttributeName || base?.socialAttributeName || '',
                dataType: attr.dataType || base?.dataType || 'BIT',
                unit: attr.unit ?? base?.unit,
                displayOrder: attr.displayOrder ?? base?.displayOrder,
                isPhotoRequired: attr.isPhotoRequired ?? base?.isPhotoRequired,
                isDocumentRequired: attr.isDocumentRequired ?? base?.isDocumentRequired,
                isDiscountApplicable: attr.isDiscountApplicable ?? base?.isDiscountApplicable ?? true,
                isCommonAreaAttribute: Boolean(attr.isCommonAreaAttribute ?? base?.isCommonAreaAttribute),
                parentAttributeId: attr.parentAttributeId ?? base?.parentAttributeId ?? null,
                isRequiredWhenParentTrue: attr.isRequiredWhenParentTrue ?? base?.isRequiredWhenParentTrue ?? false,
                propertySocialDetailId: wingRecord.id,
                bitValue: wingRecord.bitValue ?? (isBitType ? true : false),
                enabled: wingRecord.bitValue !== false,
                intValue: wingRecord.intValue != null ? String(wingRecord.intValue) : null,
                decimalValue: wingRecord.decimalValue != null ? String(wingRecord.decimalValue) : null,
                textValue: wingRecord.textValue || null,
                dateValue: wingRecord.dateValue ? String(wingRecord.dateValue).split("T")[0] : null,
                documentBindingId: resolvedDocBindingId,
                documentGuid: resolvedDocGuid,
                fileName: resolvedFileName,
                documentUrl: resolvedDocUrl,
                remark: wingRecord.remark || '',
                entityType: 'W',
                propertyId: null,
                isInherited: false,
                inheritanceLevel: 'Self',
                inheritedFrom: null,
                isOverridden: false,
                pendingFile: undefined,
            };
        } else {
            const inheritedDocGuid = extractDocGuid(wingRecord) || extractDocGuid(apartmentRecord) || extractDocGuid(base) || null;
            const inheritedFileName = extractDocFileName(wingRecord) || extractDocFileName(apartmentRecord) || extractDocFileName(base);
            const inheritedDocUrl = wingRecord?.documentUrl || apartmentRecord?.documentUrl || base?.documentUrl || (inheritedDocGuid ? `/api/documents/${encodeURIComponent(inheritedDocGuid)}/view` : undefined);
            const inheritedRemark = wingRecord?.remark || apartmentRecord?.remark || base?.remark || '';
            const inheritedDocBindingId = extractDocBindingId(wingRecord) || extractDocBindingId(apartmentRecord) || extractDocBindingId(base);
            const inheritedIntValue = wingRecord?.intValue != null ? String(wingRecord.intValue) : (apartmentRecord?.intValue != null ? String(apartmentRecord.intValue) : (base?.intValue != null ? String(base.intValue) : null));
            const inheritedDecimalValue = wingRecord?.decimalValue != null ? String(wingRecord.decimalValue) : (apartmentRecord?.decimalValue != null ? String(apartmentRecord.decimalValue) : (base?.decimalValue != null ? String(base.decimalValue) : null));
            const inheritedTextValue = wingRecord?.textValue || apartmentRecord?.textValue || base?.textValue || null;
            const inheritedDateValue = wingRecord?.dateValue ? String(wingRecord.dateValue).split("T")[0] : (apartmentRecord?.dateValue ? String(apartmentRecord.dateValue).split("T")[0] : (base?.dateValue ? String(base.dateValue).split("T")[0] : null));

            const isInheritedFromWing = level === 'Unit' && Boolean(wingRecord || (base?.isInherited && base?.inheritanceLevel === 'Wing'));
            const isInheritedFromApt = Boolean(apartmentRecord || (base?.isInherited && base?.inheritanceLevel === 'Apartment'));
            const isInherited = isInheritedFromWing || isInheritedFromApt;
            const resolvedInheritanceLevel = isInheritedFromWing ? 'Wing' : (isInheritedFromApt ? 'Apartment' : 'Self');
            const resolvedInheritedFrom = isInherited ? resolvedInheritanceLevel : null;

            const isEnabled = Boolean(base?.enabled || (isInheritedFromWing && wingRecord && wingRecord.bitValue !== false) || (isInheritedFromApt && apartmentRecord && apartmentRecord.bitValue !== false));
            const bitValue = Boolean(base?.bitValue || (isInheritedFromWing && wingRecord && wingRecord.bitValue !== false) || (isInheritedFromApt && apartmentRecord && apartmentRecord.bitValue !== false));

            result[attr.id] = {
                ...base,
                id: attr.id,
                socialAttributeCode: attr.socialAttributeCode || base?.socialAttributeCode || '',
                socialAttributeName: attr.socialAttributeName || base?.socialAttributeName || '',
                dataType: attr.dataType || base?.dataType || 'BIT',
                unit: attr.unit ?? base?.unit,
                displayOrder: attr.displayOrder ?? base?.displayOrder,
                isPhotoRequired: attr.isPhotoRequired ?? base?.isPhotoRequired,
                isDocumentRequired: attr.isDocumentRequired ?? base?.isDocumentRequired,
                isDiscountApplicable: attr.isDiscountApplicable ?? base?.isDiscountApplicable ?? true,
                isCommonAreaAttribute: Boolean(attr.isCommonAreaAttribute ?? base?.isCommonAreaAttribute),
                parentAttributeId: attr.parentAttributeId ?? base?.parentAttributeId ?? null,
                isRequiredWhenParentTrue: attr.isRequiredWhenParentTrue ?? base?.isRequiredWhenParentTrue ?? false,
                propertySocialDetailId: null,
                bitValue,
                enabled: isEnabled,
                intValue: inheritedIntValue,
                decimalValue: inheritedDecimalValue,
                textValue: inheritedTextValue,
                dateValue: inheritedDateValue,
                documentBindingId: inheritedDocBindingId,
                documentGuid: inheritedDocGuid,
                fileName: inheritedFileName,
                documentUrl: inheritedDocUrl,
                remark: inheritedRemark,
                entityType: isInheritedFromWing ? 'W' : (isInheritedFromApt ? 'S' : (level === 'Wing' ? 'W' : 'P')),
                propertyId: editingUnitId || null,
                isInherited,
                inheritanceLevel: resolvedInheritanceLevel,
                inheritedFrom: resolvedInheritedFrom,
                isOverridden: false,
                pendingFile: undefined,
            };
        }
    });

    return result;
};

export type AttributeWithState = DiscountAttributeState | FlatSocialAttributeState;

function isDiscountAttributeState(attr: AttributeWithState): attr is DiscountAttributeState {
    return "enabled" in attr && typeof (attr as DiscountAttributeState).enabled === "boolean";
}

export const isAttributeActive = (
    attr: AttributeWithState | null | undefined
): boolean => {
    if (!attr) return false;
    const isBitType = (attr.dataType || "").toUpperCase() === "BIT";
    
    if (isBitType) {
        return attr.bitValue === true;
    }
    
    if (isDiscountAttributeState(attr)) {
        return attr.enabled;
    }
    
    return attr.bitValue === true;
};


