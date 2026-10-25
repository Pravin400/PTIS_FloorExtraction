 
import { aggregateOffsets, calcAreaSqM, sqmToSqft, OffsetEntry } from "@/lib/utils/asset-utils/room-utils";

export interface Amenity {
  id: string;
  name: string;
  roomNo: string;
  roomType: string;
  shape: string;
  length: number;
  width: number;
  height: number;
  base1: number;
  base2: number;
  radius: number;
  areaSqM: number;
  areaSqFt: number;
  hasOffset: "No" | "Yes" | "";
  offsets: OffsetEntry[];
  offsetAreaSqM: number;
  offsetOp: "Add" | "Subtract";
  netAreaSqM: number;
  netAreaSqFt: number;
  count: number;
  submissionType: string;
  outer: "No";
  minus: "No";
}

export function makeAmenityId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `amenity-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function blankAmenity(_no?: number): Amenity {
  return {
    id: makeAmenityId(), name: ``, roomNo: ``, roomType: "Amenity",
    shape: "",
    length: 0, width: 0, height: 0, base1: 0, base2: 0, radius: 0,
    areaSqM: 0, areaSqFt: 0,
    hasOffset: "", offsets: [], offsetAreaSqM: 0, offsetOp: "Subtract",
    netAreaSqM: 0, netAreaSqFt: 0,
    count: 1, submissionType: "Amenity", outer: "No", minus: "No",
  };
}

export function computeAmenity(a: Amenity): Amenity {
  const mainSqM = calcAreaSqM(a.shape, a.length, a.width, a.height, a.base1, a.base2, a.radius);
  const offsetList = Array.isArray(a.offsets) ? a.offsets : [];
  const { netAdjustmentSqM: netAdj } = aggregateOffsets(offsetList);
  const effectiveHasOffset = offsetList.length > 0 || (a.hasOffset === "Yes" && Math.abs(netAdj) > 0) ? "Yes" : "No";
  const netSqM = Math.max(0, mainSqM + (effectiveHasOffset === "Yes" ? netAdj : 0));
  return {
    ...a,
    roomNo: a.name,
    areaSqM: mainSqM,
    areaSqFt: sqmToSqft(mainSqM),
    offsets: effectiveHasOffset === "Yes" ? offsetList : [],
    offsetAreaSqM: effectiveHasOffset === "Yes" ? Math.abs(netAdj) : 0,
    offsetOp: netAdj >= 0 ? "Add" : "Subtract",
    hasOffset: effectiveHasOffset,
    netAreaSqM: netSqM,
    netAreaSqFt: sqmToSqft(netSqM),
    submissionType: "Amenity",
  };
}
