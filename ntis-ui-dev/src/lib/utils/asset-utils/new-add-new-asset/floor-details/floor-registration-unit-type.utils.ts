/* eslint-disable @typescript-eslint/no-explicit-any */
/** Determines the display unit type ('Shop' | 'Room' | 'Open Space' | ...) from
 * whichever identifying strings the API response carries, falling back to
 * inspecting the mapped room list when nothing textual matches. */
export function resolveUnitType(u: any, mappedRooms: any[]) {
  if (u.isDirectFloorSubmission === true || u.IsDirectFloorSubmission === true) {
    if (u.constructionTypeId === 11 || String(u.unitType || '').toLowerCase().includes('open')) {
      return 'Open Space';
    }
    return 'Construction';
  }

  let unitType = (u.unitType || u.type || '').trim();
  const allTokens = [
    u.unitType,
    u.type,
    u.subUnitType,
    u.subUnitTypeName,
    u.assetNo,
    u.assetCode,
    u.unitNo,
    u.shopUnitName,
    u.assetName,
    u.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  // Check the most specific unit-type tokens first: under a "Shop"-category building, every
  // unit number carries the building-type prefix "BLDG-SHOP-..." (e.g.
  // "Akola01-BLDG-SHOP-OPENSPACE-0002"), so a generic 'SHOP' substring check run first would
  // misclassify every Room/Open Space/Amenity/Office/Flat unit as a Shop. 'SHOP' must be the
  // last, most-generic fallback.
  if (!unitType) {
    if (allTokens.includes('OPEN SPACE') || allTokens.includes('OPENSPACE'))
      unitType = 'Open Space';
    else if (allTokens.includes('AMENITY')) unitType = 'Amenity';
    else if (allTokens.includes('ROOM')) unitType = 'Room';
    else if (allTokens.includes('OFFICE')) unitType = 'Office';
    else if (allTokens.includes('FLAT')) unitType = 'Flat';
    else if (allTokens.includes('DEPARTMENT') || allTokens.includes('DEPT'))
      unitType = 'Department';
    else if (allTokens.includes('SHOP')) unitType = 'Shop';
  }

  if (!unitType) {
    if (mappedRooms && mappedRooms.length > 0) {
      const roomTypes = mappedRooms.map((r: any) =>
        String(r.roomType || r.submissionType || '')
      );
      if (roomTypes.some((t: string) => t.includes('Open Space'))) {
        unitType = 'Open Space';
      } else if (roomTypes.some((t: string) => t.includes('Amenity'))) {
        unitType = 'Amenity';
      } else {
        unitType = 'Room';
      }
    } else if (u.shopUnitName) {
      unitType = (u.shopUnitName as string).split(' ')[0] || 'Flat';
    } else {
      unitType = 'Flat';
    }
  }
  return unitType;
}
