 
import type { FloorSummary, FloorSummaryInputItem } from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { FloorSummaryInputItem };

/**
 * Calculates aggregate floor summary (total floors, units, carpet, builtup, and capital value).
 */
export function calcFloorSummary(
  floors: FloorSummaryInputItem[],
  contextCapitalValue: string | number | undefined
): FloorSummary {
  let totalUnits = 0;
  let totalCarpetSqm = 0;
  let totalBuiltupSqm = 0;
  const floorNames = new Set<string>();

  floors.forEach((unit: FloorSummaryInputItem) => {
    const roomsCount =
      unit.noOfRooms != null
        ? Number(unit.noOfRooms)
        : Array.isArray(unit.rooms)
        ? unit.rooms.length
        : 0;
    totalUnits += roomsCount;
    const floorLabel =
      unit.floor || unit.floorName || unit.FloorName || (unit.floorId != null ? String(unit.floorId) : "") || unit.subFloor || "";
    if (floorLabel) floorNames.add(floorLabel);

    const item = unit as Record<string, unknown>;
    const carpetMetric = Number(item.carpetAreaSqMeter || item.carpetAreaSqm || item.carpetAreaSqMtr || 0);
    const carpetSqFt = Number(unit.carpetAreaSqFeet || unit.carpetAreaSqFt || 0);
    totalCarpetSqm += carpetMetric > 0 ? carpetMetric : carpetSqFt / 10.7639;

    const builtUpMetric = Number(item.builtUpAreaSqMeter || item.builtUpAreaSqm || item.builtUpAreaSqMtr || 0);
    const builtUpSqFt = Number(unit.builtUpAreaSqFeet || unit.builtUpAreaSqFt || 0);
    totalBuiltupSqm += builtUpMetric > 0 ? builtUpMetric : builtUpSqFt / 10.7639;
  });

  const totalFloors = floorNames.size;

  let capitalValue = 0;
  if (contextCapitalValue != null && contextCapitalValue !== "") {
    capitalValue = parseFloat(String(contextCapitalValue)) || 0;
  } else {
    floors.forEach((unit: FloorSummaryInputItem) => {
      const cv = parseFloat(String(unit.capitalValue ?? unit.CapitalValue ?? "0"));
      if (!isNaN(cv)) capitalValue += cv;
    });
  }

  return { totalFloors, totalUnits, totalCarpetSqm, totalBuiltupSqm, capitalValue };
}
