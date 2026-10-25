/* eslint-disable @typescript-eslint/no-explicit-any */
import { calculateArea } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-area.utils';

export function mapStandaloneUnitRooms(u: any): any[] {
  if (!Array.isArray(u.roomWiseDetails)) return [];

  return u.roomWiseDetails.map((r: any) => {
    let areaSqM = Number(r.areaSqMtr || r.areaSqM || 0);
    if (areaSqM <= 0) {
      areaSqM = calculateArea(
        r.shape || "Rectangle",
        Number(r.lengthMtr || 0),
        Number(r.widthMtr || 0),
        Number(r.radiusMtr || r.lengthMtr || r.widthMtr || 0),
        Number(r.base1Mtr || 0),
        Number(r.base2Mtr || 0),
        Number(r.heightMtr || 0)
      );
    }
    const areaSqFt = areaSqM * 10.7639;
    const rOffsets = Array.isArray(r.offsets) ? r.offsets.map((off: any) => {
      const sh = off.shape || "Rectangle";
      const len = Number(off.length !== undefined ? off.length : (off.radius || 0));
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
        op: off.op || "Subtract"
      };
    }) : [];

    let netAdjustmentSqM = 0;
    rOffsets.forEach((off: any) => {
      const offArea = Number(off.areaSqM || 0);
      if (off.op === "Add") {
        netAdjustmentSqM += offArea;
      } else {
        netAdjustmentSqM -= offArea;
      }
    });

    const netSqM = Math.max(0, areaSqM + netAdjustmentSqM);
    const netSqFt = netSqM * 10.7639;
    const isOS = r.roomType === "Open Space" || r.submissionType === "Open Space";

    return {
      id: r.id,
      roomNo: r.roomNo,
      roomType: r.roomType,
      shape: r.shape || "Rectangle",
      // Dimensions in meters (stored in DB)
      length: Number(r.lengthMtr || 0),
      width: Number(r.widthMtr || 0),
      height: Number(r.heightMtr || 0),
      base1: Number(r.base1Mtr || 0),
      base2: Number(r.base2Mtr || 0),
      radius: Number(r.radiusMtr || r.widthMtr || 0),
      // Calculated area
      areaSqM,
      areaSqFt,
      offsets: rOffsets,
      hasOffset: rOffsets.length > 0 ? "Yes" : "No",
      netAreaSqM: netSqM,
      netAreaSqFt: netSqFt,
      count: Number(r.noOfRooms || 1),
      outer: r.outerYesNo ? "Yes" : "No",
      minus: r.minus === "Yes" ? "Yes" : "No",
      submissionType: isOS ? "Open Space" : (r.submissionType || "Room"),
    };
  });
}

export function computeStandaloneUnitCarpetArea(u: any, mappedRooms: any[]): number {
  const rawArea = Number(u.totalAreaSqFt || u.carpetAreaSqFeet || u.carpetAreaSqFt || 0);
  if (rawArea > 0) return rawArea;
  if (mappedRooms.length === 0) return 0;
  return mappedRooms.reduce((acc, r) => {
    const netAreaSqFt = r.netAreaSqFt !== undefined
      ? Number(r.netAreaSqFt)
      : (r.netAreaSqM !== undefined
        ? Number(r.netAreaSqM) * 10.7639
        : Number(r.areaSqFt || r.area || 0));
    const roomSqFt = netAreaSqFt * Number(r.count || 1);
    if (r.submissionType?.includes("Open Space") || r.roomType === "Open Space") {
      return acc + roomSqFt;
    }
    if (r.minus === "Yes" || r.offset === "Yes") return acc - roomSqFt;
    if (r.outer === "Yes") return acc + roomSqFt * 0.8;
    return acc + roomSqFt;
  }, 0);
}
