'use client';
import { OpenSpace } from "@/hooks/asset-hooks/useOpenSpaceDrawer";


import { useMemo } from 'react';
import { RoomTable } from './RoomTable';
import { OpenSpaceTable } from './OpenSpaceTable';
import { computeRoomAreaTotals } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/sub-unit-room-area.utils';
import { SubUnitRoomsAndSpacesTablesProps } from '@/types/asset/sub-units.types';

export function SubUnitRoomsAndSpacesTables({
  setFormData,
  roomsList,
  setRoomsList,
  openSpacesList,
  setOpenSpacesList,
  setIsRoomsDrawerOpen,
  setIsOpenSpacesDrawerOpen,
  t,
  isEditingDuplicate,
  duplicateEntriesCount,
  floorSubtitle,
}: SubUnitRoomsAndSpacesTablesProps) {
  const { carpetSqM, carpetSqFt, builtUpSqM, builtUpSqFt } = useMemo(
    () => computeRoomAreaTotals(roomsList),
    [roomsList]
  );

  const shouldShowRooms =
    roomsList.length > 0 && (!duplicateEntriesCount || duplicateEntriesCount <= 0 || isEditingDuplicate);

  const openSpaceTotals = useMemo(() => ({
    totalGrossSqM: openSpacesList.reduce((s: number, o: { count: number; areaSqM?: number; areaSqFt?: number; netAreaSqM?: number; netAreaSqFt?: number }) => s + (o.areaSqM || 0) * o.count, 0),
    totalGrossSqFt: openSpacesList.reduce((s: number, o: { count: number; areaSqM?: number; areaSqFt?: number; netAreaSqM?: number; netAreaSqFt?: number }) => s + (o.areaSqFt || 0) * o.count, 0),
    totalNetSqM: openSpacesList.reduce((s: number, o: { count: number; areaSqM?: number; areaSqFt?: number; netAreaSqM?: number; netAreaSqFt?: number }) => s + (o.netAreaSqM || 0) * o.count, 0),
    totalNetSqFt: openSpacesList.reduce((s: number, o: { count: number; areaSqM?: number; areaSqFt?: number; netAreaSqM?: number; netAreaSqFt?: number }) => s + (o.netAreaSqFt || 0) * o.count, 0),
  }), [openSpacesList]);

  return (
    <>
      {shouldShowRooms && (
        <div className="col-span-full mt-2">
          <RoomTable
            rooms={roomsList}
            carpetSqM={carpetSqM}
            carpetSqFt={carpetSqFt}
            builtUpSqM={builtUpSqM}
            builtUpSqFt={builtUpSqFt}
            toggleOffset={(roomId, val) => {
              const updated = roomsList.map((r) =>
                r.id === roomId ? { ...r, hasOffset: val } : r
              );
              setRoomsList(updated);
              const calculatedArea = updated.reduce((s, r) => s + r.netAreaSqFt * r.count, 0);
              setFormData((prev: Record<string, unknown>) => ({ ...prev, carpetAreaSqFeet: calculatedArea }));
            }}
            handleEdit={(_r) => setIsRoomsDrawerOpen(true)}
            handleDelete={(id) => {
              const updated = roomsList.filter((r) => r.id !== id);
              setRoomsList(updated);
              const calculatedArea = updated.reduce((s, r) => s + r.netAreaSqFt * r.count, 0);
              setFormData((prev: Record<string, unknown>) => ({ ...prev, carpetAreaSqFeet: calculatedArea }));
            }}
            t={t}
            floorSubtitle={floorSubtitle}
          />
        </div>
      )}

      {openSpacesList.length > 0 && (
        <div className="col-span-full mt-2">
          <OpenSpaceTable
            spacesList={openSpacesList}
            toggleOffset={(spaceId: string, val: 'Yes' | 'No') => {
              const updated = openSpacesList.map((os: { id: string; hasOffset?: string;[key: string]: unknown }) =>
                os.id === spaceId ? { ...os, hasOffset: val } : os
              );
              setOpenSpacesList(updated);
            }}
            handleEdit={(_os: OpenSpace) => setIsOpenSpacesDrawerOpen(true)}
            handleDelete={(id: string) => {
              const updated = openSpacesList.filter((os: { id: string;[key: string]: unknown }) => os.id !== id);
              setOpenSpacesList(updated);
            }}
            totalGrossSqM={openSpaceTotals.totalGrossSqM}
            totalGrossSqFt={openSpaceTotals.totalGrossSqFt}
            totalNetSqM={openSpaceTotals.totalNetSqM}
            totalNetSqFt={openSpaceTotals.totalNetSqFt}
          />
        </div>
      )}
    </>
  );
}
