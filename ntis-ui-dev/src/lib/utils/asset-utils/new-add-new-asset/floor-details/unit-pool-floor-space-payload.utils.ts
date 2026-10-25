/* eslint-disable @typescript-eslint/no-explicit-any */
function mapFloorLevelOffsets(offsets: any[]) {
  return Array.isArray(offsets)
    ? offsets.map((off: any) => ({
      id:
        off.id && !String(off.id).startsWith('0.') && !String(off.id).includes('db_')
          ? Number(off.id)
          : undefined,
      shape: off.shape || 'Rectangle',
      length: off.length ? Number(off.length) : null,
      width: off.width ? Number(off.width) : null,
      height: off.height ? Number(off.height) : null,
      base1: off.base1 ? Number(off.base1) : null,
      base2: off.base2 ? Number(off.base2) : null,
      areaSqM: off.areaSqM ? Number(off.areaSqM) : null,
      op: off.op || 'Subtract',
    }))
    : [];
}

/** Shared by floor-level Open Space and Amenity bulk-save payload building —
 * the two entity types map to an identical roomDetails shape apart from
 * roomType/default-name. */
function mapFloorLevelEntity(r: any, roomType: 'Open Space' | 'Amenity', defaultName: string) {
  const areaSqM = r.areaSqM != null ? Number(r.areaSqM) : 0;
  return {
    id:
      r.id && !String(r.id).startsWith('0.') && !String(r.id).includes('db_')
        ? Number(r.id)
        : undefined,
    roomNo: r.roomNo || r.name || defaultName,
    roomType,
    shape: r.shape || 'Rectangle',
    lengthMtr: r.length ? Number(r.length) : null,
    widthMtr: r.width ? Number(r.width) : null,
    heightMtr: r.height ? Number(r.height) : null,
    base1Mtr: r.base1 ? Number(r.base1) : null,
    base2Mtr: r.base2 ? Number(r.base2) : null,
    areaSqMtr: areaSqM,
    noOfRooms: Number(r.count || 1),
    totalAreaSqMtr: Number(r.netAreaSqM || 0) * Number(r.count || 1),
    outerYesNo: false,
    minusYesNo: false,
    submissionType: roomType,
    offsets: mapFloorLevelOffsets(r.offsets),
  };
}

export function mapFloorLevelOpenSpaces(spaces: any[]) {
  return spaces.map((r) => mapFloorLevelEntity(r, 'Open Space', 'Balcony'));
}

export function mapFloorLevelAmenities(amenities: any[]) {
  return amenities.map((r) => mapFloorLevelEntity(r, 'Amenity', 'Clubhouse'));
}
