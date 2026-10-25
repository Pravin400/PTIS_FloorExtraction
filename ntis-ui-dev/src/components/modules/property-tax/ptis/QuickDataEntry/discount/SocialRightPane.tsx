import React from "react";
import { Loader2 } from "lucide-react";
import { DiscountWingSelector } from "./DiscountWingSelector";
import { UnitSelectionPanel } from "./UnitSelectionPanel";
import { SocialDetailPane } from "./SocialDetailPane";
import { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import { useSocialDetailsForm } from "@/hooks/useSocialDetailsForm";
import {
    PropertySocialDetailsDto,
    PropertySocialInfoResponseDto,
    SocialAttributeHierarchyDto,
} from "@/types/property-social-details.types";
import { FlatSocialAttributeState } from "@/lib/utils/social-details";
import { ReadonlyURLSearchParams } from "next/navigation";

interface SocialRightPaneProps {
    isLoadingWing: boolean;
    levelState?: ReturnType<typeof useDiscountLevelState>;
    isSociety?: boolean;
    handleSelectWing: (wingDetailId: number) => void;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
    savedPropertyDetails: PropertySocialDetailsDto[];
    initialSocialData: PropertySocialInfoResponseDto | null;
    activeSelectedId: number | null;
    activeAttributeDisplayName?: string;
    handleEditUnit: (_row: unknown) => void;
    updateUrl: (params: URLSearchParams) => void;
    propertyId: string;
    societyDetailId?: number | null;
    setDeleteSelectionCount: (count: number) => void;
    selectedAttribute: FlatSocialAttributeState | null;
    selectedHierarchy: SocialAttributeHierarchyDto | null;
    form: ReturnType<typeof useSocialDetailsForm>;
    handleSaveClick: () => void;
    deleteSelectionCount: number;
    activeWingName: string | null;
    selectedUnitNames: string[];
    searchParams: ReadonlyURLSearchParams;
}

export const SocialRightPane: React.FC<SocialRightPaneProps> = ({
    isLoadingWing,
    levelState,
    isSociety,
    handleSelectWing,
    t,
    savedPropertyDetails,
    initialSocialData,
    activeSelectedId,
    activeAttributeDisplayName,
    handleEditUnit,
    updateUrl,
    propertyId,
    societyDetailId,
    setDeleteSelectionCount,
    selectedAttribute,
    selectedHierarchy,
    form,
    handleSaveClick,
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
                    t={t as unknown as (key: string, values?: Record<string, string | number | Date>) => string}
                    savedPropertyDetails={savedPropertyDetails.length > 0 ? savedPropertyDetails : (initialSocialData?.socialAttributes || [])}
                    activeSelectedId={activeSelectedId}
                    activeAttributeName={activeAttributeDisplayName}
                    onEditUnit={handleEditUnit}
                    onUrlUpdate={updateUrl}
                    showActions={true}
                    propertyId={propertyId}
                    societyDetailId={societyDetailId ? Number(societyDetailId) : undefined}
                    wingDetailId={levelState.selectedWingDetailId}
                    onDeleteSelectionChange={(selectedIds: Set<number>) => setDeleteSelectionCount(selectedIds.size)}
                />
            )}

            <SocialDetailPane
                data={selectedAttribute}
                hierarchyData={selectedHierarchy}
                socialData={form.socialData}
                onInputChange={form.handleInputChange}
                onPhotoUpload={form.handlePhotoUpload}
                onPhotoDelete={form.handlePhotoDelete}
                onDeleteSocialDetail={() => {
                    if (activeSelectedId !== null) {
                        form.handleDeleteSocialDetail(activeSelectedId);
                    }
                }}
                isSaving={form.isSaving}
                isDeleting={form.isDeleting}
                hasChanges={form.hasChanges}
                isFormValid={form.isFormValid}
                onSave={handleSaveClick}
                validationErrors={form.validationErrors}
                isAttributeEnabled={form.isAttributeEnabled}
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
