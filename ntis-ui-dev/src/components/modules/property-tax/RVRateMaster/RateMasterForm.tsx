"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { RateMasterFormProps } from "@/types/RVRateMaster";
import { useRateMasterFilters } from "@/hooks/RVRateMaster/useRateMasterFilters";
import { useRateMasterOperations } from "@/hooks/RVRateMaster/useRateMasterOperations";
import { useRateMasterFormState } from "@/hooks/RVRateMaster/useRateMasterFormState";
import { useRateMasterImportExport } from "@/hooks/RVRateMaster/useRateMasterImportExport";
import { useExistingRateCheck } from "@/hooks/RVRateMaster/useExistingRateCheck";
import { useUrlParamSync } from "@/hooks/RVRateMaster/useUrlParamSync";
import { useRateFormHandlers } from "@/hooks/RVRateMaster/useRateFormHandlers";
import { useLazyDropdownData } from "@/hooks/RVRateMaster/useLazyDropdownData";
import { useRateCategoriesSync } from "@/hooks/RVRateMaster/useRateCategoriesSync";
import { useRateMasterFormEffects } from "@/hooks/RVRateMaster/useRateMasterFormEffects";
import {
  RateMasterFormHeader, RateFiltersSection,
  RateFrequencySection,
  RateCopyMultipliersWrapper,
  RateMatrixSection,
  RateCompletionProgress,
} from "./components";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { ConfigureRatesDrawer } from "./components/ConfigureRatesDrawer";

