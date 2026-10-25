"use client";

import React, { useMemo } from "react";
import { FlatSocialAttributeState, getLocalizedName, isAttributeEnabled as checkAttrEnabled } from "@/lib/utils/social-details";
import { SocialAttributeHierarchyDto, PropertySocialDetailsDto } from "@/types/property-social-details.types";
import { AttributeControl } from "./AttributeControl";
import { NestedAttributes } from "./NestedAttributes";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { buildDeleteHierarchyConfirmation } from "./DeleteHierarchyConfirmModal";
import { calculateDiscountDeleteAccess } from "@/lib/utils/discount-delete-access";
import { SocialSelectPrompt } from "./SocialPanePlaceholders";
import { SocialDetailHeader } from "./SocialDetailHeader";
import { SocialDetailFooter } from "./SocialDetailFooter";
import { SocialAttachmentRemarkSection } from "./SocialAttachmentRemarkSection";

interface SocialDetailPaneProps {
    data: FlatSocialAttributeState | null | undefined;
    hierarchyData: SocialAttributeHierarchyDto | null | undefined;
    socialData: Record<number, FlatSocialAttributeState>;
    onInputChange: (attributeId: number, field: keyof FlatSocialAttributeState, value: string | number | boolean | null) => void;
    onPhotoUpload: (attributeId: number, file: File) => void;
    onPhotoDelete?: (attributeId: number) => void;
    onDeleteSocialDetail?: () => void;
    validationErrors?: Record<number, string>;
    isSaving?: boolean;
    isDeleting?: boolean;
    hasChanges?: boolean;
    isFormValid?: boolean;
    onSave?: () => void;
    isAttributeEnabled: (attr: FlatSocialAttributeState) => boolean;
    isDeleteDisabled?: boolean;
    level?: 'Apartment' | 'Wing' | 'Unit';
    isSociety?: boolean;
    wingName?: string | null;
    wingDetailId?: number | null;
    selectedUnitNames?: string[];
    selectedUnitCount?: number;
    editingUnitId?: number | null;
    savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
    t: { (key: string, values?: Record<string, string | number | Date>): string; has?: (key: string) => boolean; };
}

