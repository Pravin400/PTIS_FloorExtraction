 
import { aggregateOffsets, calcAreaSqM, sqmToSqft, OffsetEntry } from "@/lib/utils/asset-utils/room-utils";

export interface OpenSpace {
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

function makeId() {
  return Math.random().toString(36).substr(2, 9);
}

export function blankOpenSpace(_count?: number): OpenSpace {
  return {
    id: makeId(),
    name: "",
    roomNo: "",
    roomType: "Open Space",
    shape: "",
    length: 0, width: 0, height: 0, base1: 0, base2: 0, radius: 0,
    areaSqM: 0, areaSqFt: 0,
    hasOffset: "", offsets: [], offsetAreaSqM: 0, offsetOp: "Subtract",
    netAreaSqM: 0, netAreaSqFt: 0,
    count: 1,
    submissionType: "Open Space",
    outer: "No", minus: "No"
  };
}

export function computeOpenSpace(os: OpenSpace): OpenSpace {
  const mainSqM = calcAreaSqM(os.shape, os.length, os.width, os.height, os.base1, os.base2, os.radius);
  const offsetList = Array.isArray(os.offsets) ? os.offsets : [];
  const { netAdjustmentSqM: netAdj } = aggregateOffsets(offsetList);
    const netSqM = Math.max(0, mainSqM + (offsetList.length > 0 ? netAdj : 0));
  return {
    ...os,
    roomNo: os.name,
    areaSqM: mainSqM,
    areaSqFt: sqmToSqft(mainSqM),
    offsets: offsetList,
    offsetAreaSqM: Math.abs(netAdj),
    offsetOp: netAdj >= 0 ? "Add" : "Subtract",
    hasOffset: (os.hasOffset === "Yes" ? "Yes" : (offsetList.length > 0 ? "Yes" : (os.hasOffset || "No"))) as "Yes" | "No" | "",
    netAreaSqM: netSqM,
    netAreaSqFt: sqmToSqft(netSqM),
    submissionType: "Open Space",
  };
}
