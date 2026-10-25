/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { InventoryRow, InventoryType } from "@/types/asset/furniture-fixture.types";
import { inventoryMeta } from "@/lib/utils/asset-utils/new-add-new-asset/furniture-fixture/FurnitureFixtureConstants";
import { buildCategoryGroups } from "@/lib/utils/asset-utils/new-add-new-asset/furniture-fixture/FurnitureFixtureCV";

export function useFurnitureFixtureSummary(rows: InventoryRow[], enrichedRows: InventoryRow[], categories: any[]) {
  const categoryGroups = useMemo(() => buildCategoryGroups(enrichedRows), [enrichedRows]);

  const grandAssetValue = useMemo(() => rows.reduce((sum, row) => sum + row.total, 0), [rows]);
  const grandCV = useMemo(() => enrichedRows.reduce((sum, r) => sum + (r.totalCV ?? r.total), 0), [enrichedRows]);

  const summaryCards = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((cat) => {
        // Normalize cat.typeName to match row.category format (lowercase with dashes)
        const cleanName = cat.typeName.replace(/^[A-Z]\)\s*/i, "");
        const normalizedCatType = cleanName.toLowerCase().replace(/\s+/g, "-");
        const typeRows = rows.filter((r) => r.category === normalizedCatType);
        return {
          type: cat.typeName,
          label: cleanName,
          totalAmount: typeRows.reduce((sum, r) => sum + r.total, 0),
          totalItems: typeRows.reduce((sum, r) => sum + r.quantity, 0),
          cardRing: inventoryMeta[normalizedCatType as InventoryType]?.cardRing || "border-l-4 border-l-blue-500",
        };
      });
    }
    return (["furniture", "it-equipment", "electronic-fixtures", "vehicle"] as const).map((type) => {
      const typeRows = rows.filter((r) => r.category === type);
      return {
        type,
        label: inventoryMeta[type]?.label || type,
        totalAmount: typeRows.reduce((sum, r) => sum + r.total, 0),
        totalItems: typeRows.reduce((sum, r) => sum + r.quantity, 0),
        cardRing: inventoryMeta[type]?.cardRing || "border-l-4 border-l-gray-500",
      };
    });
  }, [rows, categories]);

  return { categoryGroups, grandAssetValue, grandCV, summaryCards };
}
