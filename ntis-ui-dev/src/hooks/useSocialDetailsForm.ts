import { useMemo, useEffect, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useLoading } from "@/hooks/useLoading";
import { 
    upsertPropertySocialInfoAction,
    deletePropertySocialDetailsByHierarchyAction,
} from "@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Discount/social-actions";
import { PropertySocialInfoResponseDto, DeletePropertySocialDetailsByHierarchyParams, PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useTranslations } from "next-intl";
import {
    FlatSocialAttributeState,
    isAttributeEnabled,
    getLocalizedName,
    expandConnectedSocialAttributeIds,
} from "@/lib/utils/social-details";
import { validateSocialDetails } from "@/lib/validations/social-details.validation";
import { checkSocialRequiredFields } from "@/lib/validations/social-details.validation";
import { mapSocialStateToApi } from "@/lib/utils/social-guidelines";
import { useSocialFormState } from "./useSocialFormState";
import { useSocialPhotoUpload } from "./useSocialPhotoUpload";
import { getDocumentViewUrl } from "@/lib/utils/document-utils";

import { SocialAttribute } from "@/types/social-attribute.types";

export const useSocialDetailsForm = (
    initialSocialData: PropertySocialInfoResponseDto | null,
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
        savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
        editingUnitId?: number | null;
    }
) => {
    const t = useTranslations("quickDataEntry");
    const { isLoading: isSaving, startLoading: startSaveLoading, stopLoading: stopSaveLoading } = useLoading(false);
    const { isLoading: isDeleting, startLoading: startDeleteLoading, stopLoading: stopDeleteLoading } = useLoading(false);
    const params = useParams();
    const locale = params.locale as string;
    const { confirm } = useConfirm();

    const {
        socialData, validationErrors, setFormState,
        hasChanges, initialFlatData, setSavedFlatData, handleInputChange, handleToggleEnabled,
        resetWithFreshData, clearPendingFiles
    } = useSocialFormState(initialSocialData, masterAttributes, {
        level: options?.level,
        savedPropertyDetails: options?.savedPropertyDetails,
        editingUnitId: options?.editingUnitId,
        wingDetailId: options?.wingDetailId,
        isSociety: options?.isSociety,
    });

    const { handlePhotoUpload, handlePhotoDelete } = useSocialPhotoUpload(
        socialData, setFormState,
        t as unknown as { (key: string, values?: Record<string, string | number | Date>): string; has?: (key: string) => boolean; }
    );

    const [hasSubmitted, setHasSubmitted] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            (window as unknown as { __socialFormHasChanges?: boolean }).__socialFormHasChanges = hasChanges;
        }
        return () => {
            if (typeof window !== "undefined") {
                (window as unknown as { __socialFormHasChanges?: boolean }).__socialFormHasChanges = false;
            }
        };
    }, [hasChanges]);

    const currentScopeKey = `${options?.editingUnitId ?? ""}-${options?.level ?? ""}-${options?.wingDetailId ?? ""}`;
    const [prevScopeKey, setPrevScopeKey] = useState(currentScopeKey);

    if (currentScopeKey !== prevScopeKey) {
        setPrevScopeKey(currentScopeKey);
        setHasSubmitted(false);
    }

    const translateCallback = useCallback((key: string, params?: Record<string, string | number | Date>) => {
        return t(key, params);
    }, [t]);

    const liveValidationErrors = useMemo(() => {
        try {
            return validateSocialDetails(socialData, translateCallback);
        } catch (_error) {
            return {};
        }
    }, [socialData, translateCallback]);

    const isFormValid = useMemo(() => {
        return Object.keys(liveValidationErrors).length === 0;
    }, [liveValidationErrors]);

    const incompleteAttributes = useMemo(() => {
        if (!hasSubmitted) return [];
        const list: { id: number; name: string; code?: string }[] = [];
        const seen = new Set<number>();
        Object.keys(liveValidationErrors).forEach((idStr) => {
            const attrId = Number(idStr);
            const attr = socialData[attrId];
            if (!attr) return;
            const findRootParent = (item: FlatSocialAttributeState): FlatSocialAttributeState =>
                item.parentAttributeId && socialData[item.parentAttributeId]
                    ? findRootParent(socialData[item.parentAttributeId]!)
                    : item;
            const rootParent = findRootParent(attr);
            if (rootParent && !seen.has(rootParent.socialAttributeId)) {
                seen.add(rootParent.socialAttributeId);
                list.push({
                    id: rootParent.socialAttributeId,
                    name: getLocalizedName(rootParent.socialAttributeCode, rootParent.socialAttributeName, t),
                    code: rootParent.socialAttributeCode,
                });
            }
        });
        return list;
    }, [hasSubmitted, liveValidationErrors, socialData, t]);

    const activeValidationErrors = useMemo(() => {
        if (hasSubmitted) {
            return { ...liveValidationErrors, ...validationErrors };
        }
        // Before save attempt, only show format/range errors if user actively entered an invalid value (e.g. 0, negative, invalid text)
        // Never show "X is required" or "Photo is required" immediately when the user just toggles on an attribute!
        const touchedErrors: Record<number, string> = { ...validationErrors };
        Object.entries(liveValidationErrors).forEach(([idStr, errMsg]) => {
            const attrId = Number(idStr);
            const attr = socialData[attrId];
            if (!attr) return;
            const hasEnteredValue =
                (attr.intValue !== null && attr.intValue !== undefined && String(attr.intValue).trim() !== '') ||
                (attr.decimalValue !== null && attr.decimalValue !== undefined && String(attr.decimalValue).trim() !== '') ||
                (attr.textValue !== null && attr.textValue !== undefined && String(attr.textValue).trim() !== '');

            const isRequiredMsg = errMsg.includes("required") || errMsg.includes("आवश्यक") || errMsg.includes("गरज");
            if (hasEnteredValue && !isRequiredMsg) {
                touchedErrors[attrId] = errMsg;
            }
        });
        return touchedErrors;
    }, [hasSubmitted, liveValidationErrors, validationErrors, socialData]);

    const handleSave = async () => {
        if (isSaving || isDeleting) return { success: false, isValid: true };
        setHasSubmitted(true);
        const valErrors = validateSocialDetails(socialData, t);
        if (Object.keys(valErrors).length > 0) {
            setFormState((prev) => ({ ...prev, errors: valErrors }));
            toast.error(t("discount.socialValidation.correctErrors") || "Please correct errors before saving.");
            return { success: false, isValid: false, errors: valErrors };
        }
        setFormState((prev) => ({ ...prev, errors: {} }));
        setHasSubmitted(false);

        return new Promise<{ success: boolean; isValid: boolean; errors?: Record<number, string> }>((resolve) => {
            confirm({
                variant: "update",
                title: t("discount.socialConfirm.saveTitle") || "Save Social Details",
                description: t("discount.socialConfirm.saveDescription") || "Are you sure you want to save changes?",
                confirmText: t("discount.socialConfirm.confirmText") || "Yes, Save",
                cancelText: t("discount.socialConfirm.cancelText") || "No, Cancel",
                onConfirm: async () => {
                    startSaveLoading();
                    try {
                        const { socialAttributes, socialAttributeIdsToRemove } = mapSocialStateToApi(socialData, initialFlatData);
                        const hasPendingFiles = Object.values(socialData).some(item => !!item.pendingFile);

                        if (socialAttributes.length === 0 && socialAttributeIdsToRemove.length === 0 && !hasPendingFiles) {
                            toast.success(t("discount.socialConfirm.noChanges") || "No changes to save.");
                            resolve({ success: true, isValid: true });
                            return;
                        }

                        const formData = new FormData();
                        formData.append("socialAttributes", JSON.stringify(socialAttributes));
                        formData.append("socialAttributeIdsToRemove", JSON.stringify(socialAttributeIdsToRemove));
                        
                        if (options?.level) formData.append("level", options.level);
                        if (options?.societyDetailId) formData.append("societyDetailId", options.societyDetailId);
                        if (options?.wingDetailId) formData.append("wingDetailId", options.wingDetailId);
                        if (options?.propertyIds) formData.append("propertyIds", options.propertyIds);
                        if (options?.isSociety !== undefined) formData.append("isSociety", String(options.isSociety));
                        if (options?.selectedUnitCount !== undefined) formData.append("selectedUnitCount", String(options.selectedUnitCount));
                        if (options?.totalUnitCount !== undefined) formData.append("totalUnitCount", String(options.totalUnitCount));

                        // Append pending files
                        Object.values(socialData).forEach(item => {
                            if (item.pendingFile) {
                                formData.append(`file_${item.socialAttributeId}`, item.pendingFile);
                            }
                        });

                        const response = await upsertPropertySocialInfoAction(locale, propertyId, formData);
                        if (response.success) {
                            if (response.data) {
                                resetWithFreshData(response.data);
                            } else {
                                clearPendingFiles();
                            }
                            if (typeof window !== "undefined") {
                                window.dispatchEvent(new CustomEvent('ptis:social-data-updated'));
                                window.dispatchEvent(new CustomEvent('ptis:discount-data-updated'));
                                window.dispatchEvent(new CustomEvent('ptis:individual-top-section-updated'));
                                window.dispatchEvent(new CustomEvent('ptis:apartment-top-section-updated'));
                            }
                            toast.success(response.message || t("discount.socialConfirm.saveSuccess") || "Saved successfully!");
                            resolve({ success: true, isValid: true });
                        } else {
                            toast.error(response.error || t("discount.socialConfirm.saveError") || "Failed to save.");
                            resolve({ success: false, isValid: true });
                        }
                    } catch (error: unknown) {
                        toast.error(error instanceof Error ? error.message : String(error));
                        resolve({ success: false, isValid: true });
                    } finally { stopSaveLoading(); }
                },
                onCancel: () => resolve({ success: false, isValid: true })
            });
        });
    };

    const handleDeleteSocialDetail = useCallback(async (id: number) => {
        if (isSaving || isDeleting) return;
        const activeItem = socialData[id];
        if (!activeItem) return;

        // Expand to include all connected parent and children attributes so isActive and markedForDeletion stay in sync
        const familyIds = expandConnectedSocialAttributeIds([id], Object.values(socialData));

        const isDirectSavedOnBackend = familyIds.some(fId => typeof socialData[fId]?.id === "number" && (socialData[fId]?.id ?? 0) > 0);
        const isInheritedSavedOnBackend = familyIds.some(fId => {
            const item = socialData[fId];
            return item?.isInherited || (options?.savedPropertyDetails || []).some(p => {
                const attrId = 'socialAttributeId' in p && p.socialAttributeId != null ? Number(p.socialAttributeId) : Number(p.id);
                return attrId === fId && p.isActive !== false;
            });
        });

        const wingId = options?.wingDetailId ? Number(options.wingDetailId) : undefined;
        const wingRecord = (options?.savedPropertyDetails || []).find((p) => {
            const attrId = 'socialAttributeId' in p && p.socialAttributeId != null ? Number(p.socialAttributeId) : Number(p.id);
            const entityType = 'entityType' in p ? p.entityType : undefined;
            const rawPropId = 'propertyId' in p ? p.propertyId : undefined;
            const itemPropId = rawPropId != null ? Number(rawPropId) : undefined;
            const rawWingId = 'wingDetailId' in p ? p.wingDetailId : undefined;
            const itemWingId = rawWingId != null ? Number(rawWingId) : undefined;
            const isActive = 'isActive' in p ? p.isActive : true;

            return (
                familyIds.includes(attrId) &&
                (entityType === 'W' || (itemWingId && Number(itemWingId) === Number(wingId) && (!itemPropId || itemPropId === 0))) &&
                isActive !== false
            );
        });

        const hasSavedOverrideInDb = Boolean(
            !activeItem.isInherited && (
                options?.level === 'Wing'
                    ? !!wingRecord
                    : options?.level === 'Unit'
                        ? typeof activeItem.id === "number" && activeItem.id > 0
                        : false
            )
        );

        const isSavedOnBackend = isDirectSavedOnBackend || isInheritedSavedOnBackend || hasSavedOverrideInDb;

        startDeleteLoading();
        try {
            let deletedScope: 'Wing' | 'Apartment' | 'Unit' = 'Unit';

            if (isSavedOnBackend) {
                const isSocietyMode = options?.isSociety === true && !!options?.societyDetailId;
                const socId = options?.societyDetailId ? Number(options.societyDetailId) : undefined;

                const hierarchyParams: DeletePropertySocialDetailsByHierarchyParams = {
                    socialAttributeId: id,
                };

                const selectedIds = options?.propertyIds
                    ? options.propertyIds.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0)
                    : [];
                const targetUnitId = options?.editingUnitId || (selectedIds.length === 1 ? selectedIds[0] : (activeItem.propertyId || undefined));

                if (!isSocietyMode) {
                    // Individual Property
                    deletedScope = 'Unit';
                    hierarchyParams.entityType = 'P';
                    const pId = targetUnitId || (propertyId && !isNaN(Number(propertyId)) ? Number(propertyId) : undefined);
                    if (pId) {
                        hierarchyParams.propertyId = pId;
                        hierarchyParams.propertyIds = [pId];
                    }
                } else if (options?.level === 'Apartment') {
                    // Apartment level deletion: ONLY deletes Apartment level
                    deletedScope = 'Apartment';
                    hierarchyParams.entityType = 'S';
                    if (socId !== undefined) hierarchyParams.societyDetailsId = socId;
                } else if (options?.level === 'Wing') {
                    // Wing level deletion: ONLY deletes Wing level
                    if (!wingRecord && !hasSavedOverrideInDb) {
                        toast.error(t("discount.deleteDisabledInheritedApartmentSocial") || "This detail is inherited from Apartment level. It can only be deleted from Apartment level.");
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
                        const msgKey = origin === 'WING' ? 'discount.deleteDisabledInheritedWingSocial' : 'discount.deleteDisabledInheritedApartmentSocial';
                        const fallback = origin === 'WING'
                            ? "This detail is inherited from Wing level. It can only be deleted from Wing level."
                            : "This detail is inherited from Apartment level. It can only be deleted from Apartment level.";
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
                    toast.error(response.error || "Failed to delete social details");
                    return;
                }
            }

            // Remove deleted records from savedPropertyDetails cache so subsequent operations don't resurrect them
            if (options?.savedPropertyDetails && Array.isArray(options.savedPropertyDetails)) {
                const targetUnitId = options?.editingUnitId || (options?.propertyIds ? Number(options.propertyIds.split(',')[0]) : undefined);
                const wingId = options?.wingDetailId ? Number(options.wingDetailId) : undefined;
                for (let i = options.savedPropertyDetails.length - 1; i >= 0; i--) {
                    const p = options.savedPropertyDetails[i];
                    const attrId = 'socialAttributeId' in p && p.socialAttributeId != null ? Number(p.socialAttributeId) : Number(p.id);
                    if (!familyIds.includes(attrId)) continue;
                    const entityType = 'entityType' in p ? p.entityType : undefined;
                    const rawPropId = 'propertyId' in p ? p.propertyId : undefined;
                    const itemPropId = rawPropId != null ? Number(rawPropId) : undefined;
                    const rawWingId = 'wingDetailId' in p ? p.wingDetailId : undefined;
                    const itemWingId = rawWingId != null ? Number(rawWingId) : undefined;

                    let shouldRemove = false;
                    if (deletedScope === 'Apartment') {
                        shouldRemove = entityType === 'S' || (!itemWingId && !itemPropId);
                    } else if (deletedScope === 'Wing') {
                        shouldRemove = entityType === 'W' || (Boolean(itemWingId) && Number(itemWingId) === Number(wingId) && (!itemPropId || itemPropId === 0));
                    } else if (deletedScope === 'Unit') {
                        shouldRemove = entityType === 'P' || (Boolean(targetUnitId) && Number(itemPropId) === Number(targetUnitId));
                    } else {
                        shouldRemove = true;
                    }
                    if (shouldRemove) {
                        options.savedPropertyDetails.splice(i, 1);
                    }
                }
            }

            // Revert or clear local state recursively for this attribute and its children
            setFormState(prev => {
                const nextData = { ...prev.data };
                const nextErrors = { ...prev.errors };
                const wingId = options?.wingDetailId ? Number(options.wingDetailId) : undefined;

                const revertOrClearAttributeAndChildren = (attrs: Record<number, FlatSocialAttributeState>, targetId: number) => {
                    const item = attrs[targetId];
                    if (!item) return;

                    // Find wing record in savedPropertyDetails if available (only if wing was NOT what got deleted)
                    const wingRecord = deletedScope !== 'Wing' ? (options?.savedPropertyDetails || []).find((p) => {
                        const attrId = 'socialAttributeId' in p && p.socialAttributeId != null ? Number(p.socialAttributeId) : Number(p.id);
                        const entityType = 'entityType' in p ? p.entityType : undefined;
                        const rawPropId = 'propertyId' in p ? p.propertyId : undefined;
                        const itemPropId = rawPropId != null ? Number(rawPropId) : undefined;
                        const rawWingId = 'wingDetailId' in p ? p.wingDetailId : undefined;
                        const itemWingId = rawWingId != null ? Number(rawWingId) : undefined;
                        const isActive = 'isActive' in p ? p.isActive : true;

                        return (
                            attrId === targetId &&
                            (entityType === 'W' || (itemWingId && Number(itemWingId) === Number(wingId) && (!itemPropId || itemPropId === 0))) &&
                            isActive !== false
                        );
                    }) : undefined;

                    // Find apartment record in savedPropertyDetails if available (only if apartment was NOT what got deleted)
                    const apartmentRecord = deletedScope !== 'Apartment' ? (options?.savedPropertyDetails || []).find((p) => {
                        const attrId = 'socialAttributeId' in p && p.socialAttributeId != null ? Number(p.socialAttributeId) : Number(p.id);
                        const entityType = 'entityType' in p ? p.entityType : undefined;
                        const rawPropId = 'propertyId' in p ? p.propertyId : undefined;
                        const itemPropId = rawPropId != null ? Number(rawPropId) : undefined;
                        const rawWingId = 'wingDetailId' in p ? p.wingDetailId : undefined;
                        const itemWingId = rawWingId != null ? Number(rawWingId) : undefined;
                        const isActive = 'isActive' in p ? p.isActive : true;

                        return (
                            attrId === targetId &&
                            (entityType === 'S' || (!itemWingId && !itemPropId)) &&
                            isActive !== false
                        );
                    }) : undefined;

                    if (options?.level === 'Unit' && wingRecord) {
                        const wRec = wingRecord as unknown as Record<string, unknown>;
                        attrs[targetId] = {
                            ...item,
                            pendingFile: undefined,
                            documentGuid: (wRec.documentGuid as string) || null,
                            documentBindingId: (wRec.documentBindingId as number) || null,
                            documentUrl: (wRec.documentUrl as string) || getDocumentViewUrl(wRec.documentGuid as string),
                            photoGuid: (wRec.photoGuid as string) || null,
                            photoBindingId: (wRec.photoBindingId as number) || null,
                            intValue: wRec.intValue != null ? Number(wRec.intValue) : null,
                            decimalValue: wRec.decimalValue != null ? Number(wRec.decimalValue) : null,
                            textValue: (wRec.textValue as string) || null,
                            dateValue: (wRec.dateValue as string) || null,
                            remark: (wRec.remark as string) || null,
                            bitValue: wRec.bitValue !== false,
                            id: null,
                            propertyId: options?.editingUnitId || item.propertyId || null,
                            entityType: 'W',
                            isInherited: true,
                            inheritanceLevel: 'Wing',
                            inheritedFrom: 'Wing',
                            isOverridden: false,
                        };
                    } else if ((options?.level === 'Unit' || options?.level === 'Wing') && apartmentRecord) {
                        const aRec = apartmentRecord as unknown as Record<string, unknown>;
                        attrs[targetId] = {
                            ...item,
                            pendingFile: undefined,
                            documentGuid: (aRec.documentGuid as string) || null,
                            documentBindingId: (aRec.documentBindingId as number) || null,
                            documentUrl: (aRec.documentUrl as string) || getDocumentViewUrl(aRec.documentGuid as string),
                            photoGuid: (aRec.photoGuid as string) || null,
                            photoBindingId: (aRec.photoBindingId as number) || null,
                            intValue: aRec.intValue != null ? Number(aRec.intValue) : null,
                            decimalValue: aRec.decimalValue != null ? Number(aRec.decimalValue) : null,
                            textValue: (aRec.textValue as string) || null,
                            dateValue: (aRec.dateValue as string) || null,
                            remark: (aRec.remark as string) || null,
                            bitValue: aRec.bitValue !== false,
                            id: null,
                            propertyId: options?.editingUnitId || item.propertyId || null,
                            entityType: 'S',
                            isInherited: true,
                            inheritanceLevel: 'Apartment',
                            inheritedFrom: 'Apartment',
                            isOverridden: false,
                        };
                    } else {
                        attrs[targetId] = {
                            ...item,
                            pendingFile: undefined,
                            documentGuid: null,
                            documentBindingId: null,
                            documentUrl: null,
                            photoGuid: null,
                            photoBindingId: null,
                            intValue: null,
                            decimalValue: null,
                            textValue: null,
                            dateValue: null,
                            remark: null,
                            bitValue: false,
                            id: null,
                            propertyId: options?.editingUnitId || item.propertyId || null,
                            entityType: options?.level === 'Apartment' ? 'S' : options?.level === 'Wing' ? 'W' : 'P',
                            isInherited: false,
                            inheritanceLevel: 'Self',
                            inheritedFrom: null,
                            isOverridden: false,
                        };
                    }

                    delete nextErrors[targetId];

                    Object.values(attrs).forEach(attr => {
                        if (attr.parentAttributeId === targetId) {
                            revertOrClearAttributeAndChildren(attrs, attr.socialAttributeId);
                        }
                    });
                };

                familyIds.forEach((fId) => {
                    revertOrClearAttributeAndChildren(nextData, fId);
                });
                setSavedFlatData(nextData);

                return {
                    data: nextData,
                    errors: nextErrors
                };
            });

            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent('ptis:social-data-updated'));
                window.dispatchEvent(new CustomEvent('ptis:discount-data-updated'));
                window.dispatchEvent(new CustomEvent('ptis:individual-top-section-updated'));
                window.dispatchEvent(new CustomEvent('ptis:apartment-top-section-updated'));
            }

            toast.success(t("discount.deleteSuccess") || "Social detail and associated data deleted successfully!");
        } catch (_error) {
            toast.error("An error occurred while deleting the social details");
        } finally {
            stopDeleteLoading();
        }
    }, [
        socialData,
        isSaving,
        isDeleting,
        propertyId,
        locale,
        options?.isSociety,
        options?.societyDetailId,
        options?.wingDetailId,
        options?.propertyIds,
        options?.level,
        options?.editingUnitId,
        options?.savedPropertyDetails,
        setFormState,
        setSavedFlatData,
        startDeleteLoading,
        stopDeleteLoading,
        t
    ]);

    const revertSocialAttribute = useCallback((id: number) => {
        setFormState((prev) => {
            const initialItem = initialFlatData[id];
            if (!initialItem) return prev;
            const hasDbValues = typeof initialItem.id === "number" && initialItem.id > 0;
            if (!hasDbValues) return prev;
            
            const nextData = { ...prev.data, [id]: { ...initialItem } };
            const nextErrors = { ...prev.errors };
            delete nextErrors[id];

            return {
                data: nextData,
                errors: nextErrors
            };
        });
    }, [initialFlatData, setFormState]);

    const handleToggleEnabledWrapped = useCallback((attributeId: number, checked: boolean) => {
        setHasSubmitted(false);
        handleToggleEnabled(attributeId, checked);
    }, [handleToggleEnabled]);

    return {
        socialData, initialFlatData, isSaving, isDeleting, hasChanges, isFormValid, validationErrors: activeValidationErrors, incompleteAttributes,
        isAttributeEnabled: (attr: FlatSocialAttributeState) => isAttributeEnabled(attr, socialData),
        handleInputChange, handleToggleEnabled: handleToggleEnabledWrapped, handlePhotoUpload, handlePhotoDelete, handleDeleteSocialDetail, handleSave, revertSocialAttribute
    };
};
export { checkSocialRequiredFields };
