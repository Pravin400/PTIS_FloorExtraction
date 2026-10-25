"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useSocialDetailsForm } from "@/hooks/useSocialDetailsForm";
import { PropertySocialInfoResponseDto, PropertySocialDetailsDto } from "@/types/property-social-details.types";
import { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { SocialSidebar } from "./SocialSidebar";
import { SocialRightPane } from "./SocialRightPane";
import { SocialValidationErrorBanner } from "./SocialValidationErrorBanner";
import { useSocialHierarchy } from "./useSocialHierarchy";
import { useSocialNavigation } from "./useSocialNavigation";
import { getLocalizedName } from "@/lib/utils/social-details";
import { SocialAttribute } from "@/types/social-attribute.types";

interface SocialDetailsFormProps {
    initialSocialData: PropertySocialInfoResponseDto | null;
    propertyId: string;
    levelState?: ReturnType<typeof useDiscountLevelState>;
    isSociety?: boolean;
    societyDetailId?: number;
    socialMasterAttributes?: SocialAttribute[];
    isWingLoading?: boolean;
    savedPropertyDetails?: PropertySocialDetailsDto[];
}

export const SocialDetailsForm: React.FC<SocialDetailsFormProps> = ({
    initialSocialData,
    propertyId,
    levelState,
    isSociety,
    societyDetailId: propSocietyDetailId,
    socialMasterAttributes = [],
    isWingLoading = false,
    savedPropertyDetails = []
}) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const t = useTranslations("quickDataEntry");

    const societyDetailId = searchParams.get('societyDetailId') || (propSocietyDetailId ? String(propSocietyDetailId) : null);
    const wingDetailId = searchParams.get('wingDetailId');
    const editingUnitId = useMemo(() => {
        if (!levelState || levelState.level !== 'Unit') return null;
        if (levelState.selectedUnitIds.size === 1) return Array.from(levelState.selectedUnitIds)[0];
        const unitParam = searchParams.get('unitPropertyId');
        return unitParam && !isNaN(Number(unitParam)) ? Number(unitParam) : null;
    }, [levelState, searchParams]);

    const form = useSocialDetailsForm(initialSocialData, propertyId, socialMasterAttributes, {
        level: (levelState?.level === 'Apartment' || levelState?.level === 'Wing' || levelState?.level === 'Unit') ? levelState.level : undefined,
        societyDetailId,
        wingDetailId: levelState && (levelState.level === 'Wing' || levelState.level === 'Unit')
            ? (levelState.selectedWingDetailId ? String(levelState.selectedWingDetailId) : wingDetailId)
            : wingDetailId,
        propertyIds: levelState ? Array.from(levelState.selectedUnitIds).join(",") : undefined,
        isSociety,
        selectedUnitCount: levelState ? levelState.selectedUnitIds.size : undefined,
        totalUnitCount: levelState ? levelState.filteredUnits.length : undefined,
        savedPropertyDetails,
        editingUnitId,
    });

    const paramAttributeId = useMemo(() => {
        const param = searchParams.get("socialAttributeId");
        return param && !isNaN(Number(param)) ? Number(param) : null;
    }, [searchParams]);

    const [userSelectedId, setUserSelectedId] = useState<number | null>(null);
    const [prevParamAttributeId, setPrevParamAttributeId] = useState<number | null>(paramAttributeId);

    if (paramAttributeId !== prevParamAttributeId) {
        setPrevParamAttributeId(paramAttributeId);
        setUserSelectedId(null);
    }

    const selectedId = userSelectedId ?? paramAttributeId;
    const [searchTerm, setSearchTerm] = useState("");
    const [showActiveFirst, setShowActiveFirst] = useState(false);

    const { filteredAttributes, activeSelectedId, selectedHierarchy, activeIncompleteAttributes } = useSocialHierarchy({
        socialMasterAttributes,
        initialSocialData,
        socialData: form.socialData,
        selectedId,
        searchTerm,
        showActiveFirst,
        incompleteAttributes: form.incompleteAttributes,
        isUnitLevel: Boolean(isSociety && levelState?.level === 'Unit'),
        t,
    });

    const {
        isLoadingWing,
        deleteSelectionCount,
        setDeleteSelectionCount,
        handleSelectWing,
        handleSelectAttribute,
        handleToggleEnabledWrapped,
        handleErrorTagClick,
        handleSaveClick,
        activeWingName,
        selectedUnitNames,
        updateUrl,
    } = useSocialNavigation({
        levelState,
        isWingLoading,
        pathname,
        socialData: form.socialData,
        initialFlatData: form.initialFlatData,
        handleToggleEnabled: form.handleToggleEnabled,
        handleSave: form.handleSave,
        setSelectedId: setUserSelectedId,
        showActiveFirst,
        setShowActiveFirst,
        setSearchTerm,
        isSociety,
        t,
    });

    const handleEditUnit = useCallback((_row: unknown) => {
        if (activeSelectedId !== null) handleSelectAttribute(activeSelectedId);
    }, [activeSelectedId, handleSelectAttribute]);

    const selectedAttribute = activeSelectedId !== null ? form.socialData[activeSelectedId] : null;
    const activeAttributeDisplayName = selectedAttribute
        ? getLocalizedName(selectedAttribute.socialAttributeCode, selectedAttribute.socialAttributeName, t)
        : (activeSelectedId !== null && form.socialData[activeSelectedId]
            ? getLocalizedName(form.socialData[activeSelectedId].socialAttributeCode, form.socialData[activeSelectedId].socialAttributeName, t)
            : undefined);

    const tObj = t as unknown as { (key: string, values?: Record<string, string | number | Date>): string; has?: (key: string) => boolean };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 flex flex-col flex-1 min-h-0 overflow-hidden relative p-1.5 md:p-2 w-full h-full">
            {activeIncompleteAttributes.length > 0 && (
                <SocialValidationErrorBanner
                    incompleteAttributes={activeIncompleteAttributes}
                    onTagClick={handleErrorTagClick}
                    t={t as unknown as (key: string) => string}
                />
            )}

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:overflow-hidden">
                <div className="lg:col-span-4 xl:col-span-3 h-auto lg:h-full lg:overflow-hidden">
                    <SocialSidebar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        showActiveFirst={showActiveFirst}
                        onShowActiveChange={setShowActiveFirst}
                        attributes={filteredAttributes}
                        socialData={form.socialData}
                        selectedId={activeSelectedId}
                        onSelect={handleSelectAttribute}
                        onToggleEnabled={handleToggleEnabledWrapped}
                        validationErrors={form.validationErrors}
                        level={isSociety ? levelState?.level : undefined}
                        isSociety={isSociety}
                        savedPropertyDetails={savedPropertyDetails}
                        savedSocialState={form.initialFlatData}
                        wingDetailId={isSociety ? levelState?.selectedWingDetailId : undefined}
                        editingUnitId={isSociety ? editingUnitId : undefined}
                        t={tObj}
                    />
                </div>

                <SocialRightPane
                    isLoadingWing={isLoadingWing}
                    levelState={levelState}
                    isSociety={isSociety}
                    handleSelectWing={handleSelectWing}
                    t={tObj}
                    savedPropertyDetails={savedPropertyDetails}
                    initialSocialData={initialSocialData}
                    activeSelectedId={activeSelectedId}
                    activeAttributeDisplayName={activeAttributeDisplayName}
                    handleEditUnit={handleEditUnit}
                    updateUrl={updateUrl}
                    propertyId={propertyId}
                    societyDetailId={societyDetailId ? Number(societyDetailId) : (propSocietyDetailId ? Number(propSocietyDetailId) : undefined)}
                    setDeleteSelectionCount={setDeleteSelectionCount}
                    selectedAttribute={selectedAttribute}
                    selectedHierarchy={selectedHierarchy}
                    form={form}
                    handleSaveClick={handleSaveClick}
                    deleteSelectionCount={deleteSelectionCount}
                    activeWingName={activeWingName}
                    selectedUnitNames={selectedUnitNames}
                    searchParams={searchParams}
                />
            </div>
        </div>
    );
};
