/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { toast } from 'sonner';
import {
  blankFloorFormState,
  blankFloorFormStateAfterSave,
} from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-utils';
import { validateFloorForm } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-save-validation.utils';
import { buildFloorPayload } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-payload-builder.utils';
import { saveFloorEntry } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-save-orchestrator.utils';
import { reconcileFloorSave } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-save-finalize.utils';
import { executeFloorDelete } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-delete-action.utils';
import { fetchFullFloorDetailIfNeeded } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-edit-fetch.utils';
import { splitEditRoomDetails } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-edit-space-mapping.utils';
import { buildEditFormState } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-edit-form-state.utils';

// NA = NewAddNewAsset copy of useFloorRegistrationSave
export function useNAFloorRegistrationSave(props: any) {
  const {
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
  } = props;

  const [isLoading, setIsLoading] = useState(false);

  const handleToggleDuplicateMode = (enabled: boolean) => {
    confirm({
      title: enabled ? 'Duplicate Floor Details?' : 'Switch to Update Mode?',
      description: enabled
        ? 'Are you sure you want to duplicate the selected floor? All floor details will be copied to a new floor record.'
        : 'Are you sure you want to switch back to Update Floor mode?',
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: () => {
        if (props.setIsDuplicateFloorMode) {
          props.setIsDuplicateFloorMode(enabled);
        }
        if (enabled) {
          setFormState((prev: any) => ({ ...prev, subFloor: '' }));
        } else if (props.sourceFloor) {
          const origSub = props.sourceFloor.subFloorId ? String(props.sourceFloor.subFloorId) : (props.sourceFloor.subFloor || '');
          setFormState((prev: any) => ({ ...prev, subFloor: origSub }));
        }
      },
    });
  };

  const handleAddFloor = async () => {
    const isDup = Boolean(props.isDuplicateFloorMode);

    if (!validateFloorForm(formState, roomData, openSpaceData, amenityData, t, {
      isDuplicateFloorMode: isDup,
      savedFloors,
    })) {
      return;
    }

    setIsLoading(true);
    try {
      const built = buildFloorPayload(formState, roomData, openSpaceData, amenityData, dropdownOptions, t, isDup);
      if (!built) return;

      const effectiveEditingId = isDup ? null : editingId;

      const saveResult = await saveFloorEntry(built, {
        formState,
        editingId: effectiveEditingId,
        dbFloors,
        setDbFloors,
        savedFloors,
        formData,
        subFloorOptions,
        subUseTypeOptions,
        dropdownOptions,
      });

      const enrichedChild = reconcileFloorSave(saveResult, {
        formState,
        roomData,
        openSpaceData,
        editingId: effectiveEditingId,
        setSavedFloors,
        setEditingId,
        t,
      });

      if (isDup) {
        setFormState((prev: any) => ({ ...prev, subFloor: '' }));
        if (props.onSuccess) {
          await props.onSuccess(enrichedChild, { keepDrawerOpen: true });
        }
      } else {
        setFormState(blankFloorFormStateAfterSave());
        setRoomData([]);
        setOpenSpaceData([]);
        setAmenityData([]);
        if (props.setSourceFloor) props.setSourceFloor(null);
        if (props.onSuccess) {
          await props.onSuccess(enrichedChild);
        }
      }
    } catch (err: any) {
      toast.error(
        t('floorDetails.genericErrorMsg', { message: err.message }) ||
        'An error occurred: ' + err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (f: any) => {
    const formElement = document.querySelector('.DirectRoomRegistrationPanel-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }

    const detailedF = await fetchFullFloorDetailIfNeeded(f, initialFloors, dropdownOptions, setSavedFloors, setIsLoading);

    const { roomsFromDb, spacesFromDb, amenitiesFromDb, mappedRooms, mappedSpaces, mappedAmenities } =
      splitEditRoomDetails(detailedF);

    const isOS = detailedF.unitType === 'Open Space' || spacesFromDb.length > 0;

    setRoomData(mappedRooms);
    setOpenSpaceData(mappedSpaces);
    setAmenityData(mappedAmenities);
    setEditingId(f.id);
    if (props.setSourceFloor) props.setSourceFloor(detailedF);
    if (props.setIsDuplicateFloorMode) props.setIsDuplicateFloorMode(false);
    setFormState(buildEditFormState(detailedF, isOS, roomsFromDb, spacesFromDb, amenitiesFromDb, dropdownOptions));
  };

  const handleDelete = async (id: number) => {
    confirm({
      variant: 'delete',
      title: t('floorDetails.deleteFloorDetailTitle') || 'Delete Floor Detail',
      description:
        t('floorDetails.deleteFloorDetailDesc') ||
        'Are you sure you want to delete this floor detail?',
      onConfirm: async () => {
        await executeFloorDelete({
          id,
          savedFloors,
          setSavedFloors,
          formData,
          setDbFloors,
          t,
          setIsLoading,
        });
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    if (props.setIsDuplicateFloorMode) props.setIsDuplicateFloorMode(false);
    if (props.setSourceFloor) props.setSourceFloor(null);
    setFormState(blankFloorFormState());
    setRoomData([]);
    setOpenSpaceData([]);
    setAmenityData([]);
  };

  return {
    isLoading,
    handleAddFloor,
    handleEdit,
    handleDelete,
    handleCancelEdit,
    handleToggleDuplicateMode,
  };
}
