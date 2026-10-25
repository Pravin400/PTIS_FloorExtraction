/* eslint-disable @typescript-eslint/no-explicit-any */
import { calculateArea } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-utils';

const ROOM_FIELD_CANDIDATES = ['roomWiseDetails', 'roomDetails', 'roomWiseSubmissions', 'rooms'];

/** Finds whichever field on the raw sub-unit actually holds its room-wise
 * detail array — the API response uses inconsistent field names depending on
 * which endpoint produced it, so every known name is tried before falling
 * back to scanning all array fields for room-shaped objects. */
function resolveRoomSource(u: any): any[] {
  for (const field of ROOM_FIELD_CANDIDATES) {
    if (Array.isArray(u[field]) && u[field].length > 0) {
      return u[field];
    }
  }
  for (const key of Object.keys(u)) {
    const val = u[key];
    if (
      Array.isArray(val) &&
      val.length > 0 &&
      val[0] &&
      (val[0].roomNo !== undefined || val[0].roomType !== undefined)
    ) {
      return val;
    }
  }
  return [];
}

export function mapPoolUnitRooms(u: any): any[] {
  const roomSource = resolveRoomSource(u);
  if (roomSource.length === 0) return [];

  return roomSource.map((r: any) => {
    let areaSqM = Number(r.areaSqMtr || r.areaSqM || 0);
    if (areaSqM <= 0) {
      areaSqM = calculateArea(
        r.shape || 'Rectangle',
        Number(r.lengthMtr || 0),
        Number(r.widthMtr || 0),
        Number(r.radiusMtr || r.lengthMtr || r.widthMtr || 0),
        Number(r.base1Mtr || 0),
        Number(r.base2Mtr || 0),
        Number(r.heightMtr || 0)
      );
    }
    const areaSqFt = areaSqM * 10.7639;
    const rOffsets = Array.isArray(r.offsets)
      ? r.offsets.map((off: any) => {
        const sh = off.shape || 'Rectangle';
        const len = Number(off.length !== undefined ? off.length : off.radius || 0);
        const wid = Number(off.width || 0);
        const h = Number(off.height || 0);
        const b1 = Number(off.base1 || 0);
        const b2 = Number(off.base2 || 0);
        const rad = Number(off.radius !== undefined ? off.radius : len);
        let oArea = Number(off.areaSqM || 0);
        if (oArea <= 0) {
          oArea = calculateArea(sh, len, wid, rad, b1, b2, h);
        }
        return {
          id: off.id,
          shape: sh,
          length: len,
          width: wid,
          height: h,
          base1: b1,
          base2: b2,
          radius: rad,
          areaSqM: oArea,
          op: off.op || 'Subtract',
        };
      })
      : [];

    let netAdjustmentSqM = 0;
    rOffsets.forEach((off: any) => {
      const offArea = Number(off.areaSqM || 0);
      if (off.op === 'Add') {
        netAdjustmentSqM += offArea;
      } else {
        netAdjustmentSqM -= offArea;
      }
    });

    const netSqM = Math.max(0, areaSqM + netAdjustmentSqM);
    const netSqFt = netSqM * 10.7639;
    const isOS = r.roomType === 'Open Space' || r.submissionType === 'Open Space';

    return {
      id: r.id,
      roomNo: r.roomNo,
      roomType: r.roomType,
      shape: r.shape || 'Rectangle',
      length: (() => {
        const val = Number(r.lengthMtr || 0);
        if (val === 0 && r.shape === 'Square' && areaSqM > 0) {
          return Math.round(Math.sqrt(areaSqM) * 100) / 100;
        }
        return val;
      })(),
      width: Number(r.widthMtr || 0),
      height: Number(r.heightMtr || 0),
      base1: Number(r.base1Mtr || 0),
      base2: Number(r.base2Mtr || 0),
      radius: (() => {
        const val = Number(r.radiusMtr || r.lengthMtr || r.widthMtr || 0);
        if (val === 0 && areaSqM > 0) {
          if (r.shape === 'Circle') return Math.round(Math.sqrt(areaSqM / Math.PI) * 100) / 100;
          if (r.shape === 'Semi Circle')
            return Math.round(Math.sqrt((areaSqM * 2) / Math.PI) * 100) / 100;
          if (r.shape === 'Quarter')
            return Math.round(Math.sqrt((areaSqM * 4) / Math.PI) * 100) / 100;
        }
        return val;
      })(),
      areaSqM,
      areaSqFt,
      offsets: rOffsets,
      hasOffset: rOffsets.length > 0 ? 'Yes' : 'No',
      netAreaSqM: netSqM,
      netAreaSqFt: netSqFt,
      count: Number(r.noOfRooms || 1),
      outer: r.outerYesNo ? 'Yes' : 'No',
      minus: r.minus === 'Yes' ? 'Yes' : 'No',
      subFloorId: u.subFloorId || u.SubFloorId || null,
      submissionType: isOS ? 'Open Space' : r.submissionType || 'Room',
    };
  });
}
