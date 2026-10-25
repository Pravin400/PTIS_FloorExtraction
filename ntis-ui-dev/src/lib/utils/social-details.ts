import { SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
export {
    filterActiveAttributes,
    dedupeByAttributeAndScope,
    normalizeUploadResponse,
    resolveDocumentGuid,
    resolveBindingId,
    expandConnectedSocialAttributeIds,
    type ScopeIdentifier,
} from "@/lib/utils/ptis/social-details/social-details-utils";
import { resolveDocumentGuid, resolveBindingId } from "@/lib/utils/ptis/social-details/social-details-utils";

export interface FlatSocialAttributeState {
    id: number | null; // Database propertySocialDetailId
    socialAttributeId: number;
    socialAttributeCode: string;
    socialAttributeName: string;
    dataType: string;
    parentAttributeId: number | null | undefined;
    isRequiredWhenParentTrue: boolean;
    bitValue: boolean | null;
    intValue: number | string | null;
    decimalValue: number | string | null;
    textValue: string | null;
    dateValue: string | null;
    documentBindingId: number | null;
    fileName?: string | null;
    uploadedGuid?: string;
    remark: string | null;
    isUploading: boolean;
    isDeleting?: boolean;
    isPhotoRequired?: boolean;
    isDocumentRequired?: boolean;
    isCommonAreaAttribute?: boolean;
    documentGuid?: string | null;
    documentUrl?: string | null;
    photoBindingId?: number | null;
    photoGuid?: string | null;
    pendingFile?: File;
    propertyId?: number | null;
    entityType?: string | null;
    inheritedFrom?: string | null;
    inheritanceLevel?: 'Self' | 'Wing' | 'Apartment' | string | null;
    isInherited?: boolean;
    isOverridden?: boolean;
}


/**
 * Flattens the nested social attributes tree into a flat map keyed by socialAttributeId.
 */
export function flattenAttributes(attributes: SocialAttributeHierarchyDto[]): Record<number, FlatSocialAttributeState> {
    const map: Record<number, FlatSocialAttributeState> = {};
    const traverse = (attrs: SocialAttributeHierarchyDto[], parentId?: number | null) => {
        for (const attr of attrs) {
            const isBitType = attr.dataType.toUpperCase() === "BIT";
            const isRootAttr = attr.parentAttributeId === null || attr.parentAttributeId === undefined || !parentId;

            const checkHasAnyDescendantValue = (item: SocialAttributeHierarchyDto): boolean => {
                if (
                    item.bitValue === true ||
                    (item.intValue !== null && item.intValue !== undefined) ||
                    (item.decimalValue !== null && item.decimalValue !== undefined) ||
                    (item.textValue !== null && item.textValue !== undefined && String(item.textValue).trim() !== "") ||
                    (Boolean(item.propertySocialDetailId && Number(item.propertySocialDetailId) > 0)) ||
                    Boolean(item.documentGuid || item.photoGuid || item.documentBindingId)
                ) {
                    return true;
                }
                if (item.children && item.children.length > 0) {
                    return item.children.some(checkHasAnyDescendantValue);
                }
                return false;
            };

            const hasAnySavedValue = checkHasAnyDescendantValue(attr);

            let initialBitValue = attr.bitValue ?? null;
            if (attr.isActive === false) {
                initialBitValue = false;
            } else if (attr.bitValue !== null && attr.bitValue !== undefined) {
                initialBitValue = attr.bitValue;
            } else if (hasAnySavedValue) {
                initialBitValue = true;
            } else if (isBitType || isRootAttr) {
                initialBitValue = false;
            } else {
                initialBitValue = null;
            }

            const isInherited = Boolean(
                attr.inheritanceLevel === "Apartment" || 
                attr.inheritanceLevel === "Wing" || 
                attr.inheritedFrom === "Apartment" || 
                attr.inheritedFrom === "Wing"
            );
            const resolvedInheritanceLevel = attr.inheritanceLevel ?? (attr.inheritedFrom ? attr.inheritedFrom : (attr.propertySocialDetailId ? "Self" : null));
            const resolvedInheritedFrom = attr.inheritedFrom ?? (isInherited ? attr.inheritanceLevel : null);

            map[attr.id] = {
                id: attr.propertySocialDetailId ?? null,
                socialAttributeId: attr.id,
                socialAttributeCode: attr.socialAttributeCode,
                socialAttributeName: attr.socialAttributeName,
                dataType: attr.dataType,
                parentAttributeId: attr.parentAttributeId || parentId || null,
                isRequiredWhenParentTrue: attr.isRequiredWhenParentTrue,
                bitValue: initialBitValue,
                intValue: attr.intValue ?? null,
                decimalValue: attr.decimalValue ?? null,
                textValue: attr.textValue ?? null,
                dateValue: attr.dateValue ? attr.dateValue.split("T")[0] : null,
                documentBindingId: resolveBindingId(attr),
                fileName: attr.fileName ?? null,
                remark: attr.remark ?? null,
                isUploading: false,
                isPhotoRequired: attr.isPhotoRequired,
                isDocumentRequired: attr.isDocumentRequired,
                isCommonAreaAttribute: attr.isCommonAreaAttribute ?? false,
                documentGuid: resolveDocumentGuid(attr),
                documentUrl: resolveDocumentGuid(attr) ? `/api/documents/${encodeURIComponent(resolveDocumentGuid(attr)!)}/view` : null,
                photoBindingId: resolveBindingId(attr),
                photoGuid: resolveDocumentGuid(attr),
                entityType: attr.entityType ?? null,
                inheritedFrom: resolvedInheritedFrom ?? null,
                inheritanceLevel: resolvedInheritanceLevel ?? null,
                isInherited: isInherited,
                isOverridden: false,
            };
            if (attr.children && attr.children.length > 0) {
                traverse(attr.children, attr.id);
            }
        }
    };
    traverse(attributes, null);
    return map;
}

/**
 * Checks if a given attribute is enabled based on its parent attribute status.
 */
export function isAttributeEnabled(
    attr: FlatSocialAttributeState,
    currentData: Record<number, FlatSocialAttributeState>
): boolean {
    if (!attr.parentAttributeId) {
        return attr.bitValue === true;
    }
    const parent = currentData[attr.parentAttributeId];
    if (!parent) return false;
    return parent.bitValue === true && isAttributeEnabled(parent, currentData);
}

/**
 * Checks if a card contains validation errors.
 */
export function isCardInvalid(
    attr: SocialAttributeHierarchyDto,
    errors: Record<number, string>
): boolean {
    if (errors[attr.id]) return true;
    return (attr.children ?? []).some((child) => isCardInvalid(child, errors));
}

/**
 * Gets the dynamic name/label for a social attribute directly from the API response.
 * Does not i18n localize attribute names so users can dynamically add more social attributes in the backend.
 */
export function getLocalizedName(
    code: string | undefined | null,
    name: string | undefined | null,
    _t?: unknown
): string {
    const trimmedName = name?.trim();
    if (trimmedName) {
        return trimmedName;
    }
    return code?.trim() || "";
}

