import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { FlatSocialAttributeState, flattenAttributes } from "@/lib/utils/social-details";
import { hasSocialChangesComparedToInitial } from "@/lib/utils/social-changes";
import { getDocumentViewUrl } from "@/lib/utils/document-utils";
import { PropertySocialInfoResponseDto, PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import { SocialAttribute } from "@/types/social-attribute.types";
import { getItemLevel, LEVEL_NAMES } from "@/lib/utils/ptis/social-details";

export function buildUnitSocialState(
    initialSocialData: PropertySocialInfoResponseDto | null,
    masterAttributes: SocialAttribute[] | undefined,
    savedPropertyDetails: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[] | undefined,
    editingUnitId: number | null | undefined,
    level: 'Apartment' | 'Wing' | 'Unit' | undefined,
    wingDetailId?: number | null | undefined,
    isSociety?: boolean
): Record<number, FlatSocialAttributeState> {
    const flatData = flattenAttributes(initialSocialData?.socialAttributes || []);
    if (masterAttributes && masterAttributes.length > 0) {
        masterAttributes.forEach(attr => {
            if (!flatData[attr.id]) {
                const isBitType = attr.dataType.toUpperCase() === "BIT";
                const isRootAttr = attr.parentAttributeId === null || attr.parentAttributeId === undefined;
                flatData[attr.id] = {
                    id: null,
                    socialAttributeId: attr.id,
                    socialAttributeCode: attr.socialAttributeCode,
                    socialAttributeName: attr.socialAttributeName,
                    dataType: attr.dataType,
                    parentAttributeId: attr.parentAttributeId,
                    isRequiredWhenParentTrue: attr.isRequiredWhenParentTrue,
                    bitValue: (isBitType || isRootAttr) ? false : null,
                    intValue: null,
                    decimalValue: null,
                    textValue: null,
                    dateValue: null,
                    documentBindingId: null,
                    remark: null,
                    isUploading: false,
                    isPhotoRequired: attr.isPhotoRequired,
                    isDocumentRequired: attr.isDocumentRequired,
                    isCommonAreaAttribute: Boolean(attr.isCommonAreaAttribute),
                    documentGuid: null,
                    documentUrl: null,
                    photoBindingId: null,
                    photoGuid: null
                };
            }
        });
    }

    if (isSociety === false || (level !== 'Unit' && level !== 'Wing')) {
        return flatData;
    }

    const currentWingId = wingDetailId && Number(wingDetailId) > 0 ? Number(wingDetailId) : undefined;
    const result = { ...flatData };
    const attrIds = masterAttributes && masterAttributes.length > 0
        ? masterAttributes.map(a => a.id)
        : Object.keys(flatData).map(Number);
    const masterById = new Map((masterAttributes || []).map(a => [a.id, a]));

    attrIds.forEach((attrId) => {
        const base = flatData[attrId];
        const master = masterById.get(attrId);

        // 1. Direct unit record (only applicable when editingUnitId is provided at Unit level)
        const directRecord = (level === 'Unit' && editingUnitId)
            ? (savedPropertyDetails || []).find((item) => {
                const itemAttrId = 'socialAttributeId' in item && item.socialAttributeId != null
                    ? Number(item.socialAttributeId)
                    : Number(item.id);
                const rawPropId = 'propertyId' in item ? item.propertyId : undefined;
                const itemPropId = rawPropId != null ? Number(rawPropId) : undefined;
                const isActive = 'isActive' in item ? item.isActive : true;

                return (
                    itemAttrId === attrId &&
                    itemPropId === editingUnitId &&
                    getItemLevel(item) === LEVEL_NAMES.UNIT &&
                    isActive !== false
                );
            })
            : undefined;

        // 2. Wing record for the active wing (or any wing if wingDetailId not specified)
        const wingRecord = (savedPropertyDetails || []).find((item) => {
            const itemAttrId = 'socialAttributeId' in item && item.socialAttributeId != null
                ? Number(item.socialAttributeId)
                : Number(item.id);
            const rawWingId = 'wingDetailId' in item ? item.wingDetailId : undefined;
            const itemWingId = rawWingId != null ? Number(rawWingId) : undefined;
            const isActive = 'isActive' in item ? item.isActive : true;
            const isMatchingWing = currentWingId ? itemWingId === currentWingId : true;

            return (
                itemAttrId === attrId &&
                isMatchingWing &&
                getItemLevel(item) === LEVEL_NAMES.WING &&
                isActive !== false
            );
        });

        // 3. Apartment record
        const apartmentRecord = (savedPropertyDetails || []).find((item) => {
            const itemAttrId = 'socialAttributeId' in item && item.socialAttributeId != null
                ? Number(item.socialAttributeId)
                : Number(item.id);
            const isActive = 'isActive' in item ? item.isActive : true;

            return (
                itemAttrId === attrId &&
                getItemLevel(item) === LEVEL_NAMES.APARTMENT &&
                isActive !== false
            );
        });

        // Ensure parent and child active status are in sync:
        // A child record must not be active if its parent is not active at that level.
        const parentId = master?.parentAttributeId ?? base?.parentAttributeId;
        const isChildAttr = parentId != null && parentId > 0;

        const isParentActiveOnDirectUnit = !isChildAttr || (savedPropertyDetails || []).some((item) => {
            const itemAttrId = 'socialAttributeId' in item && item.socialAttributeId != null
                ? Number(item.socialAttributeId)
                : Number(item.id);
            const rawPropId = 'propertyId' in item ? item.propertyId : undefined;
            const itemPropId = rawPropId != null ? Number(rawPropId) : undefined;
            const isActive = 'isActive' in item ? item.isActive : true;
            const isMarked = 'markedForDeletion' in item ? Boolean(item.markedForDeletion) : false;
            return itemAttrId === parentId && itemPropId === editingUnitId && isActive !== false && !isMarked;
        });

        const isParentActiveOnWing = !isChildAttr || (savedPropertyDetails || []).some((item) => {
            const itemAttrId = 'socialAttributeId' in item && item.socialAttributeId != null
                ? Number(item.socialAttributeId)
                : Number(item.id);
            const rawWingId = 'wingDetailId' in item ? item.wingDetailId : undefined;
            const itemWingId = rawWingId != null ? Number(rawWingId) : undefined;
            const isActive = 'isActive' in item ? item.isActive : true;
            const isMarked = 'markedForDeletion' in item ? Boolean(item.markedForDeletion) : false;
            const isMatchingWing = currentWingId ? itemWingId === currentWingId : true;
            return itemAttrId === parentId && isMatchingWing && getItemLevel(item) === LEVEL_NAMES.WING && isActive !== false && !isMarked;
        });

        const isParentActiveOnApartment = !isChildAttr || (savedPropertyDetails || []).some((item) => {
            const itemAttrId = 'socialAttributeId' in item && item.socialAttributeId != null
                ? Number(item.socialAttributeId)
                : Number(item.id);
            const isActive = 'isActive' in item ? item.isActive : true;
            const isMarked = 'markedForDeletion' in item ? Boolean(item.markedForDeletion) : false;
            return itemAttrId === parentId && getItemLevel(item) === LEVEL_NAMES.APARTMENT && isActive !== false && !isMarked;
        });

        const validDirectRecord = isParentActiveOnDirectUnit ? directRecord : undefined;
        const validWingRecord = isParentActiveOnWing ? wingRecord : undefined;
        const validApartmentRecord = isParentActiveOnApartment ? apartmentRecord : undefined;

        if (validDirectRecord) {
            const recId = ('propertySocialDetailId' in validDirectRecord && validDirectRecord.propertySocialDetailId)
                ? Number(validDirectRecord.propertySocialDetailId)
                : Number(validDirectRecord.id);
            const isBitType = (master?.dataType || base?.dataType || '').toUpperCase() === 'BIT';
            const resolvedDocGuid = validDirectRecord.documentGuid || null;
            const resolvedPhotoGuid = validDirectRecord.photoGuid || null;
            const resolvedDocBindingId = validDirectRecord.documentBindingId || null;
            const resolvedPhotoBindingId = validDirectRecord.photoBindingId || null;
            const docUrl = ('documentUrl' in validDirectRecord && validDirectRecord.documentUrl)
                ? (validDirectRecord.documentUrl as string)
                : getDocumentViewUrl(resolvedDocGuid || resolvedPhotoGuid);

            result[attrId] = {
                id: recId > 0 ? recId : null,
                socialAttributeId: attrId,
                socialAttributeCode: master?.socialAttributeCode || base?.socialAttributeCode || '',
                socialAttributeName: master?.socialAttributeName || base?.socialAttributeName || '',
                dataType: master?.dataType || base?.dataType || 'BIT',
                parentAttributeId: master?.parentAttributeId ?? base?.parentAttributeId ?? null,
                isRequiredWhenParentTrue: master?.isRequiredWhenParentTrue ?? base?.isRequiredWhenParentTrue ?? false,
                bitValue: validDirectRecord.bitValue ?? (isBitType ? true : false),
                intValue: validDirectRecord.intValue != null ? Number(validDirectRecord.intValue) : null,
                decimalValue: validDirectRecord.decimalValue != null ? Number(validDirectRecord.decimalValue) : null,
                textValue: validDirectRecord.textValue || null,
                dateValue: validDirectRecord.dateValue || null,
                documentBindingId: resolvedDocBindingId,
                documentGuid: resolvedDocGuid,
                fileName: validDirectRecord.fileName || undefined,
                documentUrl: docUrl,
                photoBindingId: resolvedPhotoBindingId,
                photoGuid: resolvedPhotoGuid,
                remark: validDirectRecord.remark || null,
                isUploading: false,
                isPhotoRequired: master?.isPhotoRequired ?? base?.isPhotoRequired,
                isDocumentRequired: master?.isDocumentRequired ?? base?.isDocumentRequired,
                isCommonAreaAttribute: Boolean(master?.isCommonAreaAttribute ?? base?.isCommonAreaAttribute),
                entityType: 'P',
                propertyId: ('propertyId' in validDirectRecord && validDirectRecord.propertyId) ? Number(validDirectRecord.propertyId) : (editingUnitId || null),
                isInherited: false,
                inheritanceLevel: 'Self',
                inheritedFrom: null,
                isOverridden: false,
            };
        } else if (level === 'Wing' && validWingRecord) {
            const recId = ('propertySocialDetailId' in validWingRecord && validWingRecord.propertySocialDetailId)
                ? Number(validWingRecord.propertySocialDetailId)
                : Number(validWingRecord.id);
            const isBitType = (master?.dataType || base?.dataType || '').toUpperCase() === 'BIT';
            const resolvedDocGuid = validWingRecord.documentGuid || null;
            const resolvedPhotoGuid = validWingRecord.photoGuid || null;
            const resolvedDocBindingId = validWingRecord.documentBindingId || null;
            const resolvedPhotoBindingId = validWingRecord.photoBindingId || null;
            const docUrl = ('documentUrl' in validWingRecord && validWingRecord.documentUrl)
                ? (validWingRecord.documentUrl as string)
                : getDocumentViewUrl(resolvedDocGuid || resolvedPhotoGuid);

            result[attrId] = {
                id: recId > 0 ? recId : null,
                socialAttributeId: attrId,
                socialAttributeCode: master?.socialAttributeCode || base?.socialAttributeCode || '',
                socialAttributeName: master?.socialAttributeName || base?.socialAttributeName || '',
                dataType: master?.dataType || base?.dataType || 'BIT',
                parentAttributeId: master?.parentAttributeId ?? base?.parentAttributeId ?? null,
                isRequiredWhenParentTrue: master?.isRequiredWhenParentTrue ?? base?.isRequiredWhenParentTrue ?? false,
                bitValue: validWingRecord.bitValue ?? (isBitType ? true : false),
                intValue: validWingRecord.intValue != null ? Number(validWingRecord.intValue) : null,
                decimalValue: validWingRecord.decimalValue != null ? Number(validWingRecord.decimalValue) : null,
                textValue: validWingRecord.textValue || null,
                dateValue: validWingRecord.dateValue || null,
                documentBindingId: resolvedDocBindingId,
                documentGuid: resolvedDocGuid,
                fileName: validWingRecord.fileName || undefined,
                documentUrl: docUrl,
                photoBindingId: resolvedPhotoBindingId,
                photoGuid: resolvedPhotoGuid,
                remark: validWingRecord.remark || null,
                isUploading: false,
                isPhotoRequired: master?.isPhotoRequired ?? base?.isPhotoRequired,
                isDocumentRequired: master?.isDocumentRequired ?? base?.isDocumentRequired,
                isCommonAreaAttribute: Boolean(master?.isCommonAreaAttribute ?? base?.isCommonAreaAttribute),
                entityType: 'W',
                propertyId: null,
                isInherited: false,
                inheritanceLevel: 'Self',
                inheritedFrom: null,
                isOverridden: false,
            };
        } else {
            const wRec = validWingRecord ? (validWingRecord as unknown as Record<string, unknown>) : null;
            const aRec = validApartmentRecord ? (validApartmentRecord as unknown as Record<string, unknown>) : null;

            const inheritedDocGuid = (wRec?.documentGuid as string | undefined) || (aRec?.documentGuid as string | undefined) || base?.documentGuid || null;
            const inheritedDocUrl = (wRec?.documentUrl as string | undefined) || (aRec?.documentUrl as string | undefined) || base?.documentUrl || getDocumentViewUrl(inheritedDocGuid);
            const inheritedPhotoGuid = (wRec?.photoGuid as string | undefined) || (aRec?.photoGuid as string | undefined) || base?.photoGuid || null;
            const inheritedPhotoBindingId = (wRec?.photoBindingId as number | undefined) || (aRec?.photoBindingId as number | undefined) || base?.photoBindingId || null;
            const inheritedDocBindingId = (wRec?.documentBindingId as number | undefined) || (aRec?.documentBindingId as number | undefined) || base?.documentBindingId || null;
            const inheritedRemark = (wRec?.remark as string | undefined) || (aRec?.remark as string | undefined) || base?.remark || null;
            const inheritedIntValue = wRec?.intValue != null ? Number(wRec.intValue) : (aRec?.intValue != null ? Number(aRec.intValue) : (base?.intValue != null ? Number(base.intValue) : null));
            const inheritedDecimalValue = wRec?.decimalValue != null ? Number(wRec.decimalValue) : (aRec?.decimalValue != null ? Number(aRec.decimalValue) : (base?.decimalValue != null ? Number(base.decimalValue) : null));
            const inheritedTextValue = (wRec?.textValue as string | undefined) || (aRec?.textValue as string | undefined) || base?.textValue || null;
            const inheritedDateValue = (wRec?.dateValue as string | undefined) || (aRec?.dateValue as string | undefined) || base?.dateValue || null;

            const isInheritedFromWing = level === 'Unit' && Boolean(validWingRecord || (base?.isInherited && base?.inheritanceLevel === 'Wing'));
            const isInheritedFromApt = Boolean(validApartmentRecord || (base?.isInherited && base?.inheritanceLevel === 'Apartment'));
            const isInherited = isInheritedFromWing || isInheritedFromApt;
            const resolvedInheritanceLevel = isInheritedFromWing ? 'Wing' : (isInheritedFromApt ? 'Apartment' : 'Self');
            const resolvedInheritedFrom = isInherited ? resolvedInheritanceLevel : null;
            const bitValue = Boolean((isInheritedFromWing && wRec && wRec.bitValue !== false) || (isInheritedFromApt && aRec && aRec.bitValue !== false) || (base?.bitValue && base?.isInherited));

            result[attrId] = {
                ...base,
                id: null,
                bitValue,
                intValue: inheritedIntValue,
                decimalValue: inheritedDecimalValue,
                textValue: inheritedTextValue,
                dateValue: inheritedDateValue,
                documentBindingId: inheritedDocBindingId,
                documentGuid: inheritedDocGuid,
                fileName: (wRec?.fileName as string | undefined) || (aRec?.fileName as string | undefined) || base?.fileName || undefined,
                documentUrl: inheritedDocUrl,
                photoBindingId: inheritedPhotoBindingId,
                photoGuid: inheritedPhotoGuid,
                remark: inheritedRemark,
                entityType: isInheritedFromWing ? 'W' : (isInheritedFromApt ? 'S' : (level === 'Wing' ? 'W' : 'P')),
                propertyId: editingUnitId || null,
                isInherited,
                inheritanceLevel: resolvedInheritanceLevel,
                inheritedFrom: resolvedInheritedFrom,
                isCommonAreaAttribute: Boolean(master?.isCommonAreaAttribute ?? base?.isCommonAreaAttribute),
                isOverridden: false,
            };
        }
    });

    return result;
}

export const useSocialFormState = (
    initialSocialData: PropertySocialInfoResponseDto | null,
    masterAttributes?: SocialAttribute[],
    options?: {
        level?: 'Apartment' | 'Wing' | 'Unit';
        savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
        editingUnitId?: number | null;
        wingDetailId?: string | number | null;
        isSociety?: boolean;
    }
) => {
    const optionsLevel = options?.level;
    const savedPropertyDetails = options?.savedPropertyDetails;
    const editingUnitId = options?.editingUnitId;
    const wingDetailId = options?.wingDetailId;
    const isSociety = options?.isSociety;

    const buildInitialData = useCallback(() => {
        return buildUnitSocialState(
            initialSocialData,
            masterAttributes,
            savedPropertyDetails,
            editingUnitId,
            optionsLevel,
            wingDetailId ? Number(wingDetailId) : null,
            isSociety
        );
    }, [initialSocialData, masterAttributes, savedPropertyDetails, editingUnitId, optionsLevel, wingDetailId, isSociety]);

    const [savedFlatData, setSavedFlatData] = useState<Record<number, FlatSocialAttributeState>>(() => buildInitialData());

    const [formState, setFormState] = useState<{
        data: Record<number, FlatSocialAttributeState>;
        errors: Record<number, string>;
    }>(() => ({
        data: buildInitialData(),
        errors: {}
    }));

    const hasChanges = useMemo(() => {
        return hasSocialChangesComparedToInitial(formState.data, savedFlatData);
    }, [formState.data, savedFlatData]);

    const editingUnitIdRef = useRef(options?.editingUnitId);
    const levelRef = useRef(options?.level);
    const wingDetailIdRef = useRef(options?.wingDetailId);

    useEffect(() => {
        if (
            options?.editingUnitId !== editingUnitIdRef.current ||
            options?.level !== levelRef.current ||
            options?.wingDetailId !== wingDetailIdRef.current
        ) {
            editingUnitIdRef.current = options?.editingUnitId;
            levelRef.current = options?.level;
            wingDetailIdRef.current = options?.wingDetailId;
            const nextInitial = buildInitialData();
            setSavedFlatData(nextInitial);
            setFormState({
                data: nextInitial,
                errors: {}
            });
        }
    }, [options?.editingUnitId, options?.level, options?.wingDetailId, buildInitialData]);

    const resetWithFreshData = useCallback((freshData?: PropertySocialInfoResponseDto | null) => {
        setFormState((prev) => {
            const nextData = { ...prev.data };
            const freshMap = freshData?.socialAttributes && freshData.socialAttributes.length > 0
                ? flattenAttributes(freshData.socialAttributes)
                : {};

            Object.keys(nextData).forEach((k) => {
                const id = Number(k);
                const currentItem = nextData[id];
                if (!currentItem) return;
                const freshItem = freshMap[id];

                nextData[id] = {
                    ...currentItem,
                    id: freshItem?.id ?? currentItem.id,
                    bitValue: freshItem ? (freshItem.bitValue ?? currentItem.bitValue) : currentItem.bitValue,
                    intValue: freshItem ? (freshItem.intValue ?? currentItem.intValue) : currentItem.intValue,
                    decimalValue: freshItem ? (freshItem.decimalValue ?? currentItem.decimalValue) : currentItem.decimalValue,
                    textValue: freshItem ? (freshItem.textValue ?? currentItem.textValue) : currentItem.textValue,
                    dateValue: freshItem ? (freshItem.dateValue ?? currentItem.dateValue) : currentItem.dateValue,
                    remark: freshItem ? (freshItem.remark ?? currentItem.remark) : currentItem.remark,
                    documentBindingId: freshItem?.documentBindingId || currentItem.documentBindingId || null,
                    documentGuid: freshItem?.documentGuid || (currentItem.documentGuid === "pending" ? null : currentItem.documentGuid),
                    documentUrl: freshItem?.documentUrl || currentItem.documentUrl || (freshItem?.documentGuid ? `/api/documents/${encodeURIComponent(freshItem.documentGuid)}/view` : null),
                    photoBindingId: freshItem?.photoBindingId || currentItem.photoBindingId || null,
                    photoGuid: freshItem?.photoGuid || (currentItem.photoGuid === "pending" ? null : currentItem.photoGuid),
                    fileName: freshItem?.fileName || currentItem.fileName || null,
                    pendingFile: undefined,
                    isOverridden: false,
                };
            });

            setSavedFlatData(nextData);
            return {
                data: nextData,
                errors: {}
            };
        });
    }, []);

    const clearPendingFiles = useCallback(() => {
        setFormState((prev) => {
            const nextData = { ...prev.data };
            Object.keys(nextData).forEach((k) => {
                const id = Number(k);
                const item = nextData[id];
                if (item && (item.pendingFile || item.documentGuid === "pending")) {
                    nextData[id] = {
                        ...item,
                        pendingFile: undefined,
                        documentGuid: item.documentGuid === "pending" ? null : item.documentGuid,
                        isOverridden: false,
                    };
                }
            });
            setSavedFlatData(nextData);
            return {
                data: nextData,
                errors: {}
            };
        });
    }, []);

    const handleInputChange = useCallback((
        attributeId: number,
        field: keyof FlatSocialAttributeState,
        value: string | number | boolean | null | undefined
    ) => {
        setFormState((prev) => {
            const nextData = { ...prev.data };
            const currentAttr = nextData[attributeId];
            if (!currentAttr) return prev;

            const isOverridden = currentAttr.isInherited ? true : currentAttr.isOverridden;
            nextData[attributeId] = { ...currentAttr, [field]: value, isOverridden };

            // When user enters data on an attribute or child, automatically activate bitValue: true
            const findAndEnableRoot = (item: FlatSocialAttributeState) => {
                if (item.parentAttributeId && nextData[item.parentAttributeId]) {
                    const parent = nextData[item.parentAttributeId]!;
                    if (parent.bitValue !== true) {
                        nextData[parent.socialAttributeId] = {
                            ...parent,
                            bitValue: true,
                            isOverridden: parent.isInherited ? true : parent.isOverridden
                        };
                    }
                    findAndEnableRoot(parent);
                } else if (!item.parentAttributeId && (item.dataType || '').toUpperCase() === 'BIT' && field !== 'bitValue') {
                    if (item.bitValue !== true && value !== null && value !== undefined && String(value).trim() !== '') {
                        nextData[item.socialAttributeId] = {
                            ...item,
                            bitValue: true,
                            isOverridden: item.isInherited ? true : item.isOverridden
                        };
                    }
                }
            };
            findAndEnableRoot(currentAttr);
            
            const nextErrors = { ...prev.errors };
            delete nextErrors[attributeId];

            return {
                data: nextData,
                errors: nextErrors
            };
        });
    }, []);

    const handleToggleEnabled = useCallback((attributeId: number, checked: boolean) => {
        setFormState((prev) => {
            const nextData = { ...prev.data };
            const currentAttr = nextData[attributeId];
            if (!currentAttr) return prev;

            const isOverridden = currentAttr.isInherited ? true : currentAttr.isOverridden;
            const nextErrors = { ...prev.errors };
            delete nextErrors[attributeId];

            if (!checked) {
                const resetAttributeData = (attr: FlatSocialAttributeState): FlatSocialAttributeState => ({
                    ...attr,
                    bitValue: false,
                    intValue: null,
                    decimalValue: null,
                    textValue: null,
                    dateValue: null,
                    documentBindingId: null,
                    documentGuid: null,
                    documentUrl: null,
                    photoBindingId: null,
                    photoGuid: null,
                    uploadedGuid: undefined,
                    fileName: null,
                    pendingFile: undefined,
                    remark: null,
                    isOverridden: false
                });

                // Find root parent so the entire connected family is toggled off and reset in sync
                let rootId = attributeId;
                const visitedParents = new Set<number>();
                while (nextData[rootId]?.parentAttributeId && !visitedParents.has(rootId)) {
                    visitedParents.add(rootId);
                    rootId = nextData[rootId]!.parentAttributeId!;
                }

                if (nextData[rootId]) {
                    delete nextErrors[rootId];
                    nextData[rootId] = resetAttributeData(nextData[rootId]!);
                }

                const resetChildren = (parentId: number, visited = new Set<number>()) => {
                    if (visited.has(parentId)) return;
                    visited.add(parentId);

                    Object.values(nextData).forEach((attr) => {
                        if (attr.parentAttributeId === parentId) {
                            delete nextErrors[attr.socialAttributeId];
                            nextData[attr.socialAttributeId] = resetAttributeData(attr);
                            resetChildren(attr.socialAttributeId, visited);
                        }
                    });
                };
                resetChildren(rootId);
            } else {
                nextData[attributeId] = { ...currentAttr, bitValue: checked, isOverridden };
                // If a child is toggled on, ensure its parent is also enabled (bitValue: true)
                if (currentAttr.parentAttributeId && nextData[currentAttr.parentAttributeId]) {
                    nextData[currentAttr.parentAttributeId] = {
                        ...nextData[currentAttr.parentAttributeId]!,
                        bitValue: true,
                        isOverridden: nextData[currentAttr.parentAttributeId]!.isInherited ? true : nextData[currentAttr.parentAttributeId]!.isOverridden,
                    };
                }
            }

            return {
                data: nextData,
                errors: nextErrors
            };
        });
    }, []);

    return {
        socialData: formState.data,
        validationErrors: formState.errors,
        setFormState,
        hasChanges,
        initialFlatData: savedFlatData,
        setSavedFlatData,
        handleInputChange,
        handleToggleEnabled,
        resetWithFreshData,
        clearPendingFiles
    };
};
