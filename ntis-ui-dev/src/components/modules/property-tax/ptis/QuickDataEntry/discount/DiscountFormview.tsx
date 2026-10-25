"use client";

import React from "react";
import { Tabs } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { useTranslations } from "next-intl";
import { useDiscountForm } from "@/hooks/useDiscountForm";
import { DiscountPane } from "./DiscountPane";
import { SocialDetailsForm } from "./SocialDetailsForm";
import { DiscountFormTabsHeader } from "./DiscountFormTabsHeader";
import { useDiscountFormviewState } from "./useDiscountFormviewState";
import { useDiscountSelectionState } from "./useDiscountSelectionState";
import { PropertyDiscountInfoResponseDto } from "@/types/discount.types";
import { PropertySocialInfoResponseDto } from "@/types/property-social-details.types";
import { SocialAttribute } from "@/types/social-attribute.types";
import { UnitSelectionItem, WingOption } from "@/types/building-permission.types";
import { PropertySocialDetailsDto } from "@/types/property-social-details.types";

interface DiscountFormProps {
    initialDiscountData: PropertyDiscountInfoResponseDto | null;
    initialSocialData: PropertySocialInfoResponseDto | null;
    propertyId: string;
    isSociety?: boolean;
    discountMasterAttributes?: SocialAttribute[];
    socialMasterAttributes?: SocialAttribute[];
    wings?: WingOption[];
    units?: UnitSelectionItem[];
    savedPropertyDetails?: PropertySocialDetailsDto[];
    societyDetailId?: number;
    wingDetailId?: number;
}

