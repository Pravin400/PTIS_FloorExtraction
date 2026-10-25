import { useMemo, useState } from 'react';
import type { AssetCategory, AssetType, DashboardStatsResponse } from '@/types/asset/municipal-Asset/municipal-asset.types';


// ─── Pure Derivation Functions ────────────────────────────────────────────────
// Extracted from the hook so they can be unit-tested independently
// and so useMemo can receive them as stable references.

/**
 * Derives the list of active categories to display on the dashboard.
 * Builds minimal category objects strictly from the `categoryStats` data.
 */
export function deriveCategories(
  masterCategories: AssetCategory[] = [],
  initialStats: DashboardStatsResponse | null
): AssetCategory[] {
  if (!masterCategories.length) return [];

  // Map master categories and attach any description if the API returned it in stats (as fallback)
  return masterCategories.map((masterCat) => {
    const statMatch = initialStats?.categoryStats?.find(s => s.categoryId === masterCat.id);
    
    return {
      id: masterCat.id,
      categoryName: masterCat.categoryName,
      categoryCode: masterCat.categoryCode || `CAT-${masterCat.id}`,
      categoryDescription: (masterCat.description as string | undefined) || statMatch?.categoryDescription,
      isActive: true as const,
      isMovable: masterCat.isMovable,
      hasFloorDetails: masterCat.hasFloorDetails,
      hasInventory: masterCat.hasInventory,
      isInventoryMandatory: masterCat.isInventoryMandatory,
      hasLegalCompliance: masterCat.hasLegalCompliance,
      valuationType: masterCat.valuationType,
    };
  });
}

/**
 * Builds a map of `categoryId → AssetType[]` from the active master types.
 */
export function deriveTypesByCategory(
  masterTypes: AssetType[] = []
): Record<number, AssetType[]> {
  const typesMap: Record<number, AssetType[]> = {};

  masterTypes.forEach((typeRaw) => {
    const type = typeRaw as AssetType & Record<string, unknown>;
    const rawCatId = type.categoryId ?? type.assetCategoryId ?? type.CategoryId ?? type.AssetCategoryId ?? type.category_id ?? type.group;
    const catId = Number(rawCatId ?? 0);
    const isActive = type.isActive ?? type.IsActive ?? type.status;

    const isExplicitlyInactive =
      isActive === false || isActive === 0 || String(isActive).toLowerCase() === 'false' || String(isActive).toLowerCase() === 'inactive';

    if (catId > 0 && !isExplicitlyInactive) {
      if (!typesMap[catId]) typesMap[catId] = [];

      const typeId = Number(type.id ?? type.Id ?? 0);
      const tName = String(
        type.typeName ?? type.assetTypeName ?? type.name ?? type.TypeName ?? type.AssetTypeName ?? type.Name ?? 'Unknown'
      );

      typesMap[catId].push({
        id: typeId,
        assetTypeName: tName,
        typeName: tName,
        assetCategoryId: catId,
        categoryId: catId,
        isActive: true,
      });
    }
  });

  return typesMap;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages state and derived data for the Municipal Asset Dashboard.
 *
 * Uses `useMemo` (not `useState`) for derived values so they recompute
 * correctly if the SSR props ever change.
 */
export function useMunicipalAssetDashboard(
  initialStats: DashboardStatsResponse | null,
  masterCategories: AssetCategory[] = [],
  masterTypes: AssetType[] = []
) {
  const categories = useMemo(
    () => deriveCategories(masterCategories, initialStats),
    [masterCategories, initialStats]
  );

  const typesByCategory = useMemo(
    () => deriveTypesByCategory(masterTypes),
    [masterTypes]
  );

  // Initialise visible-chip-count for each category to 5 (collapsed state).
  const [visibleExamples, setVisibleExamples] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    categories.forEach((c) => {
      initial[c.id.toString()] = 5;
    });
    return initial;
  });

  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);

  return {
    categories,
    typesByCategory,
    visibleExamples,
    setVisibleExamples,
    dashboardStats: initialStats,
    selectedAssetType,
    setSelectedAssetType,
  };
}
