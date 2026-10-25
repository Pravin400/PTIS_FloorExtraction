/* eslint-disable @typescript-eslint/no-explicit-any */
/** Derives the display unit type from AssetName/unit-number code segments
 * (OPEN SPACE, AMENITY, ROOM, OFFICE, FLAT, DEPARTMENT, SHOP), falling back to the
 * raw unitType field or the unit's shop name. */
export function resolvePoolUnitType(u: any): string {
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

  // Check specific unit-type tokens first: under a "Shop"-category building, every
  // unit number carries the building-type prefix "BLDG-SHOP-..." (e.g.
  // "Akola01-BLDG-SHOP-OPENSPACE-0002"), so a generic 'SHOP' substring check or raw
  // building-type fallback would misclassify every Room/Open Space/Amenity/Office/Flat unit as a Shop.
  // Specific code tokens must be derived first, then raw unitType only as fallback.
  let unitType = '';
  if (allTokens.includes('OPEN SPACE') || allTokens.includes('OPENSPACE')) {
    unitType = 'Open Space';
  } else if (allTokens.includes('AMENITY')) {
    unitType = 'Amenity';
  } else if (allTokens.includes('ROOM')) {
    unitType = 'Room';
  } else if (allTokens.includes('OFFICE')) {
    unitType = 'Office';
  } else if (allTokens.includes('FLAT')) {
    unitType = 'Flat';
  } else if (allTokens.includes('DEPARTMENT') || allTokens.includes('DEPT')) {
    unitType = 'Department';
  }

  if (!unitType) {
    const rawType = (u.unitType || u.type || '').trim();
    if (rawType) {
      unitType = rawType;
    } else if (allTokens.includes('SHOP')) {
      unitType = 'Shop';
    } else if (u.shopUnitName) {
      unitType = (u.shopUnitName as string).split(' ')[0] || 'Flat';
    } else {
      unitType = 'Flat';
    }
  }

  return unitType;
}
