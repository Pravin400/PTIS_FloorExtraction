/* eslint-disable @typescript-eslint/no-explicit-any */
// Module-level counter guarantees unique IDs even when multiple entries are
// created within the same millisecond (e.g. bulk room generation).
let _entityIdCounter = Date.now();
function nextEntityId(prefix: string): string {
  return `${prefix}-${++_entityIdCounter}`;
}

export function syncEntityCount<T>(prev: T[], targetCount: number, makeEntry: (index: number) => T): T[] {
  const currentCount = prev.length;
  if (currentCount === targetCount) return prev;
  if (currentCount < targetCount) {
    const next = [...prev];
    for (let i = currentCount; i < targetCount; i++) next.push(makeEntry(i));
    return next;
  }
  return prev.slice(0, targetCount);
}

export function makeDefaultRoom(index: number, _dropdownOptions?: any): any {
  return {
    id: nextEntityId('r'),
    roomNo: String(index + 1),
    roomType: '',
    shape: '',
    length: 0, width: 0, height: 0, base1: 0, base2: 0, radius: 0,
    areaSqM: 0, areaSqFt: 0,
    offsetShape: 'Rectangle',
    offsetLength: 0, offsetWidth: 0, offsetHeight: 0, offsetBase1: 0, offsetBase2: 0, offsetRadius: 0,
    offsetAreaSqM: 0,
    hasOffset: '',
    offsetOp: 'Subtract',
    offsets: [],
    netAreaSqM: 0, netAreaSqFt: 0,
    count: 1,
    outer: '', minus: '',
    submissionType: 'Room',
  };
}

function makeDefaultOpenSpaceLike(index: number, namePrefix: string, submissionType: string): any {
  return {
    id: nextEntityId(submissionType === 'Amenity' ? 'am' : 'os'),
    name: `${namePrefix} ${index + 1}`,
    roomNo: `${namePrefix} ${index + 1}`,
    roomType: namePrefix,
    shape: '',
    length: 0, width: 0, height: 0, base1: 0, base2: 0, radius: 0,
    areaSqM: 0, areaSqFt: 0,
    hasOffset: 'No',
    offsets: [],
    offsetAreaSqM: 0,
    offsetOp: 'Subtract',
    netAreaSqM: 0, netAreaSqFt: 0,
    count: 1,
    outer: 'No', minus: 'No',
    submissionType,
  };
}

export function makeDefaultOpenSpace(index: number): any {
  return makeDefaultOpenSpaceLike(index, 'Open Space', 'Open Space');
}

export function makeDefaultAmenity(index: number): any {
  return makeDefaultOpenSpaceLike(index, 'Amenity', 'Amenity');
}

export interface AreaTotals {
  rooms: number;
  openSpaces: number;
  amenities: number;
  carpetAreaSqFt: number;
  builtUpAreaSqFt: number;
}

export function computeAreaTotals(rooms: any[], spaces: any[], amenities: any[] = []): AreaTotals {
  const roomsSqM = rooms.reduce((acc, r) => {
    const netA = r.netAreaSqM * r.count;
    if (r.minus === 'Yes') return acc - netA;
    if (r.outer === 'Yes') return acc + netA * 0.8;
    return acc + netA;
  }, 0);

  const spacesSqM = spaces.reduce((acc, os) => acc + os.netAreaSqM * os.count, 0);
  const amenitiesSqM = amenities.reduce((acc, am) => acc + am.netAreaSqM * am.count, 0);

  const totalCarpetSqM = Math.max(0, roomsSqM + spacesSqM + amenitiesSqM);
  const totalCarpetSqFt = totalCarpetSqM * 10.7639;
  const totalBuiltUpSqFt = totalCarpetSqM * 1.2 * 10.7639;

  return {
    rooms: rooms.reduce((acc, r) => acc + (r.count || 1), 0),
    openSpaces: spaces.reduce((acc, os) => acc + (os.count || 1), 0),
    amenities: amenities.reduce((acc, am) => acc + (am.count || 1), 0),
    carpetAreaSqFt: parseFloat(totalCarpetSqFt.toFixed(2)),
    builtUpAreaSqFt: parseFloat(totalBuiltUpSqFt.toFixed(2)),
  };
}
