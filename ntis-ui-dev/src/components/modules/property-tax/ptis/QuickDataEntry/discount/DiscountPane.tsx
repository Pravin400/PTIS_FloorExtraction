import React from "react";
import { ValidationErrorBanner } from "./ValidationErrorBanner";
import { DiscountSidebar } from "./DiscountSidebar";
import { DiscountRightPane } from "./DiscountRightPane";
import { DiscountAttributeState, DiscountState } from "@/types/discount.types";
import { DiscountFieldErrors } from "@/lib/utils/validateDiscountForm";
import { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import { useDiscountPaneState } from "./useDiscountPaneState";
import { PropertySocialDetailsDto } from "@/types/property-social-details.types";
import { toast } from "sonner";

interface DiscountPaneProps {
    discountData: DiscountState;
    savedDiscountState?: DiscountState;
    incompleteDiscounts: { id: number; name: string }[];
    handleErrorTagClick: (id: number) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    showActiveFirst: boolean;
    setShowActiveFirst: (val: boolean) => void;
    filteredDiscounts: DiscountAttributeState[];
    activeSelectedId: number | null;
    setSelectedId: (id: number) => void;
    handleToggleEnabled: (id: number, checked: boolean) => void;
    validationErrors: Record<number, string>;
    fieldErrors?: Record<number, DiscountFieldErrors>;
    selectedDiscount: DiscountAttributeState | null | undefined;
    handleInputChange: (id: number, field: "intValue" | "decimalValue" | "textValue" | "dateValue" | "remark" | "bitValue", value: string | number | boolean | null) => void;
    handleFileUpload: (id: number, file: File) => void;
    handleFileDelete: (id: number) => void;
    handleDeleteDiscount: (id: number) => void;
    isSaving: boolean;
    isDeleting?: boolean;
    hasChanges?: boolean;
    isFormValid?: boolean;
    onSave?: () => void;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
    levelState?: ReturnType<typeof useDiscountLevelState>;
    isSociety?: boolean;
    isWingLoading?: boolean;
    savedPropertyDetails?: PropertySocialDetailsDto[];
    propertyId?: string;
    societyDetailId?: number;
}

export const DiscountPane: React.FC<DiscountPaneProps> = ({
    discountData,
    savedDiscountState,
    incompleteDiscounts,
    handleErrorTagClick,
    searchTerm,
    setSearchTerm,
    showActiveFirst,
    setShowActiveFirst,
    filteredDiscounts,
    activeSelectedId,
    setSelectedId,
    handleToggleEnabled,
    validationErrors,
    fieldErrors,
    selectedDiscount,
    handleInputChange,
    handleFileUpload,
    handleFileDelete,
    handleDeleteDiscount,
    isSaving,
    isDeleting = false,
    hasChanges,
    isFormValid,
    onSave,
    savedPropertyDetails = [],
    t,
    levelState,
    isSociety = false,
    isWingLoading = false,
    propertyId,
    societyDetailId,
}) => {
    const {
        isLoadingWing,
        deleteSelectionCount,
        setDeleteSelectionCount,
        handleSelectWing,
        handleEditUnit,
        handleUnitUrlUpdate,
        activeAttributeDisplayName,
        activeWingName,
        selectedUnitNames,
        searchParams,
    } = useDiscountPaneState({
        activeSelectedId,
        selectedDiscount,
        discountData,
        levelState,
        setSelectedId,
        t,
        isWingLoading,
    });

    const activeIncompletes = incompleteDiscounts.filter(d => {
        const item = discountData[d.id];
        return item ? (item.dataType.toUpperCase() === "BIT" ? item.bitValue === true : item.enabled) : false;
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 flex flex-col flex-1 min-h-0 overflow-hidden relative p-1.5 md:p-2 w-full h-full">
            {activeIncompletes.length > 0 && (
                <ValidationErrorBanner
                    incompleteDiscounts={activeIncompletes}
                    onTagClick={handleErrorTagClick}
                    t={t}
                />
            )}

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:overflow-hidden">
                <div className="lg:col-span-4 xl:col-span-3 h-auto lg:h-full lg:overflow-hidden">
                    <DiscountSidebar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        showActiveFirst={showActiveFirst}
                        onShowActiveChange={setShowActiveFirst}
                        discounts={filteredDiscounts}
                        discountData={discountData}
                        selectedId={activeSelectedId}
                        onSelect={setSelectedId}
                        onToggleEnabled={(id, checked) => {
                            const savedItem = savedDiscountState ? savedDiscountState[id] : null;
                            const isSavedActive = savedItem
                                ? (savedItem.dataType.toUpperCase() === "BIT" ? savedItem.bitValue === true : savedItem.enabled === true)
                                : false;
                            const isStored = Boolean(
                                isSavedActive && (
                                    (typeof savedItem?.propertySocialDetailId === "number" && savedItem.propertySocialDetailId > 0) ||
                                    (typeof savedItem?.documentBindingId === "number" && savedItem.documentBindingId > 0) ||
                                    savedItem?.isInherited
                                )
                            );

                            if (!checked && isStored) {
                                const msgKey = isSociety ? "discount.cannotToggleOffApplied" : "discount.cannotToggleOffAppliedIndividual";
                                const fallback = "Applied discount cannot be turned off directly. Please use 'Delete Discount & Data' to delete.";
                                const msg = (typeof t.has === "function" && t.has(msgKey)) ? t(msgKey) : (t("discount.cannotToggleOffApplied") || fallback);
                                toast.info(msg);
                                return;
                            }

                            handleToggleEnabled(id, checked);
                            setSelectedId(id);
                        }}
                        validationErrors={validationErrors}
                        level={isSociety && (levelState?.level === 'Apartment' || levelState?.level === 'Wing' || levelState?.level === 'Unit') ? levelState.level : undefined}
                        isSociety={isSociety}
                        savedPropertyDetails={savedPropertyDetails}
                        savedDiscountState={savedDiscountState}
                        wingDetailId={isSociety ? levelState?.selectedWingDetailId : undefined}
                        editingUnitId={isSociety ? (searchParams.get("unitPropertyId") ? Number(searchParams.get("unitPropertyId")) : (levelState?.selectedUnitIds?.size === 1 ? Array.from(levelState.selectedUnitIds)[0] : undefined)) : undefined}
                        t={t}
                    />
                </div>

                <DiscountRightPane
                    isLoadingWing={isLoadingWing}
                    levelState={levelState}
                    isSociety={isSociety}
                    handleSelectWing={handleSelectWing}
                    t={t}
                    savedPropertyDetails={savedPropertyDetails}
                    activeSelectedId={activeSelectedId}
                    activeAttributeDisplayName={activeAttributeDisplayName}
                    handleEditUnit={handleEditUnit}
                    handleUnitUrlUpdate={handleUnitUrlUpdate}
                    propertyId={propertyId}
                    societyDetailId={societyDetailId}
                    setDeleteSelectionCount={setDeleteSelectionCount}
                    selectedDiscount={selectedDiscount}
                    discountData={discountData}
                    handleInputChange={handleInputChange}
                    handleFileUpload={handleFileUpload}
                    handleFileDelete={handleFileDelete}
                    handleDeleteDiscount={handleDeleteDiscount}
                    isSaving={isSaving}
                    isDeleting={isDeleting}
                    hasChanges={hasChanges}
                    isFormValid={isFormValid}
                    onSave={onSave}
                    validationErrors={validationErrors}
                    fieldErrors={fieldErrors}
                    deleteSelectionCount={deleteSelectionCount}
                    activeWingName={activeWingName}
                    selectedUnitNames={selectedUnitNames}
                    searchParams={searchParams}
                />
            </div>
        </div>
    );
};
