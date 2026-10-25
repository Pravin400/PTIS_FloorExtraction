'use client';

import React, { useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DocumentViewerModal } from '@/components/common';
import { BuildingSidebar } from './BuildingSidebar';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useTranslations, useLocale } from 'next-intl';
import { getCertificateLengthRule } from '@/lib/validation/building/validation-rules';
import { mapTypeNameToKey } from '@/lib/utils/building-helpers';
import { useCertificateModalState } from '@/hooks/useCertificateModalState';
import type { BuildingPermissionSectionProps, UnitRow } from './permission/building-permission.types';
import { calculateEffectiveConstructionYear, getSidebarValidationErrors } from './permission/building-permission.utils';
import { resolveInitialPermissionParams } from './permission/resolve-initial-permission-params';
import { useUnitSelection } from './permission/useUnitSelection';
import { useUnitStatusMap } from './permission/useUnitStatusMap';
import { useBuildingPermissionStatus } from './permission/useBuildingPermissionStatus';
import { useBuildingPermissionSave } from './permission/useBuildingPermissionSave';
import { useBuildingPermissionDelete } from './permission/useBuildingPermissionDelete';
import { usePermissionUiState } from './permission/usePermissionUiState';
import { BuildingSavingOverlay } from './permission/BuildingSavingOverlay';
import { BuildingPermissionHeader } from './permission/BuildingPermissionHeader';
import { BuildingScopeGuidanceBanner } from './permission/BuildingScopeGuidanceBanner';
import { BuildingWingSelector } from './permission/BuildingWingSelector';
import { BuildingUnitSelectionTable } from './permission/BuildingUnitSelectionTable';
import { BuildingUnitScopeBanner } from './permission/BuildingUnitScopeBanner';
import { BuildingDocumentAndDetailsForm } from './permission/BuildingDocumentAndDetailsForm';
import { BuildingActionErrorBanner } from './permission/BuildingActionErrorBanner';
import { BuildingActionFooter } from './permission/BuildingActionFooter';

export type { UnitRow, BuildingPermissionSectionProps };

