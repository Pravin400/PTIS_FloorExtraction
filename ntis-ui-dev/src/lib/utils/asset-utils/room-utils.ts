 
export interface OffsetEntry {
  id: string;
  shape: string;
  length: number;
  width: number;
  height: number;
  base1: number;
  base2: number;
  radius: number;
  areaSqM: number;
  op: "Add" | "Subtract";
}

export interface Room {
  id: string;
  roomNo: string;
  roomType: string;
  shape: string;
  // Main dimensions (meters)
  length: number; width: number; height: number;
  base1: number; base2: number; radius: number;
  // Calculated from main dimensions
  areaSqM: number; areaSqFt: number;
  // Offset/cutout within this room (deducted from areaSqM)
  offsetShape: string;
  offsetLength: number; offsetWidth: number; offsetHeight: number;
  offsetBase1: number; offsetBase2: number; offsetRadius: number;
  offsetAreaSqM: number;    // auto-calculated cutout area
  hasOffset: "No" | "Yes" | ""; // whether this room has a cutout
  offsetOp?: "Add" | "Subtract"; // add or subtract offset
  offsets?: OffsetEntry[]; // list of multiple offset cutouts
  // Net area = areaSqM - offsetAreaSqM
  netAreaSqM: number; netAreaSqFt: number;
  count: number;
  // Outer=Yes → counted at 50% towards carpet (e.g. balcony, terrace)
  outer: "No" | "Yes" | "";
  // Minus=Yes → entire room deducted from building carpet total
  minus: "No" | "Yes" | "";
}

export const ROOM_TYPES: string[] = [];

export const SHAPES = [
  { value: "Rectangle", label: "Rectangle" },
  { value: "Square", label: "Square" },
  { value: "Triangle", label: "Triangle" },
  { value: "Trapezoid", label: "Trapezoid" },
  { value: "Circle", label: "Circle" },
  { value: "Semi Circle", label: "Semi Circle" },
  { value: "Quarter", label: "Quarter Circle" },
];

export function calcAreaSqM(shape: string, L = 0, W = 0, H = 0, B1 = 0, B2 = 0, R = 0): number {
  const s = (shape || "Rectangle").toLowerCase();
  switch (s) {
    case "rectangle": return L * W;
    case "square": return L * L;
    case "triangle": return 0.5 * L * H;
    case "trapezoid": return 0.5 * (B1 + B2) * H;
    case "circle": return Math.PI * R * R;
    case "semi circle":
    case "semicircle": return 0.5 * Math.PI * R * R;
    case "quarter": return 0.25 * Math.PI * R * R;
    default: return L * W;
  }
}

export const sqmToSqft = (v: number) => v * 10.7639;

export function formulaText(shape: string, L = 0, W = 0, H = 0, B1 = 0, B2 = 0, R = 0): string {
  const s = (shape || "Rectangle").toLowerCase();
  switch (s) {
    case "rectangle": return `L×W = ${L}×${W} = ${(L * W).toFixed(2)} sq.m`;
    case "square": return `Side² = (${L}m)² = ${(L * L).toFixed(2)} sq.m`;
    case "triangle": return `½BH = ½×${L}×${H} = ${(0.5 * L * H).toFixed(2)} sq.m`;
    case "trapezoid": return `½(B1+B2)H = ½×(${B1}+${B2})×${H} = ${(0.5 * (B1 + B2) * H).toFixed(2)} sq.m`;
    case "circle": return `πr² = π×${R}² = ${(Math.PI * R * R).toFixed(2)} sq.m`;
    case "semi circle":
    case "semicircle": return `½πr² = ${(0.5 * Math.PI * R * R).toFixed(2)} sq.m`;
    case "quarter": return `¼πr² = ${(0.25 * Math.PI * R * R).toFixed(2)} sq.m`;
    default: return "";
  }
}

export type DimKey = "length" | "width" | "height" | "base1" | "base2" | "radius";

export function getDimFields(shape: string): { key: DimKey; label: string }[] {
  const s = (shape || "Rectangle").toLowerCase();
  switch (s) {
    case "rectangle": return [{ key: "length", label: "Length (m)" }, { key: "width", label: "Width (m)" }];
    case "square": return [{ key: "length", label: "Side (m)" }];
    case "triangle": return [{ key: "length", label: "Base (m)" }, { key: "height", label: "Height (m)" }];
    case "trapezoid": return [{ key: "base1", label: "Base 1 (m)" }, { key: "base2", label: "Base 2 (m)" }, { key: "height", label: "Height (m)" }];
    default: return [{ key: "radius", label: "Radius (m)" }]; // Circle/Semi/Quarter
  }
}

