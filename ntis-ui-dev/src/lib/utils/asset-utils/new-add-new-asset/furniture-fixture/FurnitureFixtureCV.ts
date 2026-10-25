 
import type { InventoryCategoryGroup, InventoryRow, InventoryType } from "@/types/asset/furniture-fixture.types";


export const COND_FACTORS: Record<string, number> = {
  "New": 1.00,
  "Excellent": 1.00,
  "Good": 0.85,
  "Fair": 0.65,
  "Poor": 0.40,
  "Working": 0.90,
  "Not Working": 0.10,
};

export const TYPE_LABELS: Record<string, string> = {
  "furniture": "Furniture",
  "it-equipment": "IT Equipment",
  "electronic-fixtures": "Electronic Fixtures",
  "electronics": "Electronic Fixtures",
  "vehicle": "Vehicle",
};

export function calcRowCV(row: InventoryRow, dynamicRates: Record<string, number>, dynamicConditions: Record<string, number>) {
  const typeName = TYPE_LABELS[row.category as InventoryType] || row.category;
  const depRate = dynamicRates[typeName] ?? 0.10;
  const condKey = `${typeName.toLowerCase()}_${row.condition.toLowerCase()}`;
  const condFactor = dynamicConditions[condKey] ?? dynamicConditions[row.condition.toLowerCase()] ?? dynamicConditions[row.condition] ?? COND_FACTORS[row.condition] ?? 0.75;
  const purchYear = row.purchaseDate ? new Date(row.purchaseDate).getFullYear() : new Date().getFullYear();
  const ageInYears = Math.max(0, new Date().getFullYear() - purchYear);
  const depFactor = Math.max(0.10, 1 - depRate * ageInYears);
  const unitCV = Math.round(row.unitValue * depFactor * condFactor * 100) / 100;
  const totalCV = Math.round(unitCV * row.quantity * 100) / 100;
  return {
    unitCV, totalCV, depreciationRate: depRate,
    conditionFactor: condFactor, ageInYears,
    cvFormula: `CV = ₹${row.unitValue.toLocaleString('en-IN')} × (1−${(depRate * 100).toFixed(0)}%×${ageInYears}yr) × ${condFactor.toFixed(2)} = ₹${unitCV.toLocaleString('en-IN')}`
  };
}

export function enrichRows(rows: InventoryRow[], dynamicRates: Record<string, number>, dynamicConditions: Record<string, number>): InventoryRow[] {
  return rows.map(r => ({ ...r, ...calcRowCV(r, dynamicRates, dynamicConditions) }));
}

export function buildCategoryGroups(rows: InventoryRow[]): InventoryCategoryGroup[] {
  // Dynamically group by row.category (handles both "furniture" and "Furniture" formats)
  const typeSet = new Set(rows.map(r => r.category));
  const types = Array.from(typeSet);

  return types
    .map(type => {
      const typeRows = rows.filter(r => r.category === type);
      if (!typeRows.length) return null;
      const totalPV = typeRows.reduce((s, r) => s + r.total, 0);
      const totalCV = typeRows.reduce((s, r) => s + (r.totalCV ?? r.total), 0);
      // Try to get label from TYPE_LABELS, otherwise use the type itself
      const label = TYPE_LABELS[type as InventoryType] || type;
      return {
        inventorycategory: type,
        label: label,
        totalBatches: typeRows.length,
        totalUnits: typeRows.reduce((s, r) => s + r.quantity, 0),
        totalPurchaseValue: totalPV,
        totalCapitalValue: totalCV,
        totalDepreciation: totalPV - totalCV,
        depreciationPercent: totalPV > 0 ? Math.round((totalPV - totalCV) / totalPV * 1000) / 10 : 0,
        batches: typeRows,
      } as InventoryCategoryGroup;
    })
    .filter(Boolean) as InventoryCategoryGroup[];
}
