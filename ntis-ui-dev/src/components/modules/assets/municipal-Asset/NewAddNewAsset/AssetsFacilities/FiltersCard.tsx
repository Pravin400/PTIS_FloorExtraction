'use client';

import { useTranslations } from "next-intl";
import type { ApiCategory, ApiCondition } from "@/types/asset/municipal-Asset/new-add-new-asset";


import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

/** Shape from InventoryItemCategory API */


/** Shape from AssetConditionMaster API */


import { useSearchParams } from 'next/navigation';

export function FiltersCard({

  filters,
  setFilters,
  apiCategories = [],
  apiConditions = [],
  assetCategoryId,
}: {
  filters: {
    category?: string;
    condition?: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    category: string;
    condition: string;
  }>>;
  apiCategories?: ApiCategory[];
  apiConditions?: ApiCondition[];
  assetCategoryId?: number;
}) {
  const t = useTranslations("newAddNewAsset");
  const searchParams = useSearchParams();
  const resolvedAssetCategoryId = assetCategoryId || (searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined);



  // Derive unique category names (typeName) from the API data filtered by Asset Category
  const categoryOptions = useMemo(() => {
    if (!apiCategories.length) return [];
    const matched = resolvedAssetCategoryId && resolvedAssetCategoryId > 0
      ? apiCategories.filter(c => {
        const cAssetCatId = c.assetCategoryId ?? c.AssetCategoryId;
        return cAssetCatId !== undefined && cAssetCatId !== null
          ? Number(cAssetCatId) === Number(resolvedAssetCategoryId)
          : true;
      })
      : apiCategories;
    const list = matched.length > 0 ? matched : apiCategories;
    return list.map((c) => ({
      id: c.id,
      label: c.typeName,
    }));
  }, [apiCategories, resolvedAssetCategoryId]);

  // Derive condition names from the API data, filtered by selected category if any, and deduplicated
  const conditionOptions = useMemo(() => {
    if (!apiConditions.length) return [];

    let filteredConditions = apiConditions;
    if (filters.category) {
      const selectedCat = categoryOptions.find(c => c.label === filters.category);
      if (selectedCat) {
        filteredConditions = apiConditions.filter((c: ApiCondition & Record<string, unknown>) => {
          const catId = c.inventoryItemCategoryId ?? c.categoryId ?? c.CategoryId ?? c.InventoryItemCategoryId;
          return catId !== undefined && catId !== null ? Number(catId) === Number(selectedCat.id) : true;
        });
      }
    }

    // Deduplicate so identical condition names (e.g. Good, Fair, Poor) never repeat
    const seen = new Set<string>();
    const uniqueOptions: { id: number | string; label: string }[] = [];

    for (const c of filteredConditions) {
      const name = (c.conditionName || "").trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        uniqueOptions.push({
          id: c.id,
          label: name,
        });
      }
    }

    return uniqueOptions;
  }, [apiConditions, filters.category, categoryOptions]);

  const handleChange = (field: 'category' | 'condition') => (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (field === 'category') {
      setFilters((prev) => ({ ...prev, category: e.target.value, condition: '' }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: e.target.value }));
    }
  };

  const handleReset = () => {
    setFilters({ category: '', condition: '' });
  };

  return (
    <div className="flex items-center gap-3 ml-4">
      {/* Category (from typeName in API) */}
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-bold text-[#1c2aab] whitespace-nowrap">{t("category") || "Category"}:</label>
        <div className="relative w-[160px]">
          <select
            value={filters.category || ''}
            onChange={handleChange('category')}
            className="w-full h-8 pl-3 pr-7 text-[12px] font-semibold text-[#1c2aab] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 appearance-none cursor-pointer transition-colors shadow-sm"
          >
            <option value="">{t("allCategories") || "All Categories"}</option>
            {categoryOptions.map((opt) => (
              <option key={opt.id} value={opt.label} className="text-[#1c2aab]">{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" strokeWidth={2.5} />
        </div>
      </div>

      {/* Condition (from AssetConditionMaster API) */}
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-bold text-[#1c2aab] whitespace-nowrap">{t("condition") || "Condition"}:</label>
        <div className="relative w-[160px]">
          <select
            value={filters.condition || ''}
            onChange={handleChange('condition')}
            className="w-full h-8 pl-3 pr-7 text-[12px] font-semibold text-[#1c2aab] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 appearance-none cursor-pointer transition-colors shadow-sm"
          >
            <option value="">{t("allConditions") || "All Conditions"}</option>
            {conditionOptions.map((opt) => (
              <option key={opt.id} value={opt.label} className="text-[#1c2aab]">{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" strokeWidth={2.5} />
        </div>
      </div>

      {(filters.category || filters.condition) && (
        <div className="flex items-center gap-2 ml-2">
          <button className="px-3 h-8 bg-white border border-red-200 text-red-500 rounded-lg text-[11px] font-bold hover:bg-red-50 transition-colors" onClick={handleReset}>{t("clear") || "Clear"}</button>
        </div>
      )}
    </div>
  );
}
