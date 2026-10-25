/* eslint-disable @typescript-eslint/no-explicit-any */
function buildRoomOffsetsForEdit(offsets: any[]) {
  return Array.isArray(offsets)
    ? offsets.map((off: any) => ({
      id: String(off.id || ''),
      shape: off.shape || 'Rectangle',
      length: (() => {
        const val = Number(off.length ?? off.lengthMtr ?? 0);
        if (
          val === 0 &&
          (off.shape === 'Square' || String(off.shape).toLowerCase() === 'square') &&
          Number(off.areaSqM || 0) > 0
        ) {
          return Math.round(Math.sqrt(Number(off.areaSqM)) * 100) / 100;
        }
        return val;
      })(),
      width: Number(off.width ?? off.widthMtr ?? 0),
      height: Number(off.height ?? off.heightMtr ?? 0),
      base1: Number(off.base1 ?? off.base1Mtr ?? 0),
      base2: Number(off.base2 ?? off.base2Mtr ?? 0),
      radius: (() => {
        const val = Number(
          off.radius ?? off.radiusMtr ?? off.length ?? off.lengthMtr ?? off.widthMtr ?? 0
        );
        const areaSqM = Number(off.areaSqM || 0);
        if (val === 0 && areaSqM > 0) {
          const sh = String(off.shape).toLowerCase();
          if (sh === 'circle') return Math.round(Math.sqrt(areaSqM / Math.PI) * 100) / 100;
          if (sh === 'semi circle' || sh === 'semicircle')
            return Math.round(Math.sqrt((areaSqM * 2) / Math.PI) * 100) / 100;
          if (sh === 'quarter')
            return Math.round(Math.sqrt((areaSqM * 4) / Math.PI) * 100) / 100;
        }
        return val;
      })(),
      areaSqM: Number(off.areaSqM || 0),
      op: off.op || 'Subtract',
    }))
    : [];
}

export function mapRoomsFromDb(roomsFromDb: any[]) {
  return roomsFromDb.map((r: any) => {
    const rOffsets = buildRoomOffsetsForEdit(r.offsets);

    const areaSqM = Number(r.areaSqMtr || r.areaSqM || 0);
    const resolvedLength = (() => {
      const val = Number(r.lengthMtr ?? r.length ?? 0);
      if (
        val === 0 &&
        (r.shape === 'Square' || String(r.shape).toLowerCase() === 'square') &&
        areaSqM > 0
      ) {
        return Math.round(Math.sqrt(areaSqM) * 100) / 100;
      }
      return val;
    })();
    const resolvedRadius = (() => {
      const val = Number(
        r.radiusMtr ?? r.radius ?? r.lengthMtr ?? r.length ?? r.widthMtr ?? r.width ?? 0
      );
      if (val === 0 && areaSqM > 0) {
        const sh = String(r.shape).toLowerCase();
        if (sh === 'circle') return Math.round(Math.sqrt(areaSqM / Math.PI) * 100) / 100;
        if (sh === 'semi circle' || sh === 'semicircle')
          return Math.round(Math.sqrt((areaSqM * 2) / Math.PI) * 100) / 100;
        if (sh === 'quarter') return Math.round(Math.sqrt((areaSqM * 4) / Math.PI) * 100) / 100;
      }
      return val;
    })();

    return {
      id: r.id ? String(r.id) : String(Math.random()),
      roomNo: String(r.roomNo || '1'),
      roomType: String(r.roomType || ''),
      shape: String(r.shape || ''),
      length: resolvedLength,
      width: Number(r.widthMtr ?? r.width ?? 0),
      height: Number(r.heightMtr ?? r.height ?? 0),
      areaSqM: areaSqM,
      areaSqFt: areaSqM * 10.7639,
      base1: Number(r.base1Mtr ?? r.base1 ?? 0),
      base2: Number(r.base2Mtr ?? r.base2 ?? 0),
      radius: resolvedRadius,
      hasOffset: rOffsets.length > 0 ? 'Yes' : 'No',
      offsets: rOffsets,
      offsetShape: rOffsets.length > 0 ? rOffsets[0].shape : 'Rectangle',
      offsetLength: rOffsets.length > 0 ? rOffsets[0].length : 0,
      offsetWidth: rOffsets.length > 0 ? rOffsets[0].width : 0,
      offsetHeight: rOffsets.length > 0 ? rOffsets[0].height : 0,
      offsetBase1: rOffsets.length > 0 ? rOffsets[0].base1 : 0,
      offsetBase2: rOffsets.length > 0 ? rOffsets[0].base2 : 0,
      offsetRadius: rOffsets.length > 0 ? rOffsets[0].radius : 0,
      offsetAreaSqM: rOffsets.length > 0 ? rOffsets[0].areaSqM : 0,
      offsetOp: rOffsets.length > 0 ? rOffsets[0].op : 'Subtract',
      netAreaSqM:
        Number(r.totalAreaSqMtr || r.areaSqMtr || r.areaSqM || 0) /
        Number(r.noOfRooms || r.count || 1),
      netAreaSqFt:
        (Number(r.totalAreaSqMtr || r.areaSqMtr || r.areaSqM || 0) /
          Number(r.noOfRooms || r.count || 1)) *
        10.7639,
      count: Number(r.noOfRooms || r.count || 1),
      outer: r.outerYesNo ? 'Yes' : 'No',
      minus: r.minus === 'Yes' ? 'Yes' : 'No',
      submissionType: r.submissionType || 'Room',
    };
  });
}
