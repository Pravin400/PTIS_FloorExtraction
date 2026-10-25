"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useLoading } from "@/hooks/useLoading";
import {
    updateDiscountDetailsAction,
    deletePropertySocialDetailsByHierarchyAction,
} from "@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Discount/discount-actions";
import { DiscountState, DiscountAttributeState, PropertyDiscountInfoResponseDto } from "@/types/discount.types";
import { useTranslations } from "next-intl";
import { 
    mapApiToDiscountState, 
    mapDiscountStateToApi, 
    hasDiscountChangesComparedToInitial,
    buildUnitDiscountState 
} from "@/lib/utils/discount-helpers";
import { validateDiscountForm, DiscountFieldErrors } from "@/lib/utils/validateDiscountForm";
import { SocialAttribute } from "@/types/social-attribute.types";
import { DeletePropertySocialDetailsByHierarchyParams, PropertySocialDetailsDto } from "@/types/property-social-details.types";

export const useDiscountForm = (
    initialDiscountData: PropertyDiscountInfoResponseDto | null,
    propertyId: string,
    masterAttributes?: SocialAttribute[],
    options?: {
        level?: 'Apartment' | 'Wing' | 'Unit';
        societyDetailId?: string | null;
        wingDetailId?: string | null;
        propertyIds?: string;
        isSociety?: boolean;
        selectedUnitCount?: number;
        totalUnitCount?: number;
        savedPropertyDetails?: PropertySocialDetailsDto[];
        editingUnitId?: number | null;
    }
) => {
    const t = useTranslations('quickDataEntry');
    const { isLoading: isSaving, startLoading: startSaveLoading, stopLoading: stopSaveLoading } = useLoading(false);
    const { isLoading: isDeleting, startLoading: startDeleteLoading, stopLoading: stopDeleteLoading } = useLoading(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
    const [fieldErrors, setFieldErrors] = useState<Record<number, DiscountFieldErrors>>({});
    const [incompleteDiscounts, setIncompleteDiscounts] = useState<{ id: number; name: string }[]>([]);
    const params = useParams();
    const locale = params.locale as string;

    const optionsLevel = options?.level;
    const savedPropertyDetails = options?.savedPropertyDetails;
    const editingUnitId = options?.editingUnitId;
    const wingDetailId = options?.wingDetailId;
    const societyDetailId = options?.societyDetailId;
    const isSociety = options?.isSociety;
    const propertyIds = options?.propertyIds;

    const initialMappedState = useMemo(() => {
        const base = mapApiToDiscountState(initialDiscountData, masterAttributes, optionsLevel);
        return buildUnitDiscountState(
            masterAttributes,
            base,
            savedPropertyDetails,
            editingUnitId,
            optionsLevel,
            wingDetailId ? Number(wingDetailId) : null,
            options?.isSociety
        );
    }, [initialDiscountData, masterAttributes, optionsLevel, savedPropertyDetails, editingUnitId, wingDetailId, options?.isSociety]);

    const [savedDiscountState, setSavedDiscountState] = useState<DiscountState>(() => initialMappedState);
    const [discountData, setDiscountData] = useState<DiscountState>(() => initialMappedState);

    const hasChanges = useMemo(() => {
        return hasDiscountChangesComparedToInitial(discountData, savedDiscountState);
    }, [discountData, savedDiscountState]);

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
            setSavedDiscountState(initialMappedState);
            setDiscountData(initialMappedState);
            setHasSubmitted(false);
            setValidationErrors({});
            setFieldErrors({});
            setIncompleteDiscounts([]);
        }
    }, [options?.editingUnitId, options?.level, options?.wingDetailId, initialMappedState]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            (window as unknown as { __discountFormHasChanges?: boolean }).__discountFormHasChanges = hasChanges;
        }
        return () => {
            if (typeof window !== "undefined") {
                (window as unknown as { __discountFormHasChanges?: boolean }).__discountFormHasChanges = false;
            }
        };
    }, [hasChanges]);

    const clearError = useCallback((id: number) => {
        setValidationErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
        setFieldErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
        setIncompleteDiscounts((prev) => prev.filter((d) => d.id !== id));
    }, []);

    const handleToggleEnabled = useCallback((id: number, checked: boolean) => {
        setHasSubmitted(false);
        setDiscountData((prev) => {
            const item = prev[id];
            if (!item) return prev;
            const isBitType = item.dataType?.toUpperCase() === "BIT";
            const isOverridden = item.isInherited ? true : item.isOverridden;

            if (!checked) {
                const resetAttribute = (attr: DiscountAttributeState): DiscountAttributeState => ({
                    ...attr,
                    enabled: false,
                    bitValue: attr.dataType?.toUpperCase() === "BIT" ? false : attr.bitValue,
                    pendingFile: undefined,
                    documentGuid: null,
                    documentBindingId: null,
                    documentUrl: null,
                    fileName: undefined,
                    intValue: null,
                    decimalValue: null,
                    textValue: null,
                    dateValue: null,
                    remark: "",
                    isOverridden: false
                });

                const nextData: DiscountState = {
                    ...prev,
                    [id]: resetAttribute(item)
                };

                const resetChildren = (parentId: number) => {
                    Object.values(nextData).forEach((child) => {
                        if (child.parentAttributeId === parentId) {
                            nextData[child.id] = resetAttribute(child);
                            clearError(child.id);
                            resetChildren(child.id);
                        }
                    });
                };
                resetChildren(id);

                return nextData;
            }

            return {
                ...prev,
                [id]: {
                    ...item,
                    enabled: checked,
                    bitValue: isBitType ? checked : item.bitValue,
                    isOverridden
                }
            };
        });
        clearError(id);
    }, [clearError]);

    const handleInputChange = useCallback((
        id: number,
        field: "intValue" | "decimalValue" | "textValue" | "dateValue" | "remark" | "bitValue",
        value: string | number | boolean | null
    ) => {
        setDiscountData((prev) => {
            const item = prev[id];
            if (!item) return prev;

            const isBitType = (item.dataType || "").toUpperCase() === "BIT";
            const updatedBitValue = field === "bitValue" ? Boolean(value) : (item.bitValue ?? false);
            const updatedEnabled = isBitType ? Boolean(updatedBitValue) : true;

            const updatedItem: DiscountAttributeState = {
                ...item,
                [field]: value,
                enabled: updatedEnabled,
                bitValue: isBitType ? updatedBitValue : item.bitValue,
            };

            const initialItem = savedDiscountState[id];
            let isOverridden = item.isOverridden;
            if (item.isInherited) {
                const hasAnyOverride = Boolean(
                    updatedItem.pendingFile !== undefined ||
                    (updatedItem.documentGuid ?? null) !== (initialItem?.documentGuid ?? null) ||
                    (updatedItem.documentBindingId ?? null) !== (initialItem?.documentBindingId ?? null) ||
                    (updatedItem.remark ?? "") !== (initialItem?.remark ?? "") ||
                    String(updatedItem.intValue ?? "") !== String(initialItem?.intValue ?? "") ||
                    String(updatedItem.decimalValue ?? "") !== String(initialItem?.decimalValue ?? "") ||
                    (updatedItem.textValue ?? "") !== (initialItem?.textValue ?? "") ||
                    (updatedItem.dateValue ?? "") !== (initialItem?.dateValue ?? "") ||
                    (updatedItem.enabled ?? false) !== (initialItem?.enabled ?? false) ||
                    (updatedItem.bitValue ?? false) !== (initialItem?.bitValue ?? false)
                );
                isOverridden = hasAnyOverride;
            }

            const nextData: DiscountState = {
                ...prev,
                [id]: {
                    ...updatedItem,
                    isOverridden
                }
            };

            // If updating a child attribute, automatically activate parent
            const findAndEnableRoot = (curr: DiscountAttributeState) => {
                if (curr.parentAttributeId && nextData[curr.parentAttributeId]) {
                    const parent = nextData[curr.parentAttributeId]!;
                    const isParentBit = (parent.dataType || "").toUpperCase() === "BIT";
                    const isParentActive = isParentBit ? parent.bitValue === true : parent.enabled;
                    if (!isParentActive) {
                        nextData[parent.id] = {
                            ...parent,
                            enabled: true,
                            bitValue: isParentBit ? true : parent.bitValue,
                            isOverridden: parent.isInherited ? true : parent.isOverridden
                        };
                    }
                    findAndEnableRoot(parent);
                }
            };
            findAndEnableRoot(item);

            return nextData;
        });
        clearError(id);
    }, [clearError, savedDiscountState]);

    const handleFileUpload = useCallback((id: number, file: File) => {
        if (file.size > 5 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
            toast.error(t("discount.uploadInvalidFile") || "Invalid file");
            return;
        }
        setDiscountData(prev => {
            const item = prev[id];
            if (!item) return prev;
            const isBitType = item.dataType.toUpperCase() === "BIT";
            const isActive = isBitType ? item.bitValue === true : item.enabled;
            if (!isActive) return prev;
            const isOverridden = item.isInherited ? true : item.isOverridden;
            return {
                ...prev,
                [id]: {
                    ...item,
                    pendingFile: file,
                    documentGuid: "pending",
                    fileName: file.name,
                    documentUrl: undefined,
                    isOverridden
                }
            };
        });
        clearError(id);
    }, [t, clearError]);

    const handleFileDelete = useCallback((id: number) => {
        setDiscountData(prev => {
            const item = prev[id];
            if (!item) return prev;

            const initialItem = savedDiscountState[id];

            // If user is discarding a pending file that was not yet saved:
            if (item.pendingFile !== undefined) {
                const updatedItem = {
                    ...item,
                    pendingFile: undefined,
                    documentGuid: initialItem?.documentGuid ?? null,
                    documentBindingId: initialItem?.documentBindingId ?? null,
                    documentUrl: initialItem?.documentUrl ?? null,
                    fileName: initialItem?.fileName,
                };

                // Check if any other fields are modified compared to initial
                let isOverridden = item.isOverridden;
                if (item.isInherited) {
                    const hasOtherChanges = Boolean(
                        (updatedItem.remark ?? "") !== (initialItem?.remark ?? "") ||
                        String(updatedItem.intValue ?? "") !== String(initialItem?.intValue ?? "") ||
                        String(updatedItem.decimalValue ?? "") !== String(initialItem?.decimalValue ?? "") ||
                        (updatedItem.textValue ?? "") !== (initialItem?.textValue ?? "") ||
                        (updatedItem.dateValue ?? "") !== (initialItem?.dateValue ?? "") ||
                        (updatedItem.enabled ?? false) !== (initialItem?.enabled ?? false) ||
                        (updatedItem.bitValue ?? false) !== (initialItem?.bitValue ?? false)
                    );
                    isOverridden = hasOtherChanges;
                }

                return {
                    ...prev,
                    [id]: {
                        ...updatedItem,
                        isOverridden,
                    }
                };
            }

            const isOverridden = item.isInherited ? true : item.isOverridden;
            return {
                ...prev,
                [id]: {
                    ...item,
                    pendingFile: undefined,
                    documentGuid: null,
                    documentBindingId: null,
                    documentUrl: null,
                    fileName: undefined,
                    isOverridden
                }
            };
        });
        clearError(id);
        toast.success(t("discount.fileRemoved") || "File removed from form. Click Save Changes to apply.");
    }, [clearError, savedDiscountState, t]);

    const handleDeleteDiscount = useCallback(async (id: number) => {
        if (isSaving || isDeleting) return;
        const activeItem = discountData[id];
        if (!activeItem) return;

        const isDirectSavedOnBackend = typeof activeItem.propertySocialDetailId === "number" && activeItem.propertySocialDetailId > 0;
        const isInheritedSavedOnBackend = activeItem.isInherited || (savedPropertyDetails || []).some(p => {
            const attrId = p.socialAttributeId ?? p.id;
            return attrId === id && p.isActive !== false;
        });

        const wingId = wingDetailId ? Number(wingDetailId) : undefined;
        const wingRecord = (savedPropertyDetails || []).find((p) => {
            const attrId = p.socialAttributeId ?? p.id;
            return (
                attrId === id &&
                (p.entityType === 'W' || (p.wingDetailId && Number(p.wingDetailId) === Number(wingId) && (!p.propertyId || Number(p.propertyId) === 0))) &&
                p.isActive !== false
            );
        });

        const hasSavedOverrideInDb = Boolean(
            !activeItem.isInherited && (
                optionsLevel === 'Wing'
                    ? !!wingRecord
                    : optionsLevel === 'Unit'
                        ? typeof activeItem.propertySocialDetailId === "number" && activeItem.propertySocialDetailId > 0
                        : false
            )
        );

        const isSavedOnBackend = isDirectSavedOnBackend || isInheritedSavedOnBackend || hasSavedOverrideInDb;

        startDeleteLoading();
        try {
            let deletedScope: 'Wing' | 'Apartment' | 'Unit' = 'Unit';

            if (isSavedOnBackend) {
                const isSocietyMode = isSociety === true && !!societyDetailId;
                const socId = societyDetailId ? Number(societyDetailId) : undefined;

                const hierarchyParams: DeletePropertySocialDetailsByHierarchyParams = {
                    socialAttributeId: id,
                };

                const selectedIds = propertyIds
                    ? propertyIds.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0)
                    : [];
                const targetUnitId = editingUnitId || (selectedIds.length === 1 ? selectedIds[0] : (activeItem.propertyId || undefined));

                if (!isSocietyMode) {
                    // Individual Property
                    deletedScope = 'Unit';
                    hierarchyParams.entityType = 'P';
                    const pId = targetUnitId || (propertyId && !isNaN(Number(propertyId)) ? Number(propertyId) : undefined);
                    if (pId) {
                        hierarchyParams.propertyId = pId;
                        hierarchyParams.propertyIds = [pId];
                    }
                } else if (optionsLevel === 'Apartment') {
                    // Apartment level deletion: ONLY deletes Apartment level
                    deletedScope = 'Apartment';
                    hierarchyParams.entityType = 'S';
                    if (socId !== undefined) hierarchyParams.societyDetailsId = socId;
                } else if (optionsLevel === 'Wing') {
                    // Wing level deletion: ONLY deletes Wing level
                    if (!wingRecord && !hasSavedOverrideInDb) {
                        toast.error(t("discount.deleteDisabledInheritedApartment") || "This discount is inherited from Apartment level. It can only be deleted from Apartment level.");
                        stopDeleteLoading();
                        return;
                    }
                    deletedScope = 'Wing';
                    hierarchyParams.entityType = 'W';
                    if (socId !== undefined) hierarchyParams.societyDetailsId = socId;
                    if (wingId !== undefined) hierarchyParams.wingDetailId = wingId;
                } else {
                    // Unit level deletion: ONLY deletes direct applied Unit records
                    if (!isDirectSavedOnBackend && !hasSavedOverrideInDb) {
                        const origin = (activeItem.inheritedFrom || '').toUpperCase();
                        const msgKey = origin === 'WING' ? 'discount.deleteDisabledInheritedWing' : 'discount.deleteDisabledInheritedApartment';
                        const fallback = origin === 'WING'
                            ? "This discount is inherited from Wing level. It can only be deleted from Wing level."
                            : "This discount is inherited from Apartment level. It can only be deleted from Apartment level.";
                        toast.error(t(msgKey) || fallback);
                        stopDeleteLoading();
                        return;
                    }
                    deletedScope = 'Unit';
                    hierarchyParams.entityType = 'P';
                    if (socId !== undefined) hierarchyParams.societyDetailsId = socId;
                    if (wingId !== undefined) hierarchyParams.wingDetailId = wingId;
                    if (selectedIds.length > 0) {
                        hierarchyParams.propertyIds = selectedIds;
                        if (selectedIds.length === 1) hierarchyParams.propertyId = selectedIds[0];
                    } else if (targetUnitId) {
                        hierarchyParams.propertyId = targetUnitId;
                        hierarchyParams.propertyIds = [targetUnitId];
                    } else if (propertyId && !isNaN(Number(propertyId))) {
                        hierarchyParams.propertyId = Number(propertyId);
                        hierarchyParams.propertyIds = [Number(propertyId)];
                    }
                }

                const response = await deletePropertySocialDetailsByHierarchyAction(
                    hierarchyParams,
                    propertyId,
                    locale
                );

                if (!response.success) {
                    toast.error(response.error || "Failed to delete discount details");
                    return;
                }
            }

            // Remove deleted record from savedPropertyDetails cache so subsequent operations don't resurrect it
            if (savedPropertyDetails && Array.isArray(savedPropertyDetails)) {
                const targetUnitId = editingUnitId || (propertyIds ? Number(propertyIds.split(',')[0]) : undefined);
                const wingId = wingDetailId ? Number(wingDetailId) : undefined;
                const idx = savedPropertyDetails.findIndex(p => {
                    const attrId = p.socialAttributeId ?? p.id;
                    if (attrId !== id) return false;
                    if (deletedScope === 'Apartment') {
                        return p.entityType === 'S' || (!p.wingDetailId && !p.propertyId);
                    }
                    if (deletedScope === 'Wing') {
                        return p.entityType === 'W' || (p.wingDetailId && Number(p.wingDetailId) === Number(wingId) && (!p.propertyId || Number(p.propertyId) === 0));
                    }
                    if (deletedScope === 'Unit') {
                        return p.entityType === 'P' || (targetUnitId && Number(p.propertyId) === Number(targetUnitId));
                    }
                    return true;
                });
                if (idx !== -1) {
                    savedPropertyDetails.splice(idx, 1);
                }
            }

            // Revert or clear local state
            setDiscountData(prev => {
                const item = prev[id];
                if (!item) return prev;

                const wingId = wingDetailId ? Number(wingDetailId) : undefined;

                // Find wing record in savedPropertyDetails if available (only if wing was NOT what got deleted)
                const wingRecord = deletedScope !== 'Wing' ? (savedPropertyDetails || []).find((p) => {
                    const attrId = p.socialAttributeId ?? p.id;
                    return (
                        attrId === id &&
                        (p.entityType === 'W' || (p.wingDetailId && Number(p.wingDetailId) === Number(wingId) && (!p.propertyId || Number(p.propertyId) === 0))) &&
                        p.isActive !== false
                    );
                }) : undefined;

                // Find apartment record in savedPropertyDetails if available (only if apartment was NOT what got deleted)
                const apartmentRecord = deletedScope !== 'Apartment' ? (savedPropertyDetails || []).find((p) => {
                    const attrId = p.socialAttributeId ?? p.id;
                    return (
                        attrId === id &&
                        (p.entityType === 'S' || (!p.wingDetailId && !p.propertyId)) &&
                        p.isActive !== false
                    );
                }) : undefined;

                let nextItem: DiscountAttributeState;

                if (optionsLevel === 'Unit' && wingRecord) {
                    nextItem = {
                        ...item,
                        pendingFile: undefined,
                        documentGuid: wingRecord.documentGuid || null,
                        documentBindingId: wingRecord.documentBindingId || null,
                        documentUrl: wingRecord.documentUrl || (wingRecord.documentGuid ? `/api/documents/${wingRecord.documentGuid}/view` : undefined),
                        fileName: wingRecord.fileName || undefined,
                        intValue: wingRecord.intValue != null ? String(wingRecord.intValue) : null,
                        decimalValue: wingRecord.decimalValue != null ? String(wingRecord.decimalValue) : null,
                        textValue: wingRecord.textValue || null,
                        dateValue: wingRecord.dateValue ? String(wingRecord.dateValue).split("T")[0] : null,
                        remark: wingRecord.remark || "",
                        enabled: wingRecord.bitValue !== false,
                        bitValue: wingRecord.bitValue ?? true,
                        propertySocialDetailId: null,
                        propertyId: editingUnitId || item.propertyId || null,
                        entityType: 'W',
                        isInherited: true,
                        inheritanceLevel: 'Wing',
                        inheritedFrom: 'Wing',
                        isOverridden: false,
                    };
                } else if ((optionsLevel === 'Unit' || optionsLevel === 'Wing') && apartmentRecord) {
                    nextItem = {
                        ...item,
                        pendingFile: undefined,
                        documentGuid: apartmentRecord.documentGuid || null,
                        documentBindingId: apartmentRecord.documentBindingId || null,
                        documentUrl: apartmentRecord.documentUrl || (apartmentRecord.documentGuid ? `/api/documents/${apartmentRecord.documentGuid}/view` : undefined),
                        fileName: apartmentRecord.fileName || undefined,
                        intValue: apartmentRecord.intValue != null ? String(apartmentRecord.intValue) : null,
                        decimalValue: apartmentRecord.decimalValue != null ? String(apartmentRecord.decimalValue) : null,
                        textValue: apartmentRecord.textValue || null,
                        dateValue: apartmentRecord.dateValue ? String(apartmentRecord.dateValue).split("T")[0] : null,
                        remark: apartmentRecord.remark || "",
                        enabled: apartmentRecord.bitValue !== false,
                        bitValue: apartmentRecord.bitValue ?? true,
                        propertySocialDetailId: null,
                        propertyId: editingUnitId || item.propertyId || null,
                        entityType: 'S',
                        isInherited: true,
                        inheritanceLevel: 'Apartment',
                        inheritedFrom: 'Apartment',
                        isOverridden: false,
                    };
                } else {
                    nextItem = {
                        ...item,
                        pendingFile: undefined,
                        documentGuid: null,
                        documentBindingId: null,
                        documentUrl: null,
                        fileName: undefined,
                        intValue: null,
                        decimalValue: null,
                        textValue: null,
                        dateValue: null,
                        remark: "",
                        enabled: false,
                        bitValue: false,
                        propertySocialDetailId: null,
                        propertyId: editingUnitId || item.propertyId || null,
                        entityType: optionsLevel === 'Apartment' ? 'S' : optionsLevel === 'Wing' ? 'W' : 'P',
                        isInherited: false,
                        inheritanceLevel: 'Self',
                        inheritedFrom: null,
                        isOverridden: false,
                    };
                }

                const next = {
                    ...prev,
                    [id]: nextItem
                };
                setSavedDiscountState(next);
                return next;
            });
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent('ptis:discount-data-updated'));
                window.dispatchEvent(new CustomEvent('ptis:individual-top-section-updated'));
                window.dispatchEvent(new CustomEvent('ptis:apartment-top-section-updated'));
            }

            toast.success(t("discount.deleteSuccess") || "Discount and associated data deleted successfully!");
        } catch (_error) {
            toast.error("An error occurred while deleting the discount details");
        } finally {
            stopDeleteLoading();
        }
    }, [
        discountData,
        isSaving,
        isDeleting,
        propertyId,
        locale,
        optionsLevel,
        savedPropertyDetails,
        editingUnitId,
        wingDetailId,
        societyDetailId,
        isSociety,
        propertyIds,
        startDeleteLoading,
        stopDeleteLoading,
        t
    ]);

    const handleSave = async () => {
        if (isSaving || isDeleting) return { success: false, isValid: true };
        setHasSubmitted(true);
        try {
            const { isValid, errors, fieldErrors: validatedFieldErrors, incompleteDiscounts: invalidDiscounts } = validateDiscountForm(discountData, translateCallback);
            if (!isValid) {
                setValidationErrors(errors);
                setFieldErrors(validatedFieldErrors);
                setIncompleteDiscounts(invalidDiscounts);
                const firstIncomplete = invalidDiscounts[0];
                if (firstIncomplete) {
                    toast.error(t("discount.validation.incomplete", { name: firstIncomplete.name }) || `Please complete: ${firstIncomplete.name}`);
                }
                return { success: false, isValid: false, incompleteDiscounts: invalidDiscounts };
            }
        } catch (validationError: unknown) {
            console.error("Validation error:", validationError);
            const errorMsg = validationError instanceof Error 
                ? validationError.message 
                : "Validation failed. Please refresh and try again.";
            toast.error(t("discount.socialValidation.correctErrors") || errorMsg);
            return { success: false, isValid: false };
        }
        setHasSubmitted(false);
        setValidationErrors({});
        setFieldErrors({});
        setIncompleteDiscounts([]);
        startSaveLoading();

        try {
            const formData = new FormData();
            const payload = mapDiscountStateToApi(discountData);
            formData.append("discountAttributes", JSON.stringify(payload));

            if (options?.level) formData.append("level", options.level);
            if (options?.societyDetailId) formData.append("societyDetailId", options.societyDetailId);
            if (options?.wingDetailId) formData.append("wingDetailId", options.wingDetailId);
            if (options?.propertyIds) formData.append("propertyIds", options.propertyIds);
            if (options?.isSociety !== undefined) formData.append("isSociety", String(options.isSociety));
            if (options?.selectedUnitCount !== undefined) formData.append("selectedUnitCount", String(options.selectedUnitCount));
            if (options?.totalUnitCount !== undefined) formData.append("totalUnitCount", String(options.totalUnitCount));

            // Append pending files
            Object.values(discountData).forEach(item => {
                if (item.pendingFile) {
                    formData.append(`file_${item.id}`, item.pendingFile);
                }
            });

            const response = await updateDiscountDetailsAction(locale, propertyId, formData);
            if (response.success) {
                setDiscountData(prev => {
                    const next = { ...prev };
                    const freshMap = new Map((response.data?.discountAttributes || []).map(a => [a.id, a]));

                    Object.keys(next).forEach(k => {
                        const id = Number(k);
                        const item = next[id];
                        if (!item) return;
                        const fresh = freshMap.get(id);

                        next[id] = {
                            ...item,
                            propertySocialDetailId: fresh?.propertySocialDetailId || item.propertySocialDetailId,
                            documentBindingId: fresh?.documentBindingId || item.documentBindingId || null,
                            documentGuid: fresh?.documentGuid || (item.documentGuid === "pending" ? null : item.documentGuid),
                            documentUrl: fresh?.documentUrl || item.documentUrl || (fresh?.documentGuid ? `/api/documents/${encodeURIComponent(fresh.documentGuid)}/view` : null),
                            fileName: fresh?.fileName || item.fileName,
                            pendingFile: undefined,
                            isOverridden: false
                        };
                    });

                    setSavedDiscountState(next);
                    return next;
                });

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent('ptis:discount-data-updated'));
                    window.dispatchEvent(new CustomEvent('ptis:individual-top-section-updated'));
                    window.dispatchEvent(new CustomEvent('ptis:apartment-top-section-updated'));
                }

                toast.success(t("discount.saveSuccess") || "Discount details saved successfully!");
                return { success: true, isValid: true };
            }
            toast.error(response.error || t("discount.saveError") || "Failed to save");
            return { success: false, isValid: true };
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : String(error));
            return { success: false, isValid: true };
        } finally { stopSaveLoading(); }
    };

    const revertDiscount = useCallback((id: number) => {
        setDiscountData((prev) => {
            const initialItem = savedDiscountState[id];
            if (!initialItem) return prev;
            const hasDbValues = typeof initialItem.propertySocialDetailId === "number" && initialItem.propertySocialDetailId > 0;
            if (!hasDbValues) return prev;
            return {
                ...prev,
                [id]: { ...initialItem }
            };
        });
        setValidationErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
        setFieldErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
        setIncompleteDiscounts((prev) => prev.filter((d) => d.id !== id));
    }, [savedDiscountState]);

    const translateCallback = useCallback((key: string, params?: Record<string, string | number>) => {
        return t(key, params);
    }, [t]);

    const validationResult = useMemo(() => {
        try {
            return validateDiscountForm(discountData, translateCallback);
        } catch (_error) {
            return { isValid: false, errors: {}, fieldErrors: {}, incompleteDiscounts: [] };
        }
    }, [discountData, translateCallback]);

    const isFormValid = validationResult.isValid;

    const activeIncompleteDiscounts = useMemo(() => {
        if (!hasSubmitted) return [];
        return validationResult.incompleteDiscounts.length > 0
            ? validationResult.incompleteDiscounts
            : incompleteDiscounts;
    }, [hasSubmitted, validationResult.incompleteDiscounts, incompleteDiscounts]);

    const activeValidationErrors = useMemo(() => {
        if (hasSubmitted) {
            return { ...validationResult.errors, ...validationErrors };
        }
        const touchedErrors: Record<number, string> = { ...validationErrors };
        Object.entries(validationResult.errors).forEach(([idStr, errMsg]) => {
            const attrId = Number(idStr);
            const item = discountData[attrId];
            if (!item) return;
            const hasEnteredValue =
                (item.intValue !== null && item.intValue !== undefined && String(item.intValue).trim() !== '') ||
                (item.decimalValue !== null && item.decimalValue !== undefined && String(item.decimalValue).trim() !== '') ||
                (item.textValue !== null && item.textValue !== undefined && String(item.textValue).trim() !== '');

            const isRequiredMsg = errMsg.includes("required") || errMsg.includes("आवश्यक") || errMsg.includes("गरज");
            if (hasEnteredValue && !isRequiredMsg) {
                touchedErrors[attrId] = errMsg;
            }
        });
        return touchedErrors;
    }, [hasSubmitted, validationResult.errors, validationErrors, discountData]);

    const activeFieldErrors = useMemo(() => {
        if (hasSubmitted) {
            return { ...validationResult.fieldErrors, ...fieldErrors };
        }
        const touchedFieldErrors: Record<number, DiscountFieldErrors> = { ...fieldErrors };
        Object.entries(validationResult.fieldErrors).forEach(([idStr, errorsObj]) => {
            const attrId = Number(idStr);
            const item = discountData[attrId];
            if (!item) return;
            const hasEnteredValue =
                (item.intValue !== null && item.intValue !== undefined && String(item.intValue).trim() !== '') ||
                (item.decimalValue !== null && item.decimalValue !== undefined && String(item.decimalValue).trim() !== '') ||
                (item.textValue !== null && item.textValue !== undefined && String(item.textValue).trim() !== '');

            const isValReq = errorsObj.value && (errorsObj.value.includes("required") || errorsObj.value.includes("आवश्यक") || errorsObj.value.includes("गरज"));
            if (hasEnteredValue && !isValReq && errorsObj.value) {
                touchedFieldErrors[attrId] = {
                    ...touchedFieldErrors[attrId],
                    value: errorsObj.value
                };
            }
            if (item.remark && errorsObj.remark) {
                touchedFieldErrors[attrId] = {
                    ...touchedFieldErrors[attrId],
                    remark: errorsObj.remark
                };
            }
        });
        return touchedFieldErrors;
    }, [hasSubmitted, validationResult.fieldErrors, fieldErrors, discountData]);

    return { discountData, savedDiscountState, isSaving, isDeleting, hasChanges, isFormValid, validationErrors: activeValidationErrors, fieldErrors: activeFieldErrors, incompleteDiscounts: activeIncompleteDiscounts, handleToggleEnabled, handleInputChange, handleFileUpload, handleFileDelete, handleDeleteDiscount, handleSave, revertDiscount, t };
};
