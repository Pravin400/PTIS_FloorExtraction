import { RoomWiseSubmissionDrawer } from "./RoomWiseSubmissionDrawer";
import { OpenSpaceDrawer } from "./OpenSpaceDrawer";

import { SubUnitDrawersProps } from "@/types/asset/sub-units.types";
export function SubUnitDrawers({
  formData,
  setFormData,
  roomsList,
  setRoomsList,
  openSpacesList,
  setOpenSpacesList,
  isRoomsDrawerOpen,
  setIsRoomsDrawerOpen,
  isOpenSpacesDrawerOpen,
  setIsOpenSpacesDrawerOpen
}: SubUnitDrawersProps) {
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
