import { OpenSpaceDrawer } from '../../sub-units/OpenSpaceDrawer';
import { AmenityDrawer } from '../../sub-units/AmenityDrawer';
import type { UnitPoolPanelDrawersProps } from '@/types/asset/floor-details.types';

export function UnitPoolPanelDrawers({ poolState }: UnitPoolPanelDrawersProps) {
  return (
    <>
      {/* ── Floor-level Open Space Drawer ── */}
      <OpenSpaceDrawer
        isOpen={poolState.isOpenSpaceDrawerOpen}
        onClose={() => poolState.setIsOpenSpaceDrawerOpen(false)}
        spaces={
          poolState.openSpaceFloorId ? poolState.floorOpenSpaces[poolState.openSpaceFloorId] || [] : []
        }
        onSaveSpaces={(updatedSpaces: Record<string, unknown>[]) => {
          if (!poolState.openSpaceFloorId) return;
          poolState.setFloorOpenSpaces((prev: Record<string, Record<string, unknown>[]>) => ({
            ...prev,
            [poolState.openSpaceFloorId]: updatedSpaces,
          }));
          poolState.setFloorConfigDirty(true);
        }}
      />

      {/* ── Floor-level Amenities Drawer ── */}
      <AmenityDrawer
        isOpen={poolState.isAmenityDrawerOpen}
        onClose={() => poolState.setIsAmenityDrawerOpen(false)}
        amenities={
          poolState.amenityFloorId ? poolState.floorAmenities[poolState.amenityFloorId] || [] : []
        }
        onSaveAmenities={(updatedAmenities: Record<string, unknown>[]) => {
          if (!poolState.amenityFloorId) return;
          poolState.setFloorAmenities((prev: Record<string, Record<string, unknown>[]>) => ({
            ...prev,
            [poolState.amenityFloorId]: updatedAmenities,
          }));
          poolState.setFloorConfigDirty(true);
        }}
      />
    </>
  );
}
