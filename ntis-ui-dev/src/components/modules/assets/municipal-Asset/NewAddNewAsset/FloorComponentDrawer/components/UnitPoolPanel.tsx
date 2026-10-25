'use client';

import React, { useEffect, useState } from 'react';
import { LoadingState } from '@/components/common/LoadingState';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { SubUnitDetailedConfigurator } from './sub-units/SubUnitDetailedConfigurator';
import { useNAAssetForm } from '../../NAAssetFormContext';
import { useTranslations } from 'next-intl';
import { useNAUnitPool } from '@/hooks/asset-hooks/floor-details/useNAUnitPool';
import { useNAUnitPoolGeneration } from '@/hooks/asset-hooks/floor-details/useNAUnitPoolGeneration';
import { useNAUnitPoolSave } from '@/hooks/asset-hooks/floor-details/useNAUnitPoolSave';
import { UnitPoolTable } from './UnitPoolTable';
import { UnitGenerationForm } from './UnitGenerationForm';
import { UnitPoolPanelHeader } from './UnitPoolPanelHeader';
import { UnitPoolPanelStatus } from './UnitPoolPanelStatus';
import { UnitPoolPanelDrawers } from './UnitPoolPanelDrawers';
import { buildConfiguratorUnit } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-utils';
import type { UnitPoolPanelProps } from '@/types/asset/floor-details.types';

// ─────────────────────────────────────────────────────────────────────────────

