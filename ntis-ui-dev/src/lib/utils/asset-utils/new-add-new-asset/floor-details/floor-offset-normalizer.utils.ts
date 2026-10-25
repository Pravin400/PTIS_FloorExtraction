/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';

export function mapOffsetShape(off: any): any {
  return {
    id: String(off.id ?? off.Id ?? ''),
    shape: off.shape || off.Shape || 'Rectangle',
    length: Number(off.length ?? off.Length ?? off.lengthMtr ?? off.LengthMtr ?? 0),
    width: Number(off.width ?? off.Width ?? off.widthMtr ?? off.WidthMtr ?? 0),
    height: Number(off.height ?? off.Height ?? off.heightMtr ?? off.HeightMtr ?? 0),
    base1: Number(off.base1 ?? off.Base1 ?? off.base1Mtr ?? off.Base1Mtr ?? 0),
    base2: Number(off.base2 ?? off.Base2 ?? off.base2Mtr ?? off.Base2Mtr ?? 0),
    radius: Number(
      off.radius ?? off.Radius ?? off.length ?? off.Length ?? off.lengthMtr ?? off.LengthMtr ?? 0
    ),
    areaSqM: Number(off.areaSqM ?? off.AreaSqM ?? off.areaSqMtr ?? off.AreaSqMtr ?? 0),
    op: (off.op ?? off.Op ?? 'Subtract') as 'Add' | 'Subtract',
  };
}

/** Normalizes one room's offsets — either already-embedded on the room, or
 * (fallback) resolved from the pre-fetched AssetRoomWiseMinusData list keyed
 * by roomWiseSubmissionId. Mutates `room.offsets` in place. */
function normalizeRoomOffsets(room: any, roomWiseSubmissionId: any, allMinusData: any[]) {
  const rawOffsets = room.offsets ?? room.Offsets;
  if (rawOffsets !== undefined && rawOffsets !== null) {
    const activeOffsets = rawOffsets.filter(
      (off: any) => off.markedForDeletion !== true && off.MarkedForDeletion !== true
    );
    room.offsets = activeOffsets.map(mapOffsetShape);
    return;
  }

  try {
    const filteredItems = allMinusData.filter((item: any) => {
      const rId = item.roomWiseSubmissionId ?? item.RoomWiseSubmissionId;
      const isDeleted = item.markedForDeletion === true || item.MarkedForDeletion === true;
      return rId !== undefined && Number(rId) === Number(roomWiseSubmissionId) && !isDeleted;
    });
    room.offsets = filteredItems.map(mapOffsetShape);
  } catch {
    room.offsets = [];
  }
}

/** Normalizes id/floorId casing and resolves each room's offsets (in place)
 * for one floor record returned by fetchFloorsByAsset. */
export function normalizeFloorRecord(floor: any, allMinusData: any[]) {
  const resolvedId = floor.id ?? floor.Id;
  const resolvedFloorId = floor.floorId ?? floor.FloorId;
  if (resolvedId) {
    floor.id = Number(resolvedId);
    floor.Id = Number(resolvedId);
  }
  if (resolvedFloorId) {
    floor.floorId = Number(resolvedFloorId);
    floor.FloorId = Number(resolvedFloorId);
  }

  const roomWiseDetails = Array.isArray(floor.roomDetails)
    ? floor.roomDetails
    : Array.isArray(floor.roomWiseDetails)
      ? floor.roomWiseDetails
      : Array.isArray(floor.roomWiseSubmissions)
        ? floor.roomWiseSubmissions
        : [];

  if (roomWiseDetails.length === 0) return;

  // Expose rooms list under all standard keys for component compatibility
  floor.roomDetails = roomWiseDetails;
  floor.roomWiseDetails = roomWiseDetails;

  for (const room of roomWiseDetails) {
    const roomWiseSubmissionId = room.id ?? room.Id;
    if (!roomWiseSubmissionId) continue;
    normalizeRoomOffsets(room, roomWiseSubmissionId, allMinusData);
  }
}
