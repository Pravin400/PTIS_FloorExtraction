/* eslint-disable @typescript-eslint/no-explicit-any */
/** Resolves a standalone sub-unit's floor identity and construction
 * classification fields, cross-referencing whichever of floorDetailsId /
 * floor-level id the raw sub-unit carries against the already-loaded
 * parentFloors. */
export function resolveStandaloneUnitFloorContext(u: any, parentFloors: any[]) {
  let floorDetailsId = u.floorDetailsId ?? u.FloorDetailsId ?? null;
  let resolvedFloorLevelId = u.floorId ?? u.FloorId ?? u.selectedFloorId ?? null;
  const subFloorId = u.subFloorId ?? u.SubFloorId ?? null;

  if (floorDetailsId && !resolvedFloorLevelId) {
    const floorDetail = parentFloors.find((f: any) => Number(f.id ?? f.Id) === Number(floorDetailsId));
    if (floorDetail) {
      resolvedFloorLevelId = (floorDetail.floorId ?? floorDetail.FloorId) ? Number(floorDetail.floorId ?? floorDetail.FloorId) : null;
    }
  }

  if (resolvedFloorLevelId && !floorDetailsId) {
    const floorDetail = parentFloors.find((f: any) => Number(f.floorId ?? f.FloorId) === Number(resolvedFloorLevelId));
    if (floorDetail) {
      floorDetailsId = Number(floorDetail.id ?? floorDetail.Id);
    }
  }

  let conYear = u.conYear || "";
  let conType = u.conType || "";
  let useType = u.useType || "";
  let subUseType = u.subUseType || "";

  if (floorDetailsId) {
    const floorDetail = parentFloors.find((f: any) => Number(f.id ?? f.Id) === Number(floorDetailsId));
    if (floorDetail) {
      if (!conYear) conYear = floorDetail.constructionYear || floorDetail.conYear || "";
      if (!conType) conType = floorDetail.constructionTypeId ? String(floorDetail.constructionTypeId) : (floorDetail.conType ? String(floorDetail.conType) : "");
      if (!useType) useType = floorDetail.typeOfUseId ? String(floorDetail.typeOfUseId) : (floorDetail.useType ? String(floorDetail.useType) : "");
      if (!subUseType) subUseType = floorDetail.subTypeOfUseId ? String(floorDetail.subTypeOfUseId) : (floorDetail.subUseType ? String(floorDetail.subUseType) : "");
    }
  }

  return { floorDetailsId, resolvedFloorLevelId, subFloorId, conYear, conType, useType, subUseType };
}

/** Derives the display unit type from AssetName/unit-number code segments. */
export function resolveStandaloneUnitType(u: any): string {
  let unitType = "";
  const numUpper = String(u.unitType || u.unitNo || u.shopUnitName || u.assetNo || u.assetCode || u.assetTypeName || u.assetName || u.name || "").toUpperCase();
  if (numUpper.includes("FLAT")) unitType = "Flat";
  else if (numUpper.includes("SHOP")) unitType = "Shop";
  else if (numUpper.includes("OFFICE")) unitType = "Office";
  else if (numUpper.includes("ROOM")) unitType = "Room";
  else if (numUpper.includes("DEPARTMENT") || numUpper.includes("DEPT")) unitType = "Department";

  if (!unitType) {
    unitType = (u.unitType || "").trim();
  }
  if (!unitType && u.shopUnitName) {
    unitType = (u.shopUnitName as string).split(" ")[0] || "Flat";
  }
  if (!unitType) unitType = "Flat";
  return unitType;
}