export function getLocalizedDimLabel(shape: string, key: string, label: string, t?: (key: string) => string): string {
  if (!t) return label;
  const shapeLower = (shape || "").toLowerCase();
  if (shapeLower === "rectangle") {
    if (key === "length") return t("subunit.dimensions.length");
    if (key === "width") return t("subunit.dimensions.width");
  }
  if (shapeLower === "square") {
    if (key === "length") return t("subunit.dimensions.side");
  }
  if (shapeLower === "triangle") {
    if (key === "length") return t("subunit.dimensions.base");
    if (key === "height") return t("subunit.dimensions.height");
  }
  if (shapeLower === "trapezoid") {
    if (key === "base1") return t("subunit.dimensions.base1");
    if (key === "base2") return t("subunit.dimensions.base2");
    if (key === "height") return t("subunit.dimensions.height");
  }
  if (key === "radius") return t("subunit.dimensions.radius");
  return label;
}

export interface OffsetAggregate {
  netAdjustmentSqM: number;
  totalAddSqM: number;
  totalSubtractSqM: number;
}

/** Reduces a list of offset cutouts (Room/Amenity/OpenSpace share this shape) to a signed net area adjustment. */
export function aggregateOffsets(offsets: OffsetEntry[] | undefined): OffsetAggregate {
  let netAdjustmentSqM = 0;
  let totalAddSqM = 0;
  let totalSubtractSqM = 0;

  if (Array.isArray(offsets)) {
    offsets.forEach((off) => {
      const offArea = calcAreaSqM(off.shape, off.length, off.width, off.height, off.base1, off.base2, off.radius);
      if (off.op === "Add") {
        netAdjustmentSqM += offArea;
        totalAddSqM += offArea;
      } else {
        netAdjustmentSqM -= offArea;
        totalSubtractSqM += offArea;
      }
    });
  }

  return { netAdjustmentSqM, totalAddSqM, totalSubtractSqM };
}

export function makeId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID() : `r-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function blankRoom(no: number): Room {
  return {
    id: makeId(), roomNo: String(no), roomType: "", shape: "",
    length: 0, width: 0, height: 0, base1: 0, base2: 0, radius: 0,
    areaSqM: 0, areaSqFt: 0,
    offsetShape: "Rectangle", offsetLength: 0, offsetWidth: 0, offsetHeight: 0,
    offsetBase1: 0, offsetBase2: 0, offsetRadius: 0,
    offsetAreaSqM: 0, hasOffset: "",
    offsetOp: "Subtract",
    offsets: [],
    netAreaSqM: 0, netAreaSqFt: 0,
    count: 1, outer: "", minus: "",
  };
}

export function computeRoom(r: Room): Room {
  const mainSqM = calcAreaSqM(r.shape, r.length, r.width, r.height, r.base1, r.base2, r.radius);

  let netAdjustmentSqM = 0;
  const offsetList = Array.isArray(r.offsets) ? r.offsets : [];

  if (offsetList.length > 0) {
    netAdjustmentSqM = aggregateOffsets(offsetList).netAdjustmentSqM;
  } else if (r.hasOffset === "Yes") {
    // Fallback to legacy fields ONLY if dimensions are non-zero
    const offSqM = calcAreaSqM(r.offsetShape, r.offsetLength, r.offsetWidth, r.offsetHeight, r.offsetBase1, r.offsetBase2, r.offsetRadius);
    if (offSqM > 0) {
      netAdjustmentSqM = r.offsetOp === "Add" ? offSqM : -offSqM;
    }
  }

  const effectiveHasOffset = offsetList.length > 0 || Math.abs(netAdjustmentSqM) > 0 ? "Yes" : "No";
  const finalNetSqM = Math.max(0, mainSqM + netAdjustmentSqM);
  const firstOffset = offsetList.length > 0 ? offsetList[0] : null;

  return {
    ...r,
    areaSqM: mainSqM,
    areaSqFt: sqmToSqft(mainSqM),
    offsets: effectiveHasOffset === "Yes" ? offsetList : [],
    // Map first offset to single fields for compatibility
    offsetShape: firstOffset ? firstOffset.shape : (effectiveHasOffset === "Yes" ? r.offsetShape : "Rectangle"),
    offsetLength: firstOffset ? firstOffset.length : (effectiveHasOffset === "Yes" ? r.offsetLength : 0),
    offsetWidth: firstOffset ? firstOffset.width : (effectiveHasOffset === "Yes" ? r.offsetWidth : 0),
    offsetHeight: firstOffset ? firstOffset.height : (effectiveHasOffset === "Yes" ? r.offsetHeight : 0),
    offsetBase1: firstOffset ? firstOffset.base1 : (effectiveHasOffset === "Yes" ? r.offsetBase1 : 0),
    offsetBase2: firstOffset ? firstOffset.base2 : (effectiveHasOffset === "Yes" ? r.offsetBase2 : 0),
    offsetRadius: firstOffset ? firstOffset.radius : (effectiveHasOffset === "Yes" ? r.offsetRadius : 0),
    offsetAreaSqM: effectiveHasOffset === "Yes" ? Math.abs(netAdjustmentSqM) : 0,
    offsetOp: netAdjustmentSqM >= 0 ? "Add" : "Subtract",
    hasOffset: effectiveHasOffset,
    netAreaSqM: finalNetSqM,
    netAreaSqFt: sqmToSqft(finalNetSqM),
  };
}
