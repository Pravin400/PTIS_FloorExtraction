/* eslint-disable @typescript-eslint/no-explicit-any */
import { Room, blankRoom, computeRoom, makeId, calcAreaSqM } from "@/lib/utils/asset-utils/room-utils";

/** Maps a unit's raw persisted room data into the drawer's Room[] shape,
 * backfilling legacy single-offset fields (offsetShape/offsetLength/...)
 * into the modern `offsets` array when no `offsets` array was saved. */
export function mapUnitRoomsToDrawerRooms(unit: any): Room[] {
  if (!Array.isArray(unit?.rooms)) return [];

  return unit.rooms.map((r: any) => {
    const rawOffsets = Array.isArray(r.offsets)
      ? r.offsets
      : Array.isArray(r.Offsets)
        ? r.Offsets
        : Array.isArray(r.minusDetails)
          ? r.minusDetails
          : Array.isArray(r.MinusDetails)
            ? r.MinusDetails
            : Array.isArray(r.roomWiseMinusData)
              ? r.roomWiseMinusData
              : [];

    let rOffsets = rawOffsets.map((off: any) => ({
      id: off.id || off.Id || makeId(),
      shape: off.shape || off.Shape || "Rectangle",
      length: Number(off.length ?? off.Length ?? off.lengthMtr ?? off.LengthMtr ?? 0),
      width: Number(off.width ?? off.Width ?? off.widthMtr ?? off.WidthMtr ?? 0),
      height: Number(off.height ?? off.Height ?? off.heightMtr ?? off.HeightMtr ?? 0),
      base1: Number(off.base1 ?? off.Base1 ?? off.base1Mtr ?? off.Base1Mtr ?? 0),
      base2: Number(off.base2 ?? off.Base2 ?? off.base2Mtr ?? off.Base2Mtr ?? 0),
      radius: Number(off.radius ?? off.Radius ?? off.radiusMtr ?? off.RadiusMtr ?? 0),
      areaSqM: Number(off.areaSqM ?? off.AreaSqM ?? off.areaSqMtr ?? off.AreaSqMtr ?? off.area ?? 0),
      op: off.op || off.operation || "Subtract",
    }));

    if (rOffsets.length === 0 && (r.hasOffset === "Yes" || r.minusYesNo || r.InMinus === 1)) {
      const legacyArea = calcAreaSqM(
        r.offsetShape || "Rectangle",
        Number(r.offsetLength || 0), Number(r.offsetWidth || 0), Number(r.offsetHeight || 0),
        Number(r.offsetBase1 || 0), Number(r.offsetBase2 || 0), Number(r.offsetRadius || 0)
      );
      if (legacyArea > 0) {
        rOffsets = [{
          id: makeId(),
          shape: r.offsetShape || "Rectangle",
          length: Number(r.offsetLength || 0), width: Number(r.offsetWidth || 0), height: Number(r.offsetHeight || 0),
          base1: Number(r.offsetBase1 || 0), base2: Number(r.offsetBase2 || 0), radius: Number(r.offsetRadius || 0),
          areaSqM: legacyArea,
          op: r.offsetOp || "Subtract",
        }];
      }
    }

    const roomShape = String(r.shape ?? r.Shape ?? "Rectangle");
    const len = Number(r.length ?? r.Length ?? r.lengthMtr ?? r.LengthMtr ?? 0);
    const wid = Number(r.width ?? r.Width ?? r.widthMtr ?? r.WidthMtr ?? 0);
    const hgt = Number(r.height ?? r.Height ?? r.heightMtr ?? r.HeightMtr ?? 0);
    const b1 = Number(r.base1 ?? r.Base1 ?? r.base1Mtr ?? r.Base1Mtr ?? 0);
    const b2 = Number(r.base2 ?? r.Base2 ?? r.base2Mtr ?? r.Base2Mtr ?? 0);
    const rad = Number(r.radius ?? r.Radius ?? r.radiusMtr ?? r.RadiusMtr ?? 0);
    const rawAreaSqM = Number(r.areaSqM ?? r.AreaSqM ?? r.areaSqMtr ?? r.AreaSqMtr ?? r.area ?? 0);
    const roomCount = Number(r.count ?? r.Count ?? r.noOfRooms ?? r.NoOfRooms ?? 1);
    const isOuter = (r.outer === "Yes" || r.outer === true || r.outerYesNo || r.OuterYesNo || r.inOuter === 1 || r.InOuter === 1);
    const isMinus = (r.minus === "Yes" || r.minus === true || r.minusYesNo || r.MinusYesNo || r.inMinus === 1 || r.InMinus === 1);
    const hasOff = (r.hasOffset === "Yes" || rOffsets.length > 0);

    const baseRoom = computeRoom({
      ...blankRoom(1),
      id: r.id || r.Id || r.roomWiseSubmissionId || makeId(),
      roomNo: String(r.roomNo ?? r.RoomNo ?? ""),
      roomType: String(r.roomType ?? r.RoomType ?? ""),
      shape: roomShape,
      length: len, width: wid, height: hgt,
      base1: b1, base2: b2, radius: rad,
      count: roomCount,
      outer: isOuter ? "Yes" : "No",
      minus: isMinus ? "Yes" : "No",
      hasOffset: hasOff ? "Yes" : "No",
      offsetShape: r.offsetShape || "Rectangle",
      offsetLength: Number(r.offsetLength || 0), offsetWidth: Number(r.offsetWidth || 0), offsetHeight: Number(r.offsetHeight || 0),
      offsetBase1: Number(r.offsetBase1 || 0), offsetBase2: Number(r.offsetBase2 || 0), offsetRadius: Number(r.offsetRadius || 0),
      offsetOp: r.offsetOp || "Subtract",
      offsets: rOffsets,
    });

    // If dimension calculation resulted in 0 area but rawAreaSqM was saved in DB, restore it
    if (baseRoom.areaSqM <= 0 && rawAreaSqM > 0) {
      baseRoom.areaSqM = rawAreaSqM;
      baseRoom.areaSqFt = rawAreaSqM * 10.7639;
      baseRoom.netAreaSqM = rawAreaSqM;
      baseRoom.netAreaSqFt = rawAreaSqM * 10.7639;
    }

    return baseRoom;
  });
}
