/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { getSubUnitsByAssetAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/child-asset/get-sub-units.action";
import { fetchFloorsByAsset } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/floor-crud-fetch.actions';
import { updateFloorDetail } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/floor-detail-mutations.actions';

interface FloorAreaSyncResult {
  floorDetail: any;
  allSubUnits: any[];
  totalCarpetSqFt: number;
}

/**
 * Recomputes a floor's total area from its subunits + floor-level open spaces/amenities and
 * persists it to the floor detail record. Shared by syncFloorAreaAction (no CV) and
 * syncFloorAreaAndCVAction (area + CV).
 */
export async function recomputeAndPersistFloorArea(
  parentAssetId: number,
  floorLevelId: number,
  roomDetailsToSync?: any[] | null
): Promise<{ success: true; result: FloorAreaSyncResult } | { success: false; error: string }> {
  // 1. Fetch all floor details for this building
  const floorsRes = await fetchFloorsByAsset(parentAssetId);
  if (!floorsRes.success || !floorsRes.data) {
    return { success: false, error: floorsRes.error || 'Failed to fetch floors for sync' };
  }
  const floors = floorsRes.data;

  // Find the floor detail record matching floorLevelId
  const floorDetail = floors.find(
    (f: any) => Number(f.floorId || f.FloorId) === Number(floorLevelId)
  );
  if (!floorDetail) {
    return {
      success: false,
      error: `Floor detail record not found for floor level ${floorLevelId}`,
    };
  }

  // 2. Fetch all subunits (both pool subunits and direct rooms) for this building
  const subunitsRes = await getSubUnitsByAssetAction(parentAssetId, false);
  if (!subunitsRes.success || !subunitsRes.data) {
    return { success: false, error: subunitsRes.error || 'Failed to fetch subunits for sync' };
  }
  const allSubUnits = subunitsRes.data;

  // Filter subunits belonging to this floor detail
  const floorSubunits = allSubUnits.filter((u: any) => {
    const fDetailsId = u.floorDetailsId ?? u.FloorDetailsId;
    const fId = u.floorId ?? u.FloorId;
    return (
      (fDetailsId && Number(fDetailsId) === Number(floorDetail.id)) ||
      (fId && Number(fId) === Number(floorLevelId))
    );
  });

  // Sum subunits area (both rooms and pool subunits)
  const totalSubunitsSqFt = floorSubunits.reduce((acc: number, u: any) => {
    return acc + Number(u.totalAreaSqFt || u.carpetAreaSqFeet || u.carpetAreaSqFt || 0);
  }, 0);

  // Filter floor-level open spaces and amenities (which are in floorDetail.roomDetails)
  // If roomDetailsToSync is passed, we use it for calculating totals, otherwise fallback to DB floorDetail
  const rawRoomDetails =
    roomDetailsToSync !== undefined && roomDetailsToSync !== null
      ? roomDetailsToSync
      : Array.isArray(floorDetail.roomDetails)
        ? floorDetail.roomDetails
        : Array.isArray(floorDetail.roomWiseDetails)
          ? floorDetail.roomWiseDetails
          : [];

  const spaces = rawRoomDetails.filter(
    (r: any) => r.submissionType?.includes('Open Space') || r.roomType === 'Open Space'
  );
  const amenities = rawRoomDetails.filter(
    (r: any) => r.submissionType?.includes('Amenity') || r.roomType === 'Amenity'
  );

  const spacesSqM = spaces.reduce(
    (acc: number, r: any) => acc + Number(r.totalAreaSqMtr || r.areaSqMtr || 0),
    0
  );
  const amenitiesSqM = amenities.reduce(
    (acc: number, r: any) => acc + Number(r.totalAreaSqMtr || r.areaSqMtr || 0),
    0
  );

  const spacesSqFt = spacesSqM * 10.7639;
  const amenitiesSqFt = amenitiesSqM * 10.7639;

  const totalCarpetSqFt = totalSubunitsSqFt + spacesSqFt + amenitiesSqFt;
  const totalBuiltUpSqFt = totalCarpetSqFt * 1.2;

  const totalRoomsCount =
    floorSubunits.reduce((acc: number, u: any) => acc + Number(u.noOfRooms || 0), 0) +
    spaces.reduce((acc: number, r: any) => acc + Number(r.noOfRooms || r.count || 1), 0) +
    amenities.reduce((acc: number, r: any) => acc + Number(r.noOfRooms || r.count || 1), 0);

  const updatePayload: any = {
    carpetAreaSqMeter: totalCarpetSqFt / 10.7639,
    carpetAreaSqFeet: totalCarpetSqFt,
    builtUpAreaSqMeter: totalBuiltUpSqFt / 10.7639,
    builtUpAreaSqFeet: totalBuiltUpSqFt,
    noOfRooms: totalRoomsCount,
  };

  if (roomDetailsToSync !== undefined) {
    updatePayload.roomDetails = roomDetailsToSync;
  }

  // If this is a parent building with child subunits, we do NOT update the individual child subunit's
  // row in SubUnitsDetails with the aggregated totals of all subunits on this floor level.
  const isParentBuilding = Array.isArray(allSubUnits) && allSubUnits.length > 0;
  if (!isParentBuilding) {
    // Update floor detail record
    const updateRes = await updateFloorDetail(floorDetail.id, updatePayload);
    if (!updateRes.success) {
      return {
        success: false,
        error: updateRes.error || 'Failed to update floor details with synced area',
      };
    }
  }

  return { success: true, result: { floorDetail, allSubUnits, totalCarpetSqFt } };
}
