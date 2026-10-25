/* eslint-disable @typescript-eslint/no-explicit-any */
import { calculateArea } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-area.utils';

/** Maps raw DB room-wise detail rows (as returned nested under a sub-unit/child
 * asset) into the display shape the floor-details table/drawers use. */
export function mapRoomWiseDetails(rawRoomDetails: any[]) {
  return rawRoomDetails.map((r: any) => {
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
          id: off.id ? String(off.id) : '',
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
    const isAmenity = r.roomType === 'Amenity' || r.submissionType === 'Amenity';

    return {
      id: r.id ? String(r.id) : String(Math.random()),
      roomNo: String(r.roomNo || '1'),
      roomType: String(r.roomType || ''),
      shape: String(r.shape || ''),
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
      outer: r.outerYesNo || r.outer === 'Yes' ? 'Yes' : 'No',
      minus: r.minus === 'Yes' ? 'Yes' : 'No',
      submissionType: isOS ? 'Open Space' : isAmenity ? 'Amenity' : r.submissionType || 'Room',
    };
  });
}

/** Extracts the raw room-wise-detail array from whichever field name the API
 * response happened to use for this sub-unit. */
export function extractRawRoomDetails(u: any) {
  return Array.isArray(u.roomWiseDetails)
    ? u.roomWiseDetails
    : Array.isArray(u.roomDetails)
      ? u.roomDetails
      : Array.isArray(u.roomWiseSubmissions)
        ? u.roomWiseSubmissions
        : Array.isArray(u.rooms)
          ? u.rooms
          : [];
}
