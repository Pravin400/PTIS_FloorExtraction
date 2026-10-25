'use client';

import React, { useMemo } from 'react';
import { useNAAssetForm } from '../../../NAAssetFormContext';
import { MediaPanelProvider } from '@/hooks/ptis/photoplan/useMediaPanelVisibility';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useTranslations } from 'next-intl';
import { useSubUnitMediaStaging } from '@/hooks/asset-hooks/useSubUnitMediaStaging';
import { useSubUnitFloorSelection } from '@/hooks/asset-hooks/useSubUnitFloorSelection';
import { useNASubUnitRenterInlineEdit } from '@/hooks/asset-hooks/useNASubUnitRenterInlineEdit';
import { useSubUnitSave } from '@/hooks/asset-hooks/useSubUnitSave';
import { useNASubUnitConfiguratorState } from '@/hooks/asset-hooks/useNASubUnitConfiguratorState';
import { SubUnitConfiguratorHeader } from './SubUnitConfiguratorHeader';
import { SubUnitConfiguratorFooter } from './SubUnitConfiguratorFooter';
import { SubUnitConfiguratorBody } from './SubUnitConfiguratorBody';
import { SubUnitConfiguratorDrawers } from '../../../sub-units/SubUnitConfiguratorDrawers';
import { SubUnitRoomsAndSpacesTables } from '../../../sub-units/SubUnitRoomsAndSpacesTables';
import { calculateSubUnitArea, resolveUnitTypeInfo } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/subunit-form.utils';
import { computeSubUnitValidationErrors } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/subunit-validation.utils';
import { useSubUnitDuplicateMode } from '@/hooks/asset-hooks/floor-details/useSubUnitDuplicateMode';
import { DuplicateEntriesTable } from './DuplicateEntriesTable';
import type { SubUnitDetailedConfiguratorProps } from '@/types/asset/sub-units.types';

