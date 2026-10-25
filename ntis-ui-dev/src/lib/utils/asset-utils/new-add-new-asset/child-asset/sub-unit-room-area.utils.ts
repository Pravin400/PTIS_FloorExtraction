/* eslint-disable @typescript-eslint/no-explicit-any */
/** Computes carpet/built-up area totals (sq.m and sq.ft) for a room list,
 * applying the minus/outer offset rules once instead of re-deriving the same
 * reduce sum four times per render. */
export function computeRoomAreaTotals(roomsList: any[]) {
  const carpetSqM = Math.max(
    0,
    roomsList.reduce((acc, r) => {
      const netA = r.netAreaSqM * r.count;
      if (r.minus === 'Yes') return acc - netA;
      if (r.outer === 'Yes') return acc + netA * 0.8;
      return acc + netA;
    }, 0)
  );
  return {
    carpetSqM,
    carpetSqFt: carpetSqM * 10.7639,
    builtUpSqM: carpetSqM * 1.2,
    builtUpSqFt: carpetSqM * 1.2 * 10.7639,
  };
}
