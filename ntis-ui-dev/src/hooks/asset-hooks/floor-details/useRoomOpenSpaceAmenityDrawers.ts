/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  syncEntityCount,
  makeDefaultRoom,
  makeDefaultOpenSpace,
  makeDefaultAmenity,
  computeAreaTotals,
} from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/room-open-space-amenity.utils';

export function useRoomOpenSpaceAmenityDrawers(
  formState: any,
  setFormState: React.Dispatch<React.SetStateAction<any>>,
  dropdownOptions: any
) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [roomData, setRoomData] = useState<any[]>([]);
  const [isOpenSpaceDrawerOpen, setIsOpenSpaceDrawerOpen] = useState(false);
  const [openSpaceData, setOpenSpaceData] = useState<any[]>([]);
  const [isAmenityDrawerOpen, setIsAmenityDrawerOpen] = useState(false);
  const [amenityData, setAmenityData] = useState<any[]>([]);

  const recalculateAreas = (rooms: any[], spaces: any[], amenities: any[] = []) => {
    const totals = computeAreaTotals(rooms, spaces, amenities);
    setFormState((prev: any) => ({
      ...prev,
      rooms: totals.rooms,
      openSpaces: totals.openSpaces,
      amenities: totals.amenities,
      carpetAreaSqFt: totals.carpetAreaSqFt,
      builtUpAreaSqFt: prev.submissionType === 'Open Space' ? 0 : totals.builtUpAreaSqFt,
    }));
  };

  const handleSaveRooms = (rooms: any[], _calculatedAreaSqFt: number) => {
    setRoomData(rooms);
    recalculateAreas(rooms, openSpaceData, amenityData);
  };

  const handleRoomsDrawerOpen = () => {
    const targetCount = Math.min(999, Math.max(0, Number(formState.rooms || 0)));
    if (targetCount > 0) {
      setRoomData((prev) => syncEntityCount(prev, targetCount, (i) => makeDefaultRoom(i, dropdownOptions)));
    }
    setIsDrawerOpen(true);
  };

  const handleOpenSpacesDrawerOpen = () => {
    const targetCount = Math.min(999, Math.max(0, Number(formState.openSpaces || 0)));
    if (targetCount > 0) {
      setOpenSpaceData((prev) => syncEntityCount(prev, targetCount, makeDefaultOpenSpace));
    }
    setIsOpenSpaceDrawerOpen(true);
  };

  const handleAmenitiesDrawerOpen = () => {
    const targetCount = Number(formState.amenities || 0);
    if (targetCount > 0) {
      setAmenityData((prev) => syncEntityCount(prev, targetCount, makeDefaultAmenity));
    }
    setIsAmenityDrawerOpen(true);
  };

  const handleSaveSpaces = (spaces: any[], _calculatedAreaSqFt: number) => {
    setOpenSpaceData(spaces);
    recalculateAreas(roomData, spaces, amenityData);
  };

  const handleSaveAmenities = (amenities: any[], _calculatedAreaSqFt: number) => {
    setAmenityData(amenities);
    recalculateAreas(roomData, openSpaceData, amenities);
  };

  return {
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
    handleAmenitiesDrawerOpen,
    handleSaveRooms,
    handleSaveSpaces,
    handleSaveAmenities,
  };
}