export function SubUnitDetailedConfigurator({
  unit,
  parentBuildingName,
  onSave,
  onCancel,
  floors = [],
  dropdownOptions = null,
  suppressToast = false,
}: SubUnitDetailedConfiguratorProps) {
  const t = useTranslations('addAssetForm');
  const { confirm } = useConfirm();
  const { formData: globalFormData, subunitFiles } = useNAAssetForm();
  const assetId = unit.id || unit.dbId;
  const staged = subunitFiles?.[assetId];

  const {
    formData, setFormData,
    roomsList, setRoomsList,
    openSpacesList, setOpenSpacesList,
    isRoomsDrawerOpen, setIsRoomsDrawerOpen,
    isOpenSpacesDrawerOpen, setIsOpenSpacesDrawerOpen,
    submissionType, setSubmissionType,
    handleChange,
  } = useNASubUnitConfiguratorState(unit, globalFormData);

  const {
    stagedFiles,
    initialPhotoSlots,
    initialPhotos,
    isFetchingDb,
    handleFileStaged,
    handleFileUnstaged,
    handleFileReplaced,
  } = useSubUnitMediaStaging(unit, staged);

  const {
    handleLocalNameChange,
    handleLocalNameBlur,
    handleLocalRenterNameChange,
    handleLocalRenterNameBlur,
    handleRenterToggle,
    handleChangeWithTransliteration,
  } = useNASubUnitRenterInlineEdit(formData, setFormData, t, handleChange);

  const {
    loading,
    departments,
    dynamicSubUseTypes,
    subFloorOptions,
    floorSelectOptions,
    handleFloorSelect,
    handleUseTypeSelect,
  } = useSubUnitFloorSelection(unit, globalFormData, floors, dropdownOptions, formData, setFormData);

  const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  const area = calculateSubUnitArea(roomsList, openSpacesList, formData.carpetAreaSqFeet);

  const {
    duplicateEntries,
    removeDuplicateEntry,
    loadEntryForEdit,
    editingDuplicateId,
    cancelEditDuplicate,
    handleAddFloor,
    handleSyncUnitFloor,
    syncRenterToAllEntries,
  } = useSubUnitDuplicateMode({
    formData,
    setFormData,
    roomsList,
    setRoomsList,
    openSpacesList,
    setOpenSpacesList,
    confirm,
    onSave,
    targetAssetId: Number(assetId || globalFormData?.id || 0),
    dropdownOptions,
    subFloorOptions,
    dynamicSubUseTypes,
    area,
    setSubmissionType,
  });

  const onFloorSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleFloorSelect(e);
    const selectedFloorId = Number(e.target.value);
    if (selectedFloorId > 0) {
      const floorOption = (dropdownOptions?.floorLevels || []).find(
        (l: { label: string; value: string | number }) => String(l.value) === String(selectedFloorId)
      );
      const resolvedFloorLabel = floorOption?.label || String(selectedFloorId);
      handleSyncUnitFloor(selectedFloorId, resolvedFloorLabel);
    }
  };

  const handleRenterToggleWithSync = (val: string) => {
    handleRenterToggle(val);
    const isTrue = val === 'true';
    if (isTrue) {
      syncRenterToAllEntries(true);
    }
  };

  // Build a label-map so the duplicate table can show human-readable construction type
  const conTypeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    (dropdownOptions?.constructionTypes || []).forEach((o: { label: string; value: string | number }) => map.set(String(o.value), o.label));
    return map;
  }, [dropdownOptions]);

  const { handleSaveClick } = useSubUnitSave(
    formData,
    roomsList,
    openSpacesList,
    area,
    submissionType,
    stagedFiles,
    suppressToast,
    t,
    onSave,
    false,
    duplicateEntries
  );

  const errors = React.useMemo(() => computeSubUnitValidationErrors(formData, t), [formData, t]);
  const inp = 'h-[25px] text-[10px] !px-2 !py-0.5 !rounded-md';
  const { isShop, isOffice, isRoom, isDepartment, sectionTitle, showRentSection, isRenter } =
    resolveUnitTypeInfo(unit, formData, t);

  const occupantFieldProps = {
    formData, setFormData, errors,
    handleChange: handleChangeWithTransliteration,
    handleLocalNameChange, handleLocalNameBlur,
    handleLocalRenterNameChange, handleLocalRenterNameBlur,
    selectOnFocus, isShop, isOffice, isRoom, isDepartment, inp, t,
  };

  // Show added floors table directly whenever entries exist
  const duplicateTableNode = duplicateEntries.length > 0 ? (
    <DuplicateEntriesTable
      entries={duplicateEntries}
      onEdit={loadEntryForEdit}
      onDelete={removeDuplicateEntry}
      conTypeLabelMap={conTypeLabelMap}
      dropdownOptions={dropdownOptions}
      dynamicSubUseTypes={dynamicSubUseTypes}
      editingEntryId={editingDuplicateId}
      isUnitRenter={Boolean(isRenter || formData.isRenter)}
    />
  ) : null;

  // Which floor the currently displayed rooms belong to
  const activeFloorEntry = duplicateEntries.find((e) => e.entryId === editingDuplicateId);
  const floorSubtitle = activeFloorEntry
    ? `Floor: ${activeFloorEntry.floorLabel}${activeFloorEntry.subFloorName && activeFloorEntry.subFloorName !== '—' ? ` (${activeFloorEntry.subFloorName})` : ''}`
    : formData.floorName || formData.floorLabel
      ? `Floor: ${formData.floorName || formData.floorLabel}${formData.subFloorName ? ` (${formData.subFloorName})` : ''}`
      : '';

  // Added Rooms table: only show when explicitly editing a floor entry
  const shouldShowRooms =
    (roomsList.length > 0 || openSpacesList.length > 0) &&
    Boolean(editingDuplicateId);

  const roomsTableNode = shouldShowRooms ? (
    <SubUnitRoomsAndSpacesTables
      formData={formData}
      setFormData={setFormData}
      roomsList={roomsList}
      setRoomsList={setRoomsList}
      openSpacesList={openSpacesList}
      setOpenSpacesList={setOpenSpacesList}
      setIsRoomsDrawerOpen={setIsRoomsDrawerOpen}
      setIsOpenSpacesDrawerOpen={setIsOpenSpacesDrawerOpen}
      t={t}
      isEditingDuplicate={Boolean(editingDuplicateId)}
      duplicateEntriesCount={duplicateEntries.length}
      floorSubtitle={floorSubtitle}
    />
  ) : null;

  return (
    <MediaPanelProvider initialVisible={true}>
      <style dangerouslySetInnerHTML={{ __html: `
        .subunit-media-panel .group {
          min-height: 160px !important;
          max-height: 160px !important;
        }
      `}} />
      <div className="flex flex-col h-full overflow-hidden bg-slate-50 new-add-asset-configurator">
        <SubUnitConfiguratorHeader
          parentBuildingName={parentBuildingName}
          unitNumber={formData.unitNumber}
          onCancel={onCancel}
          t={t}
        />

        <SubUnitConfiguratorBody
          loading={loading}
          occupantFieldProps={occupantFieldProps}
          handleRenterToggle={handleRenterToggleWithSync}
          departments={departments}
          sectionTitle={sectionTitle}
          showRentSection={showRentSection}
          isRenter={isRenter}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleFloorSelect={onFloorSelectChange}
          handleUseTypeSelect={handleUseTypeSelect}
          floorSelectOptions={floorSelectOptions}
          dropdownOptions={dropdownOptions}
          subFloorOptions={subFloorOptions}
          dynamicSubUseTypes={dynamicSubUseTypes}
          submissionType={submissionType}
          setSubmissionType={setSubmissionType}
          roomsList={roomsList}
          setRoomsList={setRoomsList}
          openSpacesList={openSpacesList}
          setOpenSpacesList={setOpenSpacesList}
          setIsRoomsDrawerOpen={setIsRoomsDrawerOpen}
          setIsOpenSpacesDrawerOpen={setIsOpenSpacesDrawerOpen}
          area={area}
          inp={inp}
          t={t}
          initialPhotoSlots={initialPhotoSlots}
          initialPhotos={initialPhotos}
          isFetchingDb={isFetchingDb}
          handleFileStaged={handleFileStaged}
          handleFileUnstaged={handleFileUnstaged}
          handleFileReplaced={handleFileReplaced}
          duplicateTableNode={duplicateTableNode}
          roomsTableNode={roomsTableNode}
          onAddFloorClick={handleAddFloor}
          onCancelEditDuplicate={cancelEditDuplicate}
          isEditingDuplicate={Boolean(editingDuplicateId)}
          duplicateEntriesCount={duplicateEntries.length}
        />

        <SubUnitConfiguratorFooter
          onCancel={onCancel}
          onSaveClick={handleSaveClick}
          t={t}
        />

        <SubUnitConfiguratorDrawers
          isRoomsDrawerOpen={isRoomsDrawerOpen}
          setIsRoomsDrawerOpen={setIsRoomsDrawerOpen}
          isOpenSpacesDrawerOpen={isOpenSpacesDrawerOpen}
          setIsOpenSpacesDrawerOpen={setIsOpenSpacesDrawerOpen}
          formData={formData}
          setFormData={setFormData}
          roomsList={roomsList}
          setRoomsList={setRoomsList}
          openSpacesList={openSpacesList}
          setOpenSpacesList={setOpenSpacesList}
          dropdownOptions={dropdownOptions}
        />
      </div>
    </MediaPanelProvider>
  );
}
