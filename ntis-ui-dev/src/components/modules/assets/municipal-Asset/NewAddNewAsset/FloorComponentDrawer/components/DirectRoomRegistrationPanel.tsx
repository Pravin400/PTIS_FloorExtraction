'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNAAssetForm } from '../../NAAssetFormContext';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useTranslations } from 'next-intl';
import { RoomWiseSubmissionDrawer } from '../../sub-units/RoomWiseSubmissionDrawer';
import { useNAFloorRegistrationForm } from '@/hooks/asset-hooks/floor-details/useNAFloorRegistrationForm';
import { useRoomOpenSpaceAmenityDrawers } from '@/hooks/asset-hooks/floor-details/useRoomOpenSpaceAmenityDrawers';
import { useNAFloorRegistrationSave } from '@/hooks/asset-hooks/floor-details/useNAFloorRegistrationSave';
import { useNADirectRoomRegistrationLocalState } from '@/hooks/asset-hooks/floor-details/useNADirectRoomRegistrationLocalState';
import { duplicateFloorEntries } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-duplicate.utils';
import { FloorRegistrationForm } from './FloorRegistrationForm';
import { SavedFloorsList } from './SavedFloorsList';
import type { DirectRoomRegistrationPanelProps } from '@/types/asset/floor-details.types';

