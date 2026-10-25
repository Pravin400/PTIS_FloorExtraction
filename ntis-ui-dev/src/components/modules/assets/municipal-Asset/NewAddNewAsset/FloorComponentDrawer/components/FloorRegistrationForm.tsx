'use client';

import { FloorRegistrationFormFields } from './FloorRegistrationFormFields';
import { FloorRegistrationDrawers } from './FloorRegistrationDrawers';
import type { FloorRegistrationFormProps } from '@/types/asset/floor-details.types';

export function FloorRegistrationForm(props: FloorRegistrationFormProps) {
  const {
    t,
    editingId,
    onCancelEdit,
    onAddFloor,
    isLoading,
    formState,
    setFormState,
    dropdownOptions,
    subFloorOptions,
    subUseTypeOptions,
    isRenterDrawerOpen,
    setIsRenterDrawerOpen,
    isDrawerOpen,
    setIsDrawerOpen,
    roomData,
    handleSaveRooms,
    handleRoomsDrawerOpen,
    isOpenSpaceDrawerOpen,
    setIsOpenSpaceDrawerOpen,
    openSpaceData,
    handleSaveSpaces,
    handleOpenSpacesDrawerOpen,
    isAmenityDrawerOpen,
    setIsAmenityDrawerOpen,
    amenityData,
    handleSaveAmenities,
    isDuplicateFloorMode,
    onToggleDuplicateMode,
    sourceFloor,
  } = props;

  return (
    <>
      <FloorRegistrationFormFields
        t={t}
        editingId={editingId}
        onCancelEdit={onCancelEdit}
        onAddFloor={onAddFloor}
        isLoading={isLoading}
        formState={formState}
        setFormState={setFormState}
        dropdownOptions={dropdownOptions}
        subFloorOptions={subFloorOptions}
        subUseTypeOptions={subUseTypeOptions}
        setIsRenterDrawerOpen={setIsRenterDrawerOpen}
        handleRoomsDrawerOpen={handleRoomsDrawerOpen}
        handleOpenSpacesDrawerOpen={handleOpenSpacesDrawerOpen}
        isDuplicateFloorMode={isDuplicateFloorMode}
        onToggleDuplicateMode={onToggleDuplicateMode}
        sourceFloor={sourceFloor}
      />

      <FloorRegistrationDrawers
        formState={formState}
        setFormState={setFormState}
        dropdownOptions={dropdownOptions}
        isRenterDrawerOpen={isRenterDrawerOpen}
        setIsRenterDrawerOpen={setIsRenterDrawerOpen}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        roomData={roomData}
        handleSaveRooms={handleSaveRooms}
        isOpenSpaceDrawerOpen={isOpenSpaceDrawerOpen}
        setIsOpenSpaceDrawerOpen={setIsOpenSpaceDrawerOpen}
        openSpaceData={openSpaceData}
        handleSaveSpaces={handleSaveSpaces}
        isAmenityDrawerOpen={isAmenityDrawerOpen}
        setIsAmenityDrawerOpen={setIsAmenityDrawerOpen}
        amenityData={amenityData}
        handleSaveAmenities={handleSaveAmenities}
      />
    </>
  );
}