export const SocialDetailPane: React.FC<SocialDetailPaneProps> = ({
    data, hierarchyData, socialData, onInputChange, onPhotoUpload, onPhotoDelete,
    onDeleteSocialDetail, validationErrors = {}, isSaving = false, isDeleting = false,
    hasChanges = false, isFormValid, onSave, isAttributeEnabled, isDeleteDisabled = false,
    level, isSociety = true, wingName, wingDetailId, selectedUnitNames, selectedUnitCount, editingUnitId,
    savedPropertyDetails, t,
}) => {
    const { confirm } = useConfirm();

    const displayName = data
        ? getLocalizedName(data.socialAttributeCode, data.socialAttributeName, t as unknown as Parameters<typeof getLocalizedName>[2])
        : "";

    const isSocialDetailFilled = useMemo(() => {
        if (!data) return false;
        const hasFile = !!(data.documentGuid || data.documentUrl || data.photoGuid || data.documentBindingId || data.photoBindingId || data.pendingFile);
        if (data.dataType?.toUpperCase() === "BIT") return hasFile || !!data.remark?.trim() || data.bitValue === true;
        const hasVal = !!(
            (data.intValue !== null && data.intValue !== undefined) ||
            (data.decimalValue !== null && data.decimalValue !== undefined) ||
            data.textValue?.trim() || data.dateValue?.trim()
        );
        return hasFile || hasVal || !!data.remark?.trim();
    }, [data]);

    const deleteAccess = useMemo(() => {
        if (!data) return { canDelete: false, isDeleteButtonVisible: false, isActualOverride: false };
        return calculateDiscountDeleteAccess({
            attributeId: data.socialAttributeId,
            level,
            isSociety,
            isInherited: data.isInherited,
            inheritedFrom: data.inheritedFrom,
            isOverridden: data.isOverridden,
            savedPropertyDetails,
            directRecordId: data.id,
            editingUnitId,
            wingDetailId,
            isItemFilled: isSocialDetailFilled,
            itemType: 'social',
            t,
        });
    }, [data, level, isSociety, savedPropertyDetails, editingUnitId, wingDetailId, isSocialDetailFilled, t]);

    const handleDeleteSocialDetailWithConfirm = () => {
        if (onDeleteSocialDetail && data) {
            const modalConfig = buildDeleteHierarchyConfirmation({
                attributeName: displayName,
                level,
                wingName,
                selectedUnitNames,
                isOverridden: deleteAccess.isActualOverride,
                isInherited: data.isInherited,
                inheritedFrom: data.inheritedFrom,
                t: t as (key: string, values?: Record<string, string | number>) => string,
                itemType: 'social',
            });
            confirm({ ...modalConfig, onConfirm: () => { if (onDeleteSocialDetail) onDeleteSocialDetail(); } });
        }
    };

    if (!data || !hierarchyData) {
        return <SocialSelectPrompt t={t as (key: string) => string} />;
    }

    const isUnitLevel = level === 'Unit';
    const hasSelectedUnits = !isUnitLevel || (selectedUnitCount !== undefined ? selectedUnitCount > 0 : Boolean((selectedUnitNames && selectedUnitNames.length > 0) || editingUnitId));
    const isUnitRequiredAndNotSelected = isUnitLevel && !hasSelectedUnits;
    const isAttributeOff = !checkAttrEnabled(data, socialData);
    const isDisabled = isAttributeOff || isUnitRequiredAndNotSelected;

    const errorMsg = validationErrors[data.socialAttributeId];
    const isPhotoInvalid = Boolean(errorMsg && errorMsg === t("discount.socialValidation.photoRequired"));
    const isRemarkError = Boolean(errorMsg && !isPhotoInvalid && (data.dataType || "").toUpperCase() === "BIT");
    const isSpecialToggle = ["ROAD_WIDTH", "WATER_CONN", "TREE"].some(code => (data.socialAttributeCode || "").toUpperCase().includes(code));
    const isValueRequired = Boolean(data.isRequiredWhenParentTrue || (isSpecialToggle && data.bitValue === true));
    const isPhotoRequired = Boolean(data.isPhotoRequired);
    const showValueInput = (data.dataType || "").toUpperCase() !== "BIT";
    const hasChildren = Boolean(hierarchyData.children && hierarchyData.children.length > 0);

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 border border-blue-100 rounded-xl shadow-sm p-2.5 sm:p-3 justify-between transition-opacity overflow-hidden relative bg-white">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
                <SocialDetailHeader
                    data={data}
                    displayName={displayName}
                    isAttributeOff={isAttributeOff}
                    isUnitRequiredAndNotSelected={isUnitRequiredAndNotSelected}
                    t={t}
                />

                {showValueInput && (
                    <div className="flex flex-col gap-1 w-full">
                        <span className="text-xs font-bold text-slate-600">
                            {displayName}{isValueRequired && <span className="text-red-500 ml-0.5">*</span>}
                        </span>
                        <AttributeControl
                            attr={hierarchyData}
                            state={data}
                            isEnabled={!isDisabled}
                            hasError={Boolean(!isPhotoInvalid && !isRemarkError && errorMsg)}
                            handleValueChange={(attrId, field, val) => onInputChange(attrId, field, val)}
                        />
                    </div>
                )}

                {hasChildren && (
                    <div className="space-y-1.5 w-full">
                        <NestedAttributes
                            attrs={hierarchyData.children || []}
                            socialData={socialData}
                            errors={validationErrors}
                            isAttributeEnabled={(attr) => !isDisabled && isAttributeEnabled(attr)}
                            handleValueChange={onInputChange}
                        />
                    </div>
                )}

                <SocialAttachmentRemarkSection
                    data={data}
                    displayName={displayName}
                    isDisabled={isDisabled}
                    canDeleteDocument={data.isInherited ? Boolean(data.pendingFile) : (deleteAccess.canDelete || (!data.isPhotoRequired && !data.isDocumentRequired) || Boolean(data.pendingFile || data.photoGuid || data.documentGuid || data.fileName))}
                    deleteDocumentTooltip={deleteAccess.documentDeleteTooltip}
                    isPhotoRequired={isPhotoRequired}
                    isPhotoInvalid={isPhotoInvalid}
                    isRemarkError={isRemarkError}
                    errorMsg={errorMsg}
                    onPhotoUpload={(file) => onPhotoUpload(data.socialAttributeId, file)}
                    onPhotoDelete={onPhotoDelete ? () => onPhotoDelete(data.socialAttributeId) : undefined}
                    onRemarkChange={(val) => onInputChange(data.socialAttributeId, "remark", val)}
                    t={t}
                />
            </div>

            <SocialDetailFooter
                onDeleteSocialDetail={handleDeleteSocialDetailWithConfirm}
                onSave={onSave}
                isDeleteButtonVisible={deleteAccess.isDeleteButtonVisible}
                canDelete={!isDeleteDisabled && deleteAccess.canDelete}
                deleteTooltip={deleteAccess.deleteTooltip}
                isDisabled={isDisabled}
                isSaving={isSaving}
                isDeleting={isDeleting}
                hasChanges={hasChanges}
                isFormValid={isFormValid}
                t={t}
            />
        </div>
    );
};