export function BuildingPermissionSection({
  propertyId, categoryId, categoryName, societyId, wingDetailId: propWingDetailId,
  wings = [], units = [], certificateTypes = [], initialCertificateGrid = null,
  initialLevel = 'Apartment', initialCertificateTypeId = 3, initialData = null,
  propertyConstructionYear, onSave, onDelete, onDeleteRecord, isSaving = false,
}: BuildingPermissionSectionProps): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('quickDataEntry');
  const locale = useLocale();
  const { confirm } = useConfirm();

  const [directEditingUnitId, setDirectEditingUnitId] = React.useState<number | null>(null);

  const {
    initialWingDetailId, isApartmentIndividual, showApartmentTab,
    showWingTab, showLevelSelector, effectiveInitialLevel, resolvedCertTypeId,
  } = resolveInitialPermissionParams({
    searchParams, societyId, wingDetailId: propWingDetailId, categoryName,
    categoryId, wings, units, certificateTypes, initialLevel, initialCertificateTypeId,
  });

  const {
    level, setLevel, selectedWingDetailId, setSelectedWingDetailId, unitSearchQuery, setUnitSearchQuery,
    wingFilter, setWingFilter, selectedTypeId, setSelectedTypeId, activeCertificateType, certificateDate,
    setCertificateDate, certificateNumber, setCertificateNumber, status, remarks, attachedFiles, setAttachedFiles,
    existingDocumentGuid, setExistingDocumentGuid, existingFileName, setExistingFileName, existingPropertyCertificateId,
    setExistingPropertyCertificateId, hasExistingDocument, setHasExistingDocument, wings: activeWings,
    certificateTypes: activeCertificateTypes, filteredUnits, isLoadingMoreUnits, loadNextUnitsPage,
    gridItems, gridRecords, isLoadingGridRecords, activeCertificate, inheritedFrom, refetchGrid,
    selectedUnitIds, setSelectedUnitIds,
  } = useCertificateModalState({
    propertyId, societyId, wings, units, certificateTypes, initialCertificateGrid,
    initialLevel: isApartmentIndividual ? 'Unit' : effectiveInitialLevel,
    initialWingDetailId: initialWingDetailId != null ? Number(initialWingDetailId) : undefined,
    initialCertificateTypeId: resolvedCertTypeId ?? undefined,
    initialCertificateNumber: searchParams?.get('certificateNumber') ?? searchParams?.get('permitNo') ?? undefined,
    initialCertificateDate: searchParams?.get('certificateDate') ?? searchParams?.get('permitDate') ?? searchParams?.get('date') ?? undefined,
    initialDocumentGuid: searchParams?.get('documentGuid') ?? undefined,
    initialFileName: searchParams?.get('fileName') ?? undefined,
    initialPropertyCertificateId: searchParams?.get('propertyCertificateId') ? Number(searchParams.get('propertyCertificateId')) : undefined,
    initialUnitNo: searchParams?.get('unitNo') ?? searchParams?.get('partitionNo') ?? undefined,
    initialData,
  });

  const {
    searchTerm, setSearchTerm, showActiveFirst, setShowActiveFirst, enabledStateMap, setEnabledStateMap,
    removedAttachmentTypeIds, setRemovedAttachmentTypeIds, isDeletingRecord, setIsDeletingRecord,
    actionError, setActionError, statusFilter, setStatusFilter, viewerData, setViewerData,
    fieldErrors, setFieldErrors, uploadedFileNamesMap, setUploadedFileNamesMap,
    handleToggleEnabled, handleSelectLevel,
  } = usePermissionUiState({
    selectedTypeId, setSelectedTypeId, level, setLevel, selectedWingDetailId, setWingFilter,
    selectedUnitIds, filteredUnits, units, gridItems, societyId, isApartmentIndividual, initialData,
    setCertificateNumber, setCertificateDate, setAttachedFiles, searchParams, router, pathname,
  });

  const { allUnitsList, unitStatusMap } = useUnitStatusMap({
    units,
    filteredUnits,
    selectedWingDetailId,
    gridItems,
    selectedTypeId,
    societyId,
  });

  const {
    isAllUnitsSelected,
    hasSelectableUnits,
    handleToggleAllUnits,
    handleToggleUnitSelection,
    handleEditUnit,
    handleClearSelection,
  } = useUnitSelection({
    selectedUnitIds,
    setSelectedUnitIds,
    filteredUnits,
    setFieldErrors,
    unitStatusMap,
    directEditingUnitId,
    setDirectEditingUnitId,
  });

  const activeCertKey = useMemo(() => mapTypeNameToKey(activeCertificateType?.certificateTypeName || '', activeCertificateType?.certificateTypeCode), [activeCertificateType]);
  const activeCertificateDisplayName = useMemo(() => activeCertKey && t(`building.${activeCertKey}`) && t(`building.${activeCertKey}`) !== `building.${activeCertKey}` ? t(`building.${activeCertKey}`) : activeCertificateType?.certificateTypeName || 'Certificate', [activeCertKey, activeCertificateType, t]);
  const activeWing = activeWings.find((w) => w.wingDetailId === selectedWingDetailId);
  const activeWingName = activeWing?.wingName || (wingFilter && wingFilter !== 'all' ? wingFilter : '');
  const lengthRule = useMemo(() => getCertificateLengthRule(activeCertificateType?.certificateTypeName, activeCertificateType?.certificateTypeCode), [activeCertificateType]);
  const isNumericOnly = activeCertKey === 'aadharCard' || activeCertKey === 'electricBill';

  useEffect(() => {
    if (level === 'Apartment' && !showApartmentTab) setLevel(showWingTab ? 'Wing' : 'Unit');
    else if (level === 'Wing' && !showWingTab) setLevel('Unit');
  }, [level, showApartmentTab, showWingTab, setLevel]);

  const effectiveConstructionYear = useMemo(() => calculateEffectiveConstructionYear({ level, selectedUnitIds, units, filteredUnits, selectedWingDetailId, propertyConstructionYear }), [level, selectedUnitIds, units, filteredUnits, selectedWingDetailId, propertyConstructionYear]);
  const sidebarValidationErrors = useMemo(() => getSidebarValidationErrors(fieldErrors, selectedTypeId), [fieldErrors, selectedTypeId]);

  const {
    certificatesList, activeUnitStat, deleteAccessInfo,
    isFormDisabled, isCurrentCertEnabled, isDirty, isCertificateFilled,
    appliedUnitsCount, selectedUnitNamesSummary,
  } = useBuildingPermissionStatus({
    units, filteredUnits, activeCertificateTypes, selectedTypeId, level, selectedWingDetailId,
    selectedUnitIds, gridItems, societyId, isApartmentIndividual, initialData, activeCertificate,
    certificateNumber, certificateDate, attachedFiles, existingDocumentGuid, hasExistingDocument,
    removedAttachmentTypeIds, enabledStateMap, inheritedFrom, isSaving,
    unitStatusMap, allUnitsList,
    t: (k, v) => t(k, v),
  });

  const { handleSaveClick } = useBuildingPermissionSave({
    certificateNumber, certificateDate, activeCertificateType, activeCertificateDisplayName, activeWingName,
    effectiveConstructionYear, attachedFiles, setAttachedFiles, level, initialData, removedAttachmentTypeIds,
    selectedTypeId, activeCertificate, gridRecords, existingDocumentGuid, existingFileName,
    existingPropertyCertificateId, hasExistingDocument, isApartmentIndividual, selectedWingDetailId,
    selectedUnitIds, filteredUnits, units, unitStatusMap, activeUnitStat, isAllUnitsSelected,
    directEditingUnitId, setDirectEditingUnitId,
    status, remarks, onSave, refetchGrid, setFieldErrors, setActionError, setUploadedFileNamesMap, confirm, t: (k, v) => t(k, v),
  });

  const { handleDeleteClick } = useBuildingPermissionDelete({
    selectedTypeId, deleteAccessInfo, activeCertificate, isApartmentIndividual, initialData,
    certificateNumber, setCertificateNumber, certificateDate, setCertificateDate, attachedFiles,
    setAttachedFiles, setExistingDocumentGuid, setExistingFileName, setExistingPropertyCertificateId,
    setHasExistingDocument, setEnabledStateMap, setFieldErrors, setUploadedFileNamesMap, setSelectedUnitIds,
    refetchGrid, setIsDeletingRecord, setActionError, activeCertificateType, societyId, level, gridItems,
    selectedWingDetailId, activeWings, propertyId, confirm, onDeleteRecord, onDelete, t: (k, v) => t(k, v),
  });

  return (
    <div className="relative flex-1 flex flex-col min-h-0 h-full overflow-hidden p-2 sm:p-2.5 gap-2">
      <BuildingSavingOverlay isSaving={isSaving} t={(k) => t(k)} />
      <BuildingPermissionHeader
        showLevelSelector={showLevelSelector}
        showApartmentTab={showApartmentTab}
        showWingTab={showWingTab}
        level={level}
        onSelectLevel={(lvl) => {
          setDirectEditingUnitId(null);
          setSelectedUnitIds(new Set());
          handleSelectLevel(lvl);
        }}
        isLoading={isLoadingGridRecords}
        t={(k) => t(k)}
      />
      <BuildingScopeGuidanceBanner isApartmentIndividual={isApartmentIndividual} level={level} t={(k) => t(k)} />

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full min-h-0">
          <BuildingSidebar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showActiveFirst={showActiveFirst}
            onShowActiveChange={setShowActiveFirst}
            certificates={certificatesList}
            selectedTypeId={selectedTypeId}
            onSelect={(id) => {
              setSelectedTypeId(id);
              setDirectEditingUnitId(null);
              setSelectedUnitIds(new Set());
              setFieldErrors({});
              setActionError(null);
            }}
            onToggleEnabled={handleToggleEnabled}
            validationErrors={sidebarValidationErrors}
            t={(k) => t(k)}
          />
        </div>

        <div className="relative lg:col-span-8 xl:col-span-9 flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-xl p-3 overflow-y-auto space-y-2.5 shadow-xs">
          {isLoadingGridRecords && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-xl transition-all duration-200">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200/90 text-slate-700 rounded-xl shadow-lg text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                <span>{t('building.fetchingWingData') || t('actions.loading') || 'Fetching wing data...'}</span>
              </div>
            </div>
          )}

          <BuildingWingSelector isApartmentIndividual={isApartmentIndividual} level={level} activeWings={activeWings} selectedWingDetailId={selectedWingDetailId} isLoadingGridRecords={isLoadingGridRecords} fieldErrors={fieldErrors} onSelectWing={(id) => { setSelectedWingDetailId(id); setFieldErrors((p) => { if (!p.wing) return p; const n = { ...p }; delete n.wing; return n; }); setWingFilter(String(id)); const p = new URLSearchParams(window.location.search); p.set('wingDetailId', String(id)); window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`); }} t={(k) => t(k)} />

          <BuildingUnitSelectionTable
            isApartmentIndividual={isApartmentIndividual}
            level={level}
            filteredUnits={filteredUnits}
            activeWings={activeWings}
            selectedUnitIds={selectedUnitIds}
            unitSearchQuery={unitSearchQuery}
            setUnitSearchQuery={setUnitSearchQuery}
            wingFilter={wingFilter}
            setWingFilter={setWingFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            appliedUnitsCount={appliedUnitsCount}
            handleClearSelection={handleClearSelection}
            isAllUnitsSelected={isAllUnitsSelected}
            hasSelectableUnits={hasSelectableUnits}
            handleToggleAllUnits={handleToggleAllUnits}
            handleToggleUnitSelection={handleToggleUnitSelection}
            handleEditUnit={handleEditUnit}
            loadNextUnitsPage={loadNextUnitsPage}
            isLoadingMoreUnits={isLoadingMoreUnits}
            fieldErrors={fieldErrors}
            unitStatusMap={unitStatusMap}
            setSelectedWingDetailId={setSelectedWingDetailId}
            setViewerData={setViewerData}
            locale={locale}
            t={(k, v) => t(k, v)}
          />

          <BuildingUnitScopeBanner isApartmentIndividual={isApartmentIndividual} level={level} selectedUnitIds={selectedUnitIds} isCurrentCertEnabled={isCurrentCertEnabled} activeWingName={activeWingName} selectedUnitNamesSummary={selectedUnitNamesSummary} activeCertificate={activeCertificate} activeUnitStat={activeUnitStat} inheritedFrom={inheritedFrom} allUnitsList={allUnitsList} unitStatusMap={unitStatusMap} t={(k, v) => t(k, v)} />

          <BuildingDocumentAndDetailsForm isApartmentIndividual={isApartmentIndividual} level={level} selectedUnitNamesSummary={selectedUnitNamesSummary} selectedUnitIds={selectedUnitIds} isCurrentCertEnabled={isCurrentCertEnabled} activeWingName={activeWingName} activeCertificateType={activeCertificateType} activeCertificateDisplayName={activeCertificateDisplayName} attachedFiles={attachedFiles} setAttachedFiles={setAttachedFiles} removedAttachmentTypeIds={removedAttachmentTypeIds} setRemovedAttachmentTypeIds={setRemovedAttachmentTypeIds} selectedTypeId={selectedTypeId} uploadedFileNamesMap={uploadedFileNamesMap} setUploadedFileNamesMap={setUploadedFileNamesMap} existingDocumentGuid={existingDocumentGuid} existingFileName={existingFileName} activeCertificate={activeCertificate} activeUnitStat={activeUnitStat} initialData={initialData} isFormDisabled={isFormDisabled} fieldErrors={fieldErrors} setFieldErrors={setFieldErrors} setEnabledStateMap={setEnabledStateMap} certificateNumber={certificateNumber} setCertificateNumber={setCertificateNumber} lengthRule={lengthRule} isNumericOnly={isNumericOnly} certificateDate={certificateDate} setCertificateDate={setCertificateDate} effectiveConstructionYear={effectiveConstructionYear} t={(k, v) => t(k, v)} />
        </div>
      </div>

      <BuildingActionErrorBanner actionError={actionError} onDismiss={() => setActionError(null)} />
      <BuildingActionFooter canRenderDelete={Boolean(onDeleteRecord || onDelete)} deleteAccessInfo={deleteAccessInfo} isSaving={isSaving} isDeletingRecord={isDeletingRecord} onDeleteClick={handleDeleteClick} onSaveClick={handleSaveClick} isFormDisabled={isFormDisabled} isDirty={isDirty} isCertificateFilled={isCertificateFilled} t={(k) => t(k)} />

      {viewerData && (
        <DocumentViewerModal isOpen={viewerData.isOpen} onClose={() => { if (viewerData.url.startsWith('blob:')) URL.revokeObjectURL(viewerData.url); setViewerData(null); }} fileUrl={viewerData.url} fileName={viewerData.name} label={activeCertificateType?.certificateTypeName} />
      )}
    </div>
  );
}