const DiscountFormview: React.FC<DiscountFormProps> = ({
    initialDiscountData,
    initialSocialData,
    propertyId,
    isSociety = false,
    societyDetailId: propSocietyDetailId,
    wingDetailId: propWingDetailId,
    discountMasterAttributes = [],
    socialMasterAttributes = [],
    wings = [],
    units = [],
    savedPropertyDetails = [],
}) => {
    const t = useTranslations('quickDataEntry');

    const {
        activeTab,
        handleTabChange,
        levelState,
        handleLevelChange,
        isPendingTransition,
        isTabPending,
        isLevelPending,
        targetTab,
        targetLevel,
        hasHierarchy,
        showApartmentTab,
        showWingTab,
        showLevelSelector,
        effectiveIsSociety,
        effectiveSocietyDetailId,
        effectiveWingDetailId,
        editingUnitId,
        searchParams,
        pathname,
    } = useDiscountFormviewState({
        propertyId,
        isSociety,
        propSocietyDetailId,
        propWingDetailId,
        wings,
        units,
        savedPropertyDetails,
        t,
    });

    const {
        discountData,
        savedDiscountState,
        isSaving,
        isDeleting,
        hasChanges,
        isFormValid,
        validationErrors,
        fieldErrors,
        incompleteDiscounts,
        handleToggleEnabled,
        handleInputChange,
        handleFileUpload,
        handleFileDelete,
        handleDeleteDiscount,
        handleSave,
    } = useDiscountForm(initialDiscountData, propertyId, discountMasterAttributes, {
        level: hasHierarchy ? ((levelState?.level === 'Apartment' || levelState?.level === 'Wing' || levelState?.level === 'Unit') ? levelState.level : undefined) : 'Unit',
        societyDetailId: effectiveIsSociety ? (searchParams.get('societyDetailId') || searchParams.get('societyId') || (effectiveSocietyDetailId ? String(effectiveSocietyDetailId) : null)) : null,
        wingDetailId: effectiveIsSociety && levelState && (levelState.level === 'Wing' || levelState.level === 'Unit')
            ? (levelState.selectedWingDetailId ? String(levelState.selectedWingDetailId) : (effectiveWingDetailId ? String(effectiveWingDetailId) : null))
            : (effectiveIsSociety && effectiveWingDetailId ? String(effectiveWingDetailId) : null),
        propertyIds: effectiveIsSociety && levelState ? Array.from(levelState.selectedUnitIds).join(",") : undefined,
        isSociety: effectiveIsSociety,
        selectedUnitCount: effectiveIsSociety && levelState ? levelState.selectedUnitIds.size : undefined,
        totalUnitCount: effectiveIsSociety && levelState ? levelState.filteredUnits.length : undefined,
        savedPropertyDetails,
        editingUnitId: effectiveIsSociety ? editingUnitId : null,
    });

    const {
        searchTerm,
        setSearchTerm,
        showActiveFirst,
        setShowActiveFirst,
        activeSelectedId,
        handleSelectDiscount,
        handleToggleEnabledWrapped,
        filteredDiscounts,
        selectedDiscount,
        handleErrorTagClick,
        handleSaveClick,
    } = useDiscountSelectionState({
        discountData,
        discountMasterAttributes,
        initialDiscountAttributes: initialDiscountData?.discountAttributes,
        searchParams,
        pathname,
        handleToggleEnabled,
        handleSave,
        isSociety: effectiveIsSociety,
        levelState,
        editingUnitId,
        t,
    });

    return (
        <Tabs value={activeTab} onChange={handleTabChange} variant="pills" size="sm" className="relative w-full p-2 sm:p-2.5">
            {isPendingTransition && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-100 overflow-hidden z-30 rounded-t">
                    <div className="w-full h-full bg-blue-600 animate-pulse origin-left transition-all duration-300" />
                </div>
            )}
            <DiscountFormTabsHeader
                showLevelSelector={showLevelSelector}
                showApartmentTab={showApartmentTab}
                showWingTab={showWingTab}
                level={levelState.level}
                onLevelChange={handleLevelChange}
                isLoading={isPendingTransition}
                isTabLoading={isTabPending}
                isLevelLoading={isLevelPending}
                targetTab={targetTab}
                targetLevel={targetLevel}
                activeTab={activeTab}
                t={t}
            />

            <Tabs.TabPanel
                value="discount"
                className={cn(
                    "h-[calc(100vh-175px)] flex flex-col mt-0 overflow-hidden transition-opacity duration-200",
                    isPendingTransition && "opacity-75 pointer-events-none"
                )}
            >
                <DiscountPane
                    discountData={discountData}
                    savedDiscountState={savedDiscountState}
                    incompleteDiscounts={incompleteDiscounts}
                    handleErrorTagClick={handleErrorTagClick}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    showActiveFirst={showActiveFirst}
                    setShowActiveFirst={setShowActiveFirst}
                    filteredDiscounts={filteredDiscounts}
                    activeSelectedId={activeSelectedId}
                    setSelectedId={handleSelectDiscount}
                    handleToggleEnabled={handleToggleEnabledWrapped}
                    validationErrors={validationErrors}
                    fieldErrors={fieldErrors}
                    selectedDiscount={selectedDiscount}
                    handleInputChange={handleInputChange}
                    handleFileUpload={handleFileUpload}
                    handleFileDelete={handleFileDelete}
                    handleDeleteDiscount={handleDeleteDiscount}
                    isSaving={isSaving}
                    isDeleting={isDeleting}
                    hasChanges={hasChanges}
                    isFormValid={isFormValid}
                    onSave={handleSaveClick}
                    t={t}
                    levelState={levelState}
                    isSociety={effectiveIsSociety}
                    isWingLoading={isLevelPending}
                    savedPropertyDetails={savedPropertyDetails}
                    propertyId={propertyId}
                    societyDetailId={effectiveIsSociety ? (propSocietyDetailId || (effectiveSocietyDetailId ?? undefined)) : undefined}
                />
            </Tabs.TabPanel>

            <Tabs.TabPanel
                value="social"
                className={cn(
                    "h-[calc(100vh-175px)] flex flex-col mt-0 overflow-hidden transition-opacity duration-200",
                    isPendingTransition && "opacity-75 pointer-events-none"
                )}
            >
                <SocialDetailsForm
                    initialSocialData={initialSocialData}
                    propertyId={propertyId}
                    levelState={levelState}
                    isSociety={effectiveIsSociety}
                    societyDetailId={effectiveIsSociety ? (propSocietyDetailId || (effectiveSocietyDetailId ?? undefined)) : undefined}
                    socialMasterAttributes={socialMasterAttributes}
                    isWingLoading={isLevelPending}
                    savedPropertyDetails={savedPropertyDetails}
                />
            </Tabs.TabPanel>
        </Tabs>
    );
};

export default DiscountFormview;
