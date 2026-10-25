/* eslint-disable @typescript-eslint/no-explicit-any */
import { mapRoomsFromDb } from './floor-edit-room-mapping.utils';

function buildSpaceOffsetsForEdit(offsets: any[]) {
  return Array.isArray(offsets)
    ? offsets.map((off: any) => ({
      id: String(off.id || ''),
      shape: off.shape || 'Rectangle',
      length: Number(off.length ?? off.lengthMtr ?? 0),
      width: Number(off.width ?? off.widthMtr ?? 0),
      height: Number(off.height ?? off.heightMtr ?? 0),
      base1: Number(off.base1 ?? off.base1Mtr ?? 0),
      base2: Number(off.base2 ?? off.base2Mtr ?? 0),
      radius: Number(off.radius ?? off.radiusMtr ?? off.length ?? 0),
      areaSqM: Number(off.areaSqM || 0),
      op: off.op || 'Subtract',
    }))
    : [];
}

/** Shared by Open Space and Amenity rows from the DB — the two are ~identical
 * except for the default display name and roomType label. */
function mapSpaceLikeEntities(entities: any[], roomType: 'Open Space' | 'Amenity', defaultName: string) {
  return entities.map((r: any) => {
    const areaSqM = Number(r.areaSqMtr || r.areaSqM || 0);
    const rOffsets = buildSpaceOffsetsForEdit(r.offsets);
    const rawNet =
      Number(r.totalAreaSqMtr || r.areaSqMtr || r.areaSqM || 0) /
      Number(r.noOfRooms || r.count || 1);
    return {
      id: r.id ? String(r.id) : String(Math.random()),
      name: r.roomNo || r.name || defaultName,
      roomNo: r.roomNo || r.name || defaultName,
      roomType,
      shape: r.shape || 'Rectangle',
      length: Number(r.lengthMtr ?? r.length ?? 0),
      width: Number(r.widthMtr ?? r.width ?? 0),
      height: Number(r.heightMtr ?? r.height ?? 0),
      base1: Number(r.base1Mtr ?? r.base1 ?? 0),
      base2: Number(r.base2Mtr ?? r.base2 ?? 0),
      radius: Number(r.radiusMtr ?? r.radius ?? 0),
      areaSqM,
      areaSqFt: areaSqM * 10.7639,
      hasOffset: rOffsets.length > 0 ? 'Yes' : 'No',
      offsets: rOffsets,
      offsetAreaSqM: 0,
      offsetOp: 'Subtract' as const,
      netAreaSqM: rawNet,
      netAreaSqFt: rawNet * 10.7639,
      count: Number(r.noOfRooms || r.count || 1),
      outer: 'No' as const,
      minus: 'No' as const,
      submissionType: roomType,
    };
  });
}

export function splitEditRoomDetails(detailedF: any) {
  const rawRoomDetails = Array.isArray(detailedF.roomDetails) ? detailedF.roomDetails : [];
  const roomsFromDb = rawRoomDetails.filter(
    (r: any) =>
      !(
        r.submissionType?.includes('Open Space') ||
        r.roomType === 'Open Space' ||
        r.submissionType?.includes('Amenity') ||
        r.roomType === 'Amenity'
      )
  );
  const spacesFromDb = rawRoomDetails.filter(
    (r: any) => r.submissionType?.includes('Open Space') || r.roomType === 'Open Space'
  );
  const amenitiesFromDb = rawRoomDetails.filter(
    (r: any) => r.submissionType?.includes('Amenity') || r.roomType === 'Amenity'
  );

  const mappedRooms = mapRoomsFromDb(roomsFromDb);
  const mappedSpaces = mapSpaceLikeEntities(spacesFromDb, 'Open Space', 'Balcony');
  const mappedAmenities = mapSpaceLikeEntities(amenitiesFromDb, 'Amenity', 'Amenity');

  return { roomsFromDb, spacesFromDb, amenitiesFromDb, mappedRooms, mappedSpaces, mappedAmenities };
}