const RateMasterForm: React.FC<RateMasterFormProps> = ({ id, zoneOptions, useGroupOptions, assessmentYears, assessmentYearRanges, zoneDescriptions, allZones, rateCategories, editData, bulkEditData, backendRates, filterValues, showCopyRateSection, showMultipliersSection, hideMatrixSection, onClose, mode: propMode, paginatedZonesData, initialExistingRatesCheck, rateFrequencyPolicy, rateUnitPolicy, isOpenPlot = false, onDirtyChange }) => {
  const mode: "edit" | "delete" | "add" = propMode || "edit";
  const t = useTranslations("ptis_RVRateMaster");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { confirm } = useConfirm();

  // Use lazy dropdown data hook for on-demand loading
  const {
    zoneOptions: lazyZoneOptions,
    useGroupOptions: lazyUseGroupOptions,
    assessmentYears: lazyAssessmentYears,
    isLoadingZones,
    isLoadingUseGroups,
    isLoadingAssessmentYears,
    loadZoneOptions,
    loadUseGroupOptions,
    loadAssessmentYears,
  } = useLazyDropdownData();

  // Use lazy-loaded options if server-provided options are empty, otherwise use server options
  const finalZoneOptions = zoneOptions && zoneOptions.length > 0 ? zoneOptions : lazyZoneOptions;
  const finalUseGroupOptions = useGroupOptions && useGroupOptions.length > 0 ? useGroupOptions : lazyUseGroupOptions;
  const finalAssessmentYears = assessmentYears && assessmentYears.length > 0 ? assessmentYears : lazyAssessmentYears;

  const { selectedZone, selectedZoneLabel, selectedUseGroup, selectedUseGroupLabel, assessmentYear, assessmentYearLabel, setSelectedZone, setSelectedUseGroup, setAssessmentYear, fetchedBackendRates, rateFrequency, setRateFrequency, rateUnit, setRateUnit, multipliers, setMultipliers, handleDropdownChange } = useRateMasterFilters({ mode, backendRates: backendRates || undefined, filterValues, useGroupOptions: finalUseGroupOptions, rateFrequencyPolicy, rateUnitPolicy });

  const {
    hasConfiguredRates,
    isConfigureRatesOpen,
    localRateCategories,
    handleConfigureSelected,
    handleConfigureRatesClick,
    handleConfigureDrawerClose,
  } = useRateCategoriesSync({
    rateCategories,
    isOpenPlot,
    selectedZone,
    assessmentYear,
    t,
  });

  const { handleBulkCreate, handleBulkUpdate, handleDelete } = useRateMasterOperations({ mode, id: id || undefined, selectedZone, selectedUseGroup, assessmentYear, rateFrequency, rateUnit, multipliers, rateCategories: localRateCategories, useGroupOptions: finalUseGroupOptions, isOpenPlot });

  const { showMatrix, setShowMatrix, matrixData, setMatrixData, matrixPageNumber, matrixPageSize, matrixTotalPages, matrixTotalCount, paginatedZoneDescriptions, allZoneEdits, setAllZoneEdits, existingRateFound, setExistingRateFound, isCheckingRates, setIsCheckingRates, allFiltersSelected, errors, zoneRemarksMap, filledRatesCount, completionPercentage, matrixStorageKey, handleMatrixPaginationChange, buildCompleteMatrixForSubmission } = useRateMasterFormState({ mode, id, editData, bulkEditData, backendRates, fetchedBackendRates, filterValues, selectedZone, selectedUseGroup, assessmentYear, setSelectedZone, setSelectedUseGroup, setAssessmentYear, rateFrequency, setRateFrequency, rateUnit, zoneDescriptions, allZones, rateCategories: localRateCategories, assessmentYears: finalAssessmentYears, zoneOptions: finalZoneOptions, useGroupOptions: finalUseGroupOptions, showCopyRateSection, showMultipliersSection, paginatedZonesData, initialExistingRatesCheck, isOpenPlot });

  const { sourceUseGroup, setSourceUseGroup, sourceRateSection, setSourceRateSection, sourceRateSectionOptions, copySectionsExpanded, setCopySectionsExpanded, copyRatesActiveTab, setCopyRatesActiveTab, showMultipliersInline, setShowMultipliersInline, tempMultipliers, setTempMultipliers, fileInputRef, handleCopyRates, handleCopyRatesFromRateSection, handleDownloadTemplate, handleUploadExcel } = useRateMasterImportExport({ selectedZone, selectedUseGroup, assessmentYear, allZones, zoneDescriptions, rateCategories: localRateCategories, zoneOptions: finalZoneOptions, useGroupOptions: finalUseGroupOptions, assessmentYears: finalAssessmentYears, assessmentYearRanges, matrixData, setMatrixData, allZoneEdits, setAllZoneEdits, setShowMatrix, showMatrix, showCopyRateSection, t, multipliers, setMultipliers, rateUnit });

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(mode === "add" && filledRatesCount > 0);
    }
  }, [onDirtyChange, mode, filledRatesCount]);

  useExistingRateCheck({ mode, id, editData, bulkEditData, selectedZone, selectedUseGroup, assessmentYear, allFiltersSelected, setExistingRateFound, setIsCheckingRates, isOpenPlot, rateCategories: localRateCategories });
  useUrlParamSync({ selectedZone, selectedUseGroup, assessmentYear, copySectionsExpanded, showMultipliersInline, isOpenPlot });

  // Handle all form side effects
  const isEditMode = !!id || !!editData || !!bulkEditData;
  useRateMasterFormEffects({
    isOpenPlot,
    filterValues,
    finalZoneOptions,
    finalUseGroupOptions,
    finalAssessmentYears,
    loadZoneOptions,
    loadUseGroupOptions,
    loadAssessmentYears,
    showMatrix,
    setShowMatrix,
    matrixData,
    setMatrixData,
    localRateCategories,
    selectedZone,
    selectedUseGroup,
    assessmentYear,
    isEditMode,
    existingRateFound,
    t,
  });

  const { handleAddRates, handleUpdateRates, handleDeleteRates, handleGenerateMatrix, handleToggleMultipliers, handleToggleCopyRates, handleCloseCopySection, handleCloseMultipliersSection, handleApplyMultipliers, handleCopyRatesWithValidation } = useRateFormHandlers({ mode, id, editData, bulkEditData, selectedZone, selectedUseGroup, assessmentYear, existingRateFound, rateCategories: localRateCategories, useGroupOptions: finalUseGroupOptions, zoneOptions: finalZoneOptions, assessmentYears: finalAssessmentYears, assessmentYearRanges, zoneDescriptions, paginatedZoneDescriptions, matrixStorageKey, locale, onClose, router, confirm, buildCompleteMatrixForSubmission, handleBulkCreate, handleBulkUpdate, handleDelete, setMatrixData, setShowMatrix, setCopySectionsExpanded, setShowMultipliersInline, setMultipliers, tempMultipliers, sourceUseGroup, handleCopyRates, t, isOpenPlot });

  const isDrawerMode = !!onClose;
  const isImportDisabled = existingRateFound || !selectedZone || selectedZone === 'ALL' ||
    (!isOpenPlot && (!selectedUseGroup || selectedUseGroup === 'ALL')) || !assessmentYear || assessmentYear === 'ALL' ||
    (isOpenPlot && !hasConfiguredRates);

  return (
    <div className={isDrawerMode ? "space-y-3" : "max-w-7xl mx-auto p-2 md:p-3"}>
      {!isDrawerMode && <RateMasterFormHeader id={id} t={t} />}
      <div className="space-y-3">
        <RateFrequencySection
          rateFrequency={rateFrequency}
          onRateFrequencyChange={setRateFrequency}
          rateUnit={rateUnit}
          onRateUnitChange={setRateUnit}
          mode={mode}
          onDownloadTemplate={handleDownloadTemplate}
          onUploadClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          onFileChange={handleUploadExcel}
          isDisabled={isImportDisabled}
          isFrequencyLocked={true}
          isUnitLocked={true}
          t={t}
        />
        <div className="bg-[#f8faff] rounded-xl border border-blue-200 shadow-md p-1">
          <RateFiltersSection
            selectedZone={selectedZone}
            selectedUseGroup={selectedUseGroup}
            assessmentYear={assessmentYear}
            zoneOptions={finalZoneOptions}
            useGroupOptions={finalUseGroupOptions}
            assessmentYears={finalAssessmentYears}
            assessmentYearRanges={assessmentYearRanges}
            errors={errors}
            allFiltersSelected={allFiltersSelected}
            existingRateFound={existingRateFound}
            isCheckingRates={isCheckingRates}
            mode={mode}
            isLoadingZones={isLoadingZones}
            isLoadingUseGroups={isLoadingUseGroups}
            isLoadingAssessmentYears={isLoadingAssessmentYears}
            onDropdownChange={handleDropdownChange}
            onGenerateMatrix={handleGenerateMatrix}
            onToggleMultipliers={() => handleToggleMultipliers(showMultipliersInline)}
            onToggleCopyRates={handleToggleCopyRates}
            onLoadZones={loadZoneOptions}
            onLoadUseGroups={loadUseGroupOptions}
            onLoadAssessmentYears={loadAssessmentYears}
            t={t}
            isOpenPlot={isOpenPlot}
            hasConfiguredRates={hasConfiguredRates}
            onConfigureRates={handleConfigureRatesClick}
          />
          {mode === "add" && (
            <RateCopyMultipliersWrapper
              copySectionsExpanded={copySectionsExpanded}
              showMultipliersInline={showMultipliersInline}
              sourceUseGroup={sourceUseGroup}
              setSourceUseGroup={setSourceUseGroup}
              sourceRateSection={sourceRateSection}
              setSourceRateSection={setSourceRateSection}
              sourceRateSectionOptions={sourceRateSectionOptions}
              copyRatesActiveTab={copyRatesActiveTab}
              setCopyRatesActiveTab={setCopyRatesActiveTab}
              useGroupOptions={finalUseGroupOptions}
              selectedUseGroup={selectedUseGroup}
              selectedZone={selectedZone}
              onCopyRates={handleCopyRatesWithValidation}
              onCopyRatesFromRateSection={handleCopyRatesFromRateSection}
              onCloseCopySection={handleCloseCopySection}
              tempMultipliers={tempMultipliers}
              setTempMultipliers={setTempMultipliers}
              onApplyMultipliers={handleApplyMultipliers}
              onCloseMultipliersSection={handleCloseMultipliersSection}
              t={t}
            />
          )}
          {showMatrix && !hideMatrixSection && (
            <>
              <RateMatrixSection
                matrixData={matrixData}
                setMatrixData={setMatrixData}
                setAllZoneEdits={setAllZoneEdits}
                rateCategories={localRateCategories}
                selectedZone={selectedZone}
                selectedZoneLabel={selectedZoneLabel}
                selectedUseGroup={selectedUseGroup}
                selectedUseGroupLabel={selectedUseGroupLabel}
                assessmentYear={assessmentYear}
                assessmentYearLabel={assessmentYearLabel}
                rateUnit={rateUnit}
                zoneOptions={finalZoneOptions}
                useGroupOptions={finalUseGroupOptions}
                assessmentYears={finalAssessmentYears}
                assessmentYearRanges={assessmentYearRanges}
                zoneRemarksMap={zoneRemarksMap}
                filledRatesCount={filledRatesCount}
                matrixPageNumber={matrixPageNumber}
                matrixPageSize={matrixPageSize}
                matrixTotalPages={matrixTotalPages}
                matrixTotalCount={matrixTotalCount}
                onPaginationChange={handleMatrixPaginationChange}
                mode={mode}
                id={id}
                onAddRates={handleAddRates}
                onUpdateRates={handleUpdateRates}
                onDeleteRates={handleDeleteRates}
                existingRateFound={existingRateFound}
                multipliers={multipliers}
                t={t}
                tCommon={tCommon}
              />
              <RateCompletionProgress completionPercentage={completionPercentage} t={t} />
            </>
          )}
        </div>
      </div>
      <ConfigureRatesDrawer
        open={isConfigureRatesOpen}
        onClose={handleConfigureDrawerClose}
        isMatrixVisible={showMatrix}
        currentCategories={localRateCategories}
        onConfigureSelected={handleConfigureSelected}
        isOpenPlot={isOpenPlot}
      />
    </div>
  );
};

export default RateMasterForm;
