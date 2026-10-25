import React from "react";
import { Loader2 } from "lucide-react";
import { DiscountWingSelector } from "./DiscountWingSelector";
import { UnitSelectionPanel } from "./UnitSelectionPanel";
import { DiscountDetailPane } from "./DiscountDetailPane";
import { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import { DiscountAttributeState, DiscountState } from "@/types/discount.types";
import { DiscountFieldErrors } from "@/lib/utils/validateDiscountForm";
import { PropertySocialDetailsDto } from "@/types/property-social-details.types";
import { ReadonlyURLSearchParams } from "next/navigation";

interface DiscountRightPaneProps {
    isLoadingWing: boolean;
    levelState?: ReturnType<typeof useDiscountLevelState>;
    isSociety?: boolean;
    handleSelectWing: (wingDetailId: number) => void;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
    savedPropertyDetails?: PropertySocialDetailsDto[];
    activeSelectedId: number | null;
    activeAttributeDisplayName?: string;
    handleEditUnit: (_row: unknown) => void;
    handleUnitUrlUpdate: (params: URLSearchParams) => void;
    propertyId?: string;
    societyDetailId?: number;
    setDeleteSelectionCount: (count: number) => void;
    selectedDiscount: DiscountAttributeState | null | undefined;
    discountData?: DiscountState;
    handleInputChange: (id: number, field: "intValue" | "decimalValue" | "textValue" | "dateValue" | "remark" | "bitValue", value: string | number | boolean | null) => void;
    handleFileUpload: (id: number, file: File) => void;
    handleFileDelete: (id: number) => void;
    handleDeleteDiscount: (id: number) => void;
    isSaving: boolean;
    isDeleting?: boolean;
    hasChanges?: boolean;
    isFormValid?: boolean;
    onSave?: () => void;
    validationErrors: Record<number, string>;
    fieldErrors?: Record<number, DiscountFieldErrors>;
    deleteSelectionCount: number;
    activeWingName: string | null;
    selectedUnitNames: string[];
    searchParams: ReadonlyURLSearchParams;
}

export const DiscountRightPane: React.FC<DiscountRightPaneProps> = ({
    isLoadingWing,
    levelState,
    isSociety,
    handleSelectWing,
    t,
    savedPropertyDetails = [],
    activeSelectedId,
    activeAttributeDisplayName,
    handleEditUnit,
    handleUnitUrlUpdate,
    propertyId,
    societyDetailId,
    setDeleteSelectionCount,
    selectedDiscount,
    discountData,
    handleInputChange,
    handleFileUpload,
    handleFileDelete,
    handleDeleteDiscount,
    isSaving,
    isDeleting = false,
    hasChanges,
    isFormValid,
    onSave,
    validationErrors,
    fieldErrors,
    deleteSelectionCount,
    activeWingName,
    selectedUnitNames,
    searchParams,
}) => {
    return (
        <div className="relative lg:col-span-8 xl:col-span-9 h-full flex flex-col gap-2 overflow-hidden">
            {isLoadingWing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-xl transition-all duration-200">
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200/90 text-slate-700 rounded-xl shadow-lg text-xs font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                        <span>{t('building.fetchingWingData') || 'Fetching wing data...'}</span>
                    </div>
                </div>
            )}

            <DiscountWingSelector
                levelState={levelState}
                isSociety={isSociety}
                isLoadingWing={isLoadingWing}
                onSelectWing={handleSelectWing}
                t={t}
            />

            {isSociety && levelState && levelState.level === 'Unit' && (
                <UnitSelectionPanel
                    levelState={levelState}
                    t={t}
                    savedPropertyDetails={savedPropertyDetails}
                    activeSelectedId={activeSelectedId}
                    activeAttributeName={activeAttributeDisplayName}
                    onEditUnit={handleEditUnit}
                    onUrlUpdate={handleUnitUrlUpdate}
                    showActions={true}
                    propertyId={propertyId}
                    societyDetailId={societyDetailId}
                    wingDetailId={levelState.selectedWingDetailId}
                    onDeleteSelectionChange={(selectedIds: Set<number>) => setDeleteSelectionCount(selectedIds.size)}
                />
            )}

            <DiscountDetailPane
                data={selectedDiscount}
                discountData={discountData}
                allValidationErrors={validationErrors}
                allFieldErrors={fieldErrors}
                onInputChange={(field, value) => {
                    if (activeSelectedId !== null) {
                        handleInputChange(activeSelectedId, field, value);
                    }
                }}
                onChildInputChange={(attrId, field, value) => {
                    handleInputChange(attrId, field, value);
                }}
                onFileUpload={(file) => {
                    if (activeSelectedId !== null) {
                        handleFileUpload(activeSelectedId, file);
                    }
                }}
                onFileDelete={() => {
                    if (activeSelectedId !== null) {
                        handleFileDelete(activeSelectedId);
                    }
                }}
                onDeleteDiscount={() => {
                    if (activeSelectedId !== null) {
                        handleDeleteDiscount(activeSelectedId);
                    }
                }}
                isSaving={isSaving}
                isDeleting={isDeleting}
                hasChanges={hasChanges}
                isFormValid={isFormValid}
                onSave={onSave}
                validationError={activeSelectedId !== null ? validationErrors[activeSelectedId] : undefined}
                fieldErrors={activeSelectedId !== null ? fieldErrors?.[activeSelectedId] : undefined}
                t={t}
                isDeleteDisabled={levelState?.level === 'Unit' && deleteSelectionCount > 0}
                level={isSociety && (levelState?.level === 'Apartment' || levelState?.level === 'Wing' || levelState?.level === 'Unit') ? levelState.level : undefined}
                isSociety={isSociety}
                wingName={isSociety ? activeWingName : undefined}
                wingDetailId={isSociety ? levelState?.selectedWingDetailId : undefined}
                selectedUnitNames={isSociety ? selectedUnitNames : undefined}
                selectedUnitCount={isSociety ? Math.max(levelState?.selectedUnitIds?.size ?? 0, searchParams.get("unitPropertyId") ? 1 : 0) : undefined}
                editingUnitId={isSociety ? (searchParams.get("unitPropertyId") ? Number(searchParams.get("unitPropertyId")) : (levelState?.selectedUnitIds?.size === 1 ? Array.from(levelState.selectedUnitIds)[0] : undefined)) : undefined}
                savedPropertyDetails={savedPropertyDetails}
            />
        </div>
    );
};
