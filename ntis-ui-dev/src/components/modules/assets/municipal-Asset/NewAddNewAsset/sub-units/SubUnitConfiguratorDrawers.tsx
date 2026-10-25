'use client';

import { RoomWiseSubmissionDrawer } from './RoomWiseSubmissionDrawer';
import { OpenSpaceDrawer } from './OpenSpaceDrawer';
import { SubUnitConfiguratorDrawersProps } from '@/types/asset/sub-units.types';

export function SubUnitConfiguratorDrawers({
  isRoomsDrawerOpen,
  setIsRoomsDrawerOpen,
  isOpenSpacesDrawerOpen,
  setIsOpenSpacesDrawerOpen,
  formData,
  setFormData,
  roomsList,
  setRoomsList,
  openSpacesList,
  setOpenSpacesList,
  dropdownOptions,
}: SubUnitConfiguratorDrawersProps) {
  return (
    <>
      <RoomWiseSubmissionDrawer
        isOpen={isRoomsDrawerOpen}
        onClose={() => setIsRoomsDrawerOpen(false)}
        unit={{ ...formData, rooms: roomsList }}
        onSaveRooms={(updatedRooms, calculatedArea) => {
          setRoomsList(updatedRooms);
          setFormData((prev: Record<string, unknown>) => ({ ...prev, carpetAreaSqFeet: calculatedArea }));
        }}
        roomTypes={dropdownOptions?.roomTypes}
      />
      <OpenSpaceDrawer
        isOpen={isOpenSpacesDrawerOpen}
        onClose={() => setIsOpenSpacesDrawerOpen(false)}
        spaces={openSpacesList}
        onSaveSpaces={(updatedSpaces, _calculatedAreaSqFt) => {
          setOpenSpacesList(updatedSpaces);
        }}
      />
    </>
  );
}
