/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  syncFloorAreaAndCVAction,
  deleteFloorDetail,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';

/**
 * After a child asset is deleted: if other child assets remain on the same
 * floorDetailsId, recalculate merged totals/CV for what's left. Otherwise the
 * parent floor detail record has no children left, so delete it too.
 */
export async function recalculateFloorAfterDelete(
  floorDetailsId: number,
  deletedAssetFloorId: number,
  remainingFloors: any[],
  formData: any,
  setDbFloors: React.Dispatch<React.SetStateAction<any[]>>
) {
  const sameFloorAssets = remainingFloors.filter((f: any) => f.floorDetailsId === floorDetailsId);

  if (sameFloorAssets.length > 0) {
    const mergedRoomDetails: any[] = [];
    sameFloorAssets.forEach((u: any) => {
      const rooms = Array.isArray(u.roomDetails) ? u.roomDetails : [];
      rooms.forEach((r: any) => mergedRoomDetails.push(r));
    });

    // Combined sync area, merged roomDetails, and CV recalculation in 1 call
    const syncRes = await syncFloorAreaAndCVAction(
      formData.id || 0,
      deletedAssetFloorId,
      mergedRoomDetails.length > 0 ? mergedRoomDetails : null
    );
    if (syncRes.success && syncRes.data?.floors) {
      setDbFloors(syncRes.data.floors);
    }
  } else {
    // Delete parent floor detail record since no child assets are left
    await deleteFloorDetail(floorDetailsId);
    setDbFloors((prev: any[]) => prev.filter((f) => f.id !== floorDetailsId));
  }
}
