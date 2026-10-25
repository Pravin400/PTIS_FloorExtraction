"use client";

import React, { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { DiscountAttributeState, DiscountState } from "@/types/discount.types";
import { DiscountFieldErrors } from "@/lib/utils/validateDiscountForm";
import { PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { DiscountValueInput } from "./DiscountValueInput";
import { getLocalizedName } from "@/lib/utils/social-details";
import { isAttributeActive } from "@/lib/utils/discount-helpers";
import { buildDeleteHierarchyConfirmation } from "./DeleteHierarchyConfirmModal";
import { calculateDiscountDeleteAccess } from "@/lib/utils/discount-delete-access";
import { DiscountDetailHeader } from "./DiscountDetailHeader";
import { DiscountDetailFooter } from "./DiscountDetailFooter";
import { DiscountAttachmentRemarkSection } from "./DiscountAttachmentRemarkSection";
import { DiscountNestedAttributes } from "./DiscountNestedAttributes";

interface DiscountDetailPaneProps {
    data: DiscountAttributeState | null | undefined;
    discountData?: DiscountState;
    allValidationErrors?: Record<number, string>;
    allFieldErrors?: Record<number, DiscountFieldErrors>;
    onInputChange: (field: "intValue" | "decimalValue" | "textValue" | "dateValue" | "remark", value: string) => void;
    onChildInputChange?: (
        attributeId: number,
        field: "intValue" | "decimalValue" | "textValue" | "dateValue" | "remark" | "bitValue",
        value: string | number | boolean | null
    ) => void;
    onFileUpload: (file: File) => void;
    onFileDelete?: () => void;
    onDeleteDiscount?: () => void;
    validationError?: string;
    fieldErrors?: DiscountFieldErrors;
    isSaving?: boolean;
    isDeleting?: boolean;
    hasChanges?: boolean;
    isFormValid?: boolean;
    onSave?: () => void;
    isDeleteDisabled?: boolean;
    level?: 'Apartment' | 'Wing' | 'Unit';
    isSociety?: boolean;
    wingName?: string | null;
    wingDetailId?: number | null;
    selectedUnitNames?: string[];
    selectedUnitCount?: number;
    editingUnitId?: number | null;
    savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

export const DiscountDetailPane: React.FC<DiscountDetailPaneProps> = ({
    data, discountData, allValidationErrors, allFieldErrors, onInputChange, onChildInputChange,
    onFileUpload, onFileDelete, onDeleteDiscount, validationError,
    fieldErrors,
    isSaving = false, isDeleting = false, hasChanges = false, isFormValid, onSave,
    isDeleteDisabled = false, level, isSociety = true, wingName, wingDetailId, selectedUnitNames,
    selectedUnitCount, editingUnitId, savedPropertyDetails, t,
}) => {
    const { confirm } = useConfirm();

    const displayName = data
        ? getLocalizedName(data.socialAttributeCode, data.socialAttributeName, t as unknown as Parameters<typeof getLocalizedName>[2])
        : "";

    const isDiscountFilled = useMemo(() => {
        if (!data) return false;
        if (data.isInherited && data.enabled) return true;
        const hasFile = !!(data.documentGuid || data.fileName || data.pendingFile);
        const isBitType = data.dataType?.toUpperCase() === "BIT";
        if (isBitType) return hasFile || !!data.remark?.trim() || data.bitValue === true || data.enabled === true;
        const hasVal = !!(
            data.intValue !== null && data.intValue !== undefined ||
            data.decimalValue !== null && data.decimalValue !== undefined ||
            data.textValue?.trim() || data.dateValue?.trim()
        );
        return hasFile || hasVal || !!data.remark?.trim() || data.enabled === true;
    }, [data]);

    const deleteAccess = useMemo(() => {
        if (!data) return { canDelete: false, isDeleteButtonVisible: false, isActualOverride: false };
        return calculateDiscountDeleteAccess({
            attributeId: data.id,
            level,
            isSociety,
            isInherited: data.isInherited,
            inheritedFrom: data.inheritedFrom,
            isOverridden: data.isOverridden,
            savedPropertyDetails,
            directRecordId: data.propertySocialDetailId,
            editingUnitId,
            wingDetailId,
            isItemFilled: isDiscountFilled,
            itemType: 'discount',
            t,
        });
    }, [data, level, isSociety, savedPropertyDetails, editingUnitId, wingDetailId, isDiscountFilled, t]);

    const handleDeleteDiscountWithConfirm = () => {
        if (onDeleteDiscount && data) {
            const modalConfig = buildDeleteHierarchyConfirmation({
                attributeName: displayName,
                level,
                wingName,
                selectedUnitNames,
                isOverridden: deleteAccess.isActualOverride,
                isInherited: data.isInherited,
                inheritedFrom: data.inheritedFrom,
                t: t as (key: string, values?: Record<string, string | number>) => string,
                itemType: 'discount',
            });
            confirm({ ...modalConfig, onConfirm: () => { if (onDeleteDiscount) onDeleteDiscount(); } });
        }
    };

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] lg:h-full bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
                <AlertCircle size={36} className="text-gray-400 mb-3" />
                <p className="text-sm font-bold text-gray-500">
                    {t("discount.selectDiscountPrompt")}
                </p>
            </div>
        );
    }

    const isUnitLevel = level === 'Unit';
    const hasSelectedUnits = !isUnitLevel || (selectedUnitCount !== undefined ? selectedUnitCount > 0 : Boolean((selectedUnitNames && selectedUnitNames.length > 0) || editingUnitId));
    const isUnitRequiredAndNotSelected = isUnitLevel && !hasSelectedUnits;
    const isAttributeOff = !isAttributeActive(data);
    const isDisabled = isAttributeOff || isUnitRequiredAndNotSelected;

    const isDocumentInvalid = fieldErrors
        ? Boolean(fieldErrors.document)
        : Boolean(validationError && validationError === t("common.validation.documentRequired"));

    const isRemarkError = fieldErrors
        ? Boolean(fieldErrors.remark)
        : Boolean(validationError && !isDocumentInvalid && (data.dataType || "").toUpperCase() === "BIT");

    const isValueInvalid = fieldErrors
        ? Boolean(fieldErrors.value)
        : Boolean(validationError && !isDocumentInvalid && !isRemarkError);

    const inputClassName = `h-10 text-sm placeholder:text-gray-400 focus:ring-1 shadow-sm transition-colors font-semibold ${
        isValueInvalid
            ? "bg-white text-gray-800 border-red-500 focus:border-red-500 focus:ring-red-500"
            : "bg-white text-gray-800 border-blue-200 focus:border-blue-600 focus:ring-blue-600 hover:border-blue-300"
    }`;

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 border border-blue-100 rounded-xl shadow-sm p-2.5 sm:p-3 justify-between transition-opacity overflow-hidden relative bg-white">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
                <DiscountDetailHeader
                    data={data}
                    displayName={displayName}
                    isAttributeOff={isAttributeOff}
                    isUnitRequiredAndNotSelected={isUnitRequiredAndNotSelected}
                    t={t}
                />

                {(data.dataType || "").toUpperCase() !== "BIT" && (
                    <DiscountValueInput
                        data={data}
                        isDisabled={isDisabled}
                        inputClassName={inputClassName}
                        onInputChange={onInputChange}
                        isValueInvalid={isValueInvalid}
                        validationError={fieldErrors?.value || validationError}
                        t={t}
                    />
                )}

                {discountData && data && (
                    <DiscountNestedAttributes
                        parentId={data.id}
                        discountData={discountData}
                        validationErrors={allValidationErrors}
                        fieldErrors={allFieldErrors}
                        isDisabled={isDisabled}
                        onInputChange={onChildInputChange || ((_id, field, val) => {
                            if (field !== "bitValue") {
                                onInputChange(field, String(val ?? ""));
                            }
                        })}
                    />
                )}

                <DiscountAttachmentRemarkSection
                    data={data}
                    displayName={displayName}
                    isDisabled={isDisabled}
                    canDeleteDocument={data.isInherited ? Boolean(data.pendingFile) : (deleteAccess.canDelete || !data.isDocumentRequired || Boolean(data.pendingFile || data.documentGuid || data.fileName))}
                    deleteDocumentTooltip={deleteAccess.documentDeleteTooltip}
                    isDocumentInvalid={isDocumentInvalid}
                    isRemarkError={isRemarkError}
                    remarkError={fieldErrors?.remark}
                    validationError={validationError}
                    onFileUpload={onFileUpload}
                    onFileDelete={onFileDelete}
                    onInputChange={(field, val) => onInputChange(field, val)}
                    t={t}
                />
            </div>

            <DiscountDetailFooter
                onDeleteDiscount={handleDeleteDiscountWithConfirm}
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