export function UnitPoolPanel({
  dropdownOptions,
  initialSubUnits = [],
  initialFloors = [],
  editEventRegistry: editEventRegistryRef,
  mode = 'floorSubmission',
  editFloorId,
  onSuccess,
}: UnitPoolPanelProps) {
  const { formData, registerSubmitHook } = useNAAssetForm();
  const { confirm } = useConfirm();
  const t = useTranslations('addAssetForm');

  const [isUnitGenerationEnabled, setIsUnitGenerationEnabled] = useState(
    mode === 'generateUnits' || initialSubUnits.length > 0
  );

  const poolState = useNAUnitPool({ dropdownOptions, initialSubUnits, initialFloors, formData, t, onSuccess });

  // ── Auto-open unit configurator if editFloorId is passed down ───────────────
  const hasAutoTriggeredRef = React.useRef(false);
  useEffect(() => {
    if (editFloorId && poolState.pool.length > 0 && !hasAutoTriggeredRef.current) {
      const unitToConfig = poolState.pool.find(
        (u) =>
          Number(u.dbId) === editFloorId ||
          Number(u.id) === editFloorId ||
          Number(u.tempId) === editFloorId ||
          Number(u.assetId) === editFloorId ||
          Number((u as { subUnitsDetailsId?: number | string }).subUnitsDetailsId) === editFloorId
      );
      if (unitToConfig) {
        hasAutoTriggeredRef.current = true;
        poolState.handleConfigureUnit(unitToConfig);
      }
    }
  }, [editFloorId, poolState]);

  useEffect(() => {
    if (editEventRegistryRef) {
      editEventRegistryRef.current = {
        triggerEdit: (childAssetId: number) => {
          const unitToConfig = poolState.pool.find(
            (u) =>
              Number(u.dbId) === childAssetId ||
              Number(u.id) === childAssetId ||
              Number(u.tempId) === childAssetId ||
              Number(u.assetId) === childAssetId ||
              Number((u as { subUnitsDetailsId?: number | string }).subUnitsDetailsId) === childAssetId
          );
          if (unitToConfig) {
            poolState.handleConfigureUnit(unitToConfig);
          }
        }
      };
    }
  }, [editEventRegistryRef, poolState]);

  const generation = useNAUnitPoolGeneration({
    dropdownOptions,
    formData,
    t,
    setPool: poolState.setPool,
    setParentFloors: poolState.setParentFloors,
  });

  const handleSaveAll = useNAUnitPoolSave({
    pool: poolState.pool,
    setPool: poolState.setPool,
    parentFloors: poolState.parentFloors,
    setParentFloors: poolState.setParentFloors,
    formData,
    t,
    setIsSaving: poolState.setIsSaving,
    floorOpenSpaces: poolState.floorOpenSpaces,
    floorAmenities: poolState.floorAmenities,
    floorConfigDirty: poolState.floorConfigDirty,
    setFloorConfigDirty: poolState.setFloorConfigDirty,
  });

  // ── Register handleSaveAll as the SAVE & NEXT submit hook ─────────────────
  useEffect(() => {
    if (registerSubmitHook) registerSubmitHook(handleSaveAll);
    return () => {
      if (registerSubmitHook) registerSubmitHook(null);
    };
  }, [registerSubmitHook, handleSaveAll]);

  if (poolState.isLoadingDetails) {
    return (
      <LoadingState
        message="Loading unit configurations..."
        minHeight=""
        messageClassName="text-xs font-bold text-slate-500 uppercase tracking-widest"
        className="fixed inset-0 z-[60] bg-slate-50 p-8"
      />
    );
  }

  if (poolState.activeUnit) {
    return (
      <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col">
        <SubUnitDetailedConfigurator
          key={String(poolState.activeUnit.dbId ?? poolState.activeUnit.id ?? '')}
          unit={buildConfiguratorUnit(poolState.activeUnit)}
          floors={poolState.parentFloors}
          parentBuildingName={formData.assetName || 'Unit Configuration'}
          onSave={poolState.handleSaveUnitDetail}
          onCancel={() => poolState.setActiveUnit(null)}
          dropdownOptions={poolState.enhancedDropdownOptions}
          suppressToast={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <UnitPoolPanelHeader 
        poolCount={poolState.pool.length} 
        savedCount={poolState.savedCount} 
        t={t} 
        isUnitGenerationEnabled={isUnitGenerationEnabled}
        onToggle={mode === 'generateUnits' ? undefined : setIsUnitGenerationEnabled}
      />

      {isUnitGenerationEnabled && (
        <div className="space-y-4">
          {/* ── Generate Units ── */}
          <UnitGenerationForm
            dropdownOptions={dropdownOptions}
            genType={generation.genType}
            setGenType={generation.setGenType}
            genFromFloor={generation.genFromFloor}
            setGenFromFloor={generation.setGenFromFloor}
            genToFloor={generation.genToFloor}
            setGenToFloor={generation.setGenToFloor}
            genCountPerFloor={generation.genCountPerFloor}
            setGenCountPerFloor={generation.setGenCountPerFloor}
            genConYear={generation.genConYear}
            setGenConYear={generation.setGenConYear}
            genConType={generation.genConType}
            setGenConType={generation.setGenConType}
            genUseType={generation.genUseType}
            setGenUseType={generation.setGenUseType}
            genSubUseType={generation.genSubUseType}
            setGenSubUseType={generation.setGenSubUseType}
            dynamicSubUseTypes={generation.dynamicSubUseTypes}
            isSubUseTypesLoading={generation.isSubUseTypesLoading}
            isGenerating={generation.isGenerating}
            handleGenerate={generation.handleGenerate}
            TYPE_OPTIONS={generation.TYPE_OPTIONS}
            t={t}
          />

          <UnitPoolTable
            paginatedRows={poolState.paginatedRows}
            totalRows={poolState.totalRows}
            setCurrentPage={poolState.setCurrentPage}
            activePage={poolState.activePage}
            totalPages={poolState.totalPages}
            PAGE_SIZE={poolState.PAGE_SIZE}
            setActiveUnit={poolState.setActiveUnit}
            handleRemove={poolState.handleRemove}
            editEventRegistry={editEventRegistryRef}
            confirm={confirm}
            t={t}
            dropdownOptions={dropdownOptions}
          />

          {/* Status hint — saving is triggered by the SAVE & NEXT button in the footer */}
          {poolState.tableRows.length > 0 && (
            <UnitPoolPanelStatus isSaving={poolState.isSaving} unsavedCount={poolState.unsavedCount} t={t} />
          )}
        </div>
      )}

      {isUnitGenerationEnabled && <UnitPoolPanelDrawers poolState={poolState} />}
    </div>
  );
}