export function DirectRoomRegistrationPanel({
  dropdownOptions,
  initialFloors = [],
  initialSubUnits = [],
  editEventRegistry: editEventRegistryRef,
  initialSubUseTypeMap = {},
  initialSubFloorOptions = [],
  initialSubUseTypeOptions = [],
  editFloorId,
  onSuccess,
}: DirectRoomRegistrationPanelProps) {
  const { formData } = useNAAssetForm();
  const { confirm } = useConfirm();
  const t = useTranslations('addAssetForm');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledRight, setIsScrolledRight] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const hasTriggeredEditRef = useRef<number | null>(null);

  const {
    dbFloors, setDbFloors,
    savedFloors, setSavedFloors,
    isViewDrawerOpen, setIsViewDrawerOpen,
    selectedFloorForView, setSelectedFloorForView,
    isRenterDrawerOpen, setIsRenterDrawerOpen,
  } = useNADirectRoomRegistrationLocalState(initialFloors, initialSubUnits, dropdownOptions, formData.id);

  const {
    subFloorOptions,
    subUseTypeOptions,
    subUseTypeMap,
    formState,
    setFormState,
    editingId,
    setEditingId,
    isDuplicateFloorMode,
    setIsDuplicateFloorMode,
    sourceFloor,
    setSourceFloor,
  } = useNAFloorRegistrationForm(
    dropdownOptions,
    initialSubUseTypeMap as Record<string, Array<{ label: string; value: string | number }>>,
    initialSubFloorOptions,
    initialSubUseTypeOptions
  );

  const {
    isDrawerOpen,
    setIsDrawerOpen,
    roomData,
    setRoomData,
    isOpenSpaceDrawerOpen,
    setIsOpenSpaceDrawerOpen,
    openSpaceData,
    setOpenSpaceData,
    isAmenityDrawerOpen,
    setIsAmenityDrawerOpen,
    amenityData,
    setAmenityData,
    handleRoomsDrawerOpen,
    handleOpenSpacesDrawerOpen,
    handleSaveRooms,
    handleSaveSpaces,
    handleSaveAmenities,
  } = useRoomOpenSpaceAmenityDrawers(formState, setFormState, dropdownOptions);

  const { isLoading, handleAddFloor, handleEdit, handleDelete, handleCancelEdit, handleToggleDuplicateMode } =
    useNAFloorRegistrationSave({
      formData,
      t,
      confirm,
      dropdownOptions,
      initialFloors,
      dbFloors,
      setDbFloors,
      savedFloors,
      setSavedFloors,
      formState,
      setFormState,
      editingId,
      setEditingId,
      subFloorOptions,
      subUseTypeOptions,
      roomData,
      setRoomData,
      openSpaceData,
      setOpenSpaceData,
      amenityData,
      setAmenityData,
      isDuplicateFloorMode,
      setIsDuplicateFloorMode,
      sourceFloor,
      setSourceFloor,
      onSuccess,
    });

  useEffect(() => {
    if (editEventRegistryRef) {
      editEventRegistryRef.current = {
        triggerEdit: (childAssetId: number) => {
          const pool = savedFloors.length > 0 ? savedFloors : (formData?.floors || []);
          const match = pool.find((sf: { id?: number | string }) => Number(sf.id) === Number(childAssetId));
          if (match) {
            handleEdit(match);
          }
        },
      };
    }
    return () => {
      if (editEventRegistryRef) {
        editEventRegistryRef.current = {};
      }
    };
  }, [editEventRegistryRef, savedFloors, formData?.floors, handleEdit]);

  // Robust mount-time / change-time trigger for editFloorId
  useEffect(() => {
    if (!editFloorId) {
      hasTriggeredEditRef.current = null;
      return;
    }
    const pool = savedFloors.length > 0 ? savedFloors : (formData?.floors || []);
    if (pool.length > 0 && hasTriggeredEditRef.current !== editFloorId) {
      const match = pool.find((sf: { id?: number | string }) => Number(sf.id) === Number(editFloorId));
      if (match) {
        hasTriggeredEditRef.current = editFloorId;
        handleEdit(match);
      }
    }
  }, [editFloorId, savedFloors, formData?.floors, handleEdit]);

  return (
    <>
      <div className="space-y-4">
        <FloorRegistrationForm
          t={t}
          editingId={editingId}
          onCancelEdit={handleCancelEdit}
          onAddFloor={handleAddFloor}
          isLoading={isLoading}
          formState={formState}
          setFormState={setFormState}
          dropdownOptions={dropdownOptions}
          subFloorOptions={subFloorOptions}
          subUseTypeOptions={subUseTypeOptions}
          isRenterDrawerOpen={isRenterDrawerOpen}
          setIsRenterDrawerOpen={setIsRenterDrawerOpen}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          roomData={roomData}
          handleSaveRooms={handleSaveRooms}
          handleRoomsDrawerOpen={handleRoomsDrawerOpen}
          isOpenSpaceDrawerOpen={isOpenSpaceDrawerOpen}
          setIsOpenSpaceDrawerOpen={setIsOpenSpaceDrawerOpen}
          openSpaceData={openSpaceData}
          handleSaveSpaces={handleSaveSpaces}
          handleOpenSpacesDrawerOpen={handleOpenSpacesDrawerOpen}
          isAmenityDrawerOpen={isAmenityDrawerOpen}
          setIsAmenityDrawerOpen={setIsAmenityDrawerOpen}
          amenityData={amenityData}
          handleSaveAmenities={handleSaveAmenities}
          isDuplicateFloorMode={isDuplicateFloorMode}
          onToggleDuplicateMode={handleToggleDuplicateMode}
          sourceFloor={sourceFloor}
        />

        <SavedFloorsList
          t={t}
          savedFloors={savedFloors}
          dropdownOptions={dropdownOptions}
          subUseTypeMap={subUseTypeMap}
          isLoading={isLoading}
          isScrolledRight={isScrolledRight}
          setIsScrolledRight={setIsScrolledRight}
          tableContainerRef={tableContainerRef}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDuplicating={isDuplicating}
          onDuplicate={async (floor, count) => {
            setIsDuplicating(true);
            try {
              const created = await duplicateFloorEntries(floor, count, {
                formData,
                dropdownOptions,
                dbFloors,
                setDbFloors,
                savedFloors,
                setSavedFloors,
                subFloorOptions,
                subUseTypeOptions,
                t,
              });
              if (created > 0) {
                toast.success(`${created} floor${created !== 1 ? 's' : ''} duplicated successfully.`);
              }
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              toast.error(`Duplication failed: ${msg}`);
            } finally {
              setIsDuplicating(false);
            }
          }}
        />
      </div>

      {selectedFloorForView && (
        <RoomWiseSubmissionDrawer
          isOpen={isViewDrawerOpen}
          onClose={() => {
            setIsViewDrawerOpen(false);
            setSelectedFloorForView(null);
          }}
          unit={selectedFloorForView}
          onSaveRooms={() => { }}
          roomTypes={dropdownOptions?.roomTypes}
        />
      )}
    </>
  );
}
