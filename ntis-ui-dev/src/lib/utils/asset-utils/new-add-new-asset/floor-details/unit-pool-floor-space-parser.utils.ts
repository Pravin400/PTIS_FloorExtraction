/* eslint-disable @typescript-eslint/no-explicit-any */
function mapFloorLevelOffsets(offsets: any[]) {
  return Array.isArray(offsets)
    ? offsets.map((off: any) => ({
      id: String(off.id ?? off.Id ?? ''),
      shape: off.shape || 'Rectangle',
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
    }))
    : [];
}

/** Shared by floor-level Open Space and Amenity parsing — both filter the
 * floor's room-detail rows down to floor-level-only entries (excluding
 * subunit-owned rows) and map them into the same display shape. */
function parseFloorLevelEntities(
  floors: any[],
  matches: (r: any) => boolean,
  roomType: 'Open Space' | 'Amenity',
  defaultName: string
): Record<string, any[]> {
  if (!floors || floors.length === 0) return {};
  const entitiesMap: Record<string, any[]> = {};

  floors.forEach((f: any) => {
    const floorId = f.floorId ?? f.FloorId;
    if (!floorId) return;

    const rawRoomDetails = Array.isArray(f.roomDetails)
      ? f.roomDetails
      : Array.isArray(f.roomWiseDetails)
        ? f.roomWiseDetails
        : [];

    const matched = rawRoomDetails.filter((r: any) => {
      if (!matches(r)) return false;
      // Filter out rooms that belong to subunits, so we only load floor-level rooms.
      // Floor-level rooms have the same assetId as the floor detail record itself.
      const rAssetId = r.assetId ?? r.AssetId;
      const fAssetId = f.assetId ?? f.AssetId;
      if (rAssetId && fAssetId && Number(rAssetId) !== Number(fAssetId)) {
        return false;
      }
      return true;
    });

    if (matched.length > 0) {
      entitiesMap[String(floorId)] = matched.map((r: any) => {
        const areaSqM = Number(r.areaSqMtr || r.areaSqM || 0);
        const rOffsets = mapFloorLevelOffsets(r.offsets);
        const rawNet = Number(r.totalAreaSqMtr || areaSqM) / Number(r.noOfRooms || 1);
        return {
          id: r.id ? String(r.id) : String(Math.random()),
          name: r.roomNo || defaultName,
          roomNo: r.roomNo || defaultName,
          roomType,
          shape: r.shape || 'Rectangle',
          length: Number(r.lengthMtr || 0),
          width: Number(r.widthMtr || 0),
          height: Number(r.heightMtr || 0),
          base1: Number(r.base1Mtr || 0),
          base2: Number(r.base2Mtr || 0),
          radius: Number(r.radiusMtr || 0),
          areaSqM,
          areaSqFt: areaSqM * 10.7639,
          hasOffset: rOffsets.length > 0 ? 'Yes' : 'No',
          offsets: rOffsets,
          offsetAreaSqM: 0,
          offsetOp: 'Subtract',
          netAreaSqM: rawNet,
          netAreaSqFt: rawNet * 10.7639,
          count: Number(r.noOfRooms || r.count || 1),
          outer: 'No',
          minus: 'No',
          submissionType: roomType,
        };
      });
    }
  });
  return entitiesMap;
}

export function parseOpenSpacesFromFloors(floors: any[]): Record<string, any[]> {
  return parseFloorLevelEntities(
    floors,
    (r) => r.submissionType?.includes('Open Space') || r.roomType === 'Open Space',
    'Open Space',
    'Balcony'
  );
}

export function parseAmenitiesFromFloors(floors: any[]): Record<string, any[]> {
  return parseFloorLevelEntities(
    floors,
    (r) =>
      r.submissionType?.includes('Amenity') ||
      r.submissionType?.includes('Amenities') ||
      r.roomType === 'Amenity' ||
      r.roomType === 'Amenities',
    'Amenity',
    'Amenity'
  );
}
