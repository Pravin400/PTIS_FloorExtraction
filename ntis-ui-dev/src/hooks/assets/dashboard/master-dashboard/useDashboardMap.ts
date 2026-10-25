import { useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { DashboardMapAssetType, DashboardMapComponentProps } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';
import type { AssetDashboardTypeByCategory, AssetDashboardAssetByType } from '@/types/assets/dashboard/master-dashboard/asset-dashboard-api.types';
import { normKey, toTitleCase } from '@/lib/utils/asset-utils/asset-dashboard-helpers';
import { Building2, Factory, Landmark, Truck, type LucideIcon } from 'lucide-react';

export interface CategoryStyle {
  id: string;
  title: string;
  Icon: LucideIcon;
  icon: string;
  pill: string;
  border: string;
  titleColor: string;
}

export interface DashboardMapSection extends CategoryStyle {
  categoryId: number;
  count: number;
  totalValue: number;
  items: { name: string; count: number; typeId: number; totalValue: number }[];
  loading: boolean;
}

export interface UseDashboardMapReturn {
  sections: DashboardMapSection[];
  selectedSubcategory: { type: string; name: string } | null;
  subcategoryAssets: (DashboardMapAssetType | AssetDashboardAssetByType)[];
  isLoadingSubcategoryAssets: boolean;
  clearFilters: () => void;
  handleBackClick: () => void;
  displayedAsset: DashboardMapAssetType | null;
  showBack: boolean;
  handleCategoryClick: (categoryId: number) => void;
  handleSubcategoryClick: (type: string, name: string, typeId: number) => void;
  filteredAssets: DashboardMapAssetType[];
}

const FALLBACK_STYLES = [
  { Icon: Landmark, icon: 'text-teal-500', pill: 'bg-teal-50', border: 'border-teal-500', titleColor: 'text-teal-600' },
  { Icon: Building2, icon: 'text-blue-500', pill: 'bg-blue-50', border: 'border-blue-500', titleColor: 'text-blue-600' },
  { Icon: Factory, icon: 'text-purple-500', pill: 'bg-purple-50', border: 'border-purple-500', titleColor: 'text-purple-600' },
  { Icon: Truck, icon: 'text-orange-500', pill: 'bg-orange-50', border: 'border-orange-500', titleColor: 'text-orange-600' },
  { Icon: Building2, icon: 'text-pink-500', pill: 'bg-pink-50', border: 'border-pink-500', titleColor: 'text-pink-600' },
  { Icon: Building2, icon: 'text-emerald-500', pill: 'bg-emerald-50', border: 'border-emerald-500', titleColor: 'text-emerald-600' },
];

const CATEGORY_STYLE_INDEX: Record<string, number> = { land: 0, building: 1, infrastructure: 2, movable: 3 };

export const getCategoryStyles = (id: string, idx: number): CategoryStyle => {
  const norm = normKey(id);
  const titles: Record<string, string> = { land: 'Land', building: 'Buildings', infrastructure: 'Infrastructure', movable: 'Movable' };
  return { id, title: titles[norm] || toTitleCase(id), ...FALLBACK_STYLES[CATEGORY_STYLE_INDEX[norm] ?? idx % FALLBACK_STYLES.length] };
};

export const tCat = (t: (k: string) => string, key: string, fallback: string): string => key ? t(key) : fallback;

export function useDashboardMap({
  categories, assets, selectedAsset, activeFilters, fetchedTypes, fetchedAssets,
}: DashboardMapComponentProps): UseDashboardMapReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const typeIdStr = searchParams.get('typeId');
  const typeName = searchParams.get('typeName');
  const typeCategory = searchParams.get('typeCategory');

  const selectedTypeId = typeIdStr ? Number(typeIdStr) : null;
  const selectedSubcategory = useMemo(() => {
    return typeCategory && typeName ? { type: typeCategory, name: typeName } : null;
  }, [typeCategory, typeName]);

  /** Group API types by category ID — this is the ONLY source of subcategory data */
  const apiTypesByCat = useMemo(() => {
    const map: Record<number, { types: AssetDashboardTypeByCategory[]; loading: boolean }> = {};
    (fetchedTypes ?? []).forEach(tp => {
      const catId = Number(tp.categoryId ?? 0);
      if (!map[catId]) map[catId] = { types: [], loading: false };
      map[catId].types.push(tp);
    });
    return map;
  }, [fetchedTypes]);

  /** Group API assets by type ID — used for drilldown */
  const apiAssetsByType = useMemo(() => {
    const map: Record<number, { assets: AssetDashboardAssetByType[]; loading: boolean }> = {};
    (fetchedAssets ?? []).forEach(({ __typeId, ...assetData }) => {
      if (__typeId) {
        if (!map[__typeId]) map[__typeId] = { assets: [], loading: false };
        map[__typeId].assets.push({ __typeId, ...assetData });
      }
    });
    return map;
  }, [fetchedAssets]);

  /** Build category sections from API types-by-category data */
  const sections = useMemo(() => {
    return categories
      .filter(c => c.isActive !== false)
      .map(({ id, count, value, categoryId }, idx) => {
      const style = getCategoryStyles(id, idx);
      const catId = Number(categoryId ?? 0);
      const apiEntry = apiTypesByCat[catId];
      
      let items: { name: string; count: number; typeId: number; totalValue: number }[] = [];
      if (apiEntry) {
        items = apiEntry.types
          .filter(t => t.isActive !== false)
          .map(({ assetType, count, id: typeId, totalValue }) => ({ 
            name: assetType, 
            count, 
            typeId, 
            totalValue 
          }));
      }

      return {
        ...style,
        categoryId: catId,
        count,
        totalValue: value ?? 0,
        items,
        loading: apiEntry?.loading ?? false,
      };
    });
  }, [categories, apiTypesByCat]);

  /** Category click: update URL → RSC re-fetches with cats param → page re-renders */
  const handleCategoryClick = useCallback((categoryId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentCats = params.get('cats') ? params.get('cats')!.split(',').filter(Boolean) : [];
    const catIdStr = String(categoryId);
    // Multi-select: toggle the category
    let newCats = [...currentCats];
    if (newCats.includes(catIdStr)) {
      newCats = newCats.filter(id => id !== catIdStr);
    } else {
      newCats.push(catIdStr);
    }
    if (newCats.length > 0) params.set('cats', newCats.join(','));
    else params.delete('cats');
    params.delete('typeId');
    params.delete('typeName');
    params.delete('typeCategory');
    params.delete('types');
    params.delete('asset');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  /** Subcategory click: update URL with typeId → RSC re-fetches assets-by-type */
  const handleSubcategoryClick = useCallback((type: string, name: string, typeId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentTypes = params.get('types') ? params.get('types')!.split(',').filter(Boolean) : [];
    params.set('typeId', String(typeId));
    params.set('typeName', name);
    params.set('typeCategory', type);
    if (!currentTypes.includes(String(typeId))) {
      params.set('types', [...currentTypes, String(typeId)].join(','));
    }
    params.delete('asset');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const filteredAssets = useMemo(() => activeFilters.length ? assets.filter(a => activeFilters.includes(normKey(a.category))) : assets, [assets, activeFilters]);

  /** Subcategory assets come from API assets-by-type data */
  const subcategoryAssets = useMemo<(DashboardMapAssetType | AssetDashboardAssetByType)[]>(() => {
    if (!selectedSubcategory) return [];
    if (selectedTypeId && apiAssetsByType[selectedTypeId]) {
      return apiAssetsByType[selectedTypeId].loading ? [] : apiAssetsByType[selectedTypeId].assets;
    }
    return [];
  }, [selectedSubcategory, selectedTypeId, apiAssetsByType]);

  const isLoadingSubcategoryAssets = useMemo(() => {
    if (!selectedSubcategory) return false;
    if (selectedTypeId && apiAssetsByType[selectedTypeId]) {
      return apiAssetsByType[selectedTypeId].loading;
    }
    return false;
  }, [selectedSubcategory, selectedTypeId, apiAssetsByType]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('cats');
    params.delete('types');
    params.delete('typeId');
    params.delete('typeName');
    params.delete('typeCategory');
    params.delete('asset');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const handleBackClick = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedAsset) {
      params.delete('asset');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    } else if (params.has('types') || params.has('typeId')) {
      params.delete('types');
      params.delete('typeId');
      params.delete('typeName');
      params.delete('typeCategory');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    } else if (params.has('cats')) {
      params.delete('cats');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [selectedAsset, searchParams, pathname, router]);

  const displayedAsset = selectedAsset ?? null;
  const showBack = activeFilters.length > 0 || !!displayedAsset || !!selectedSubcategory;

  return {
    sections, selectedSubcategory, subcategoryAssets, isLoadingSubcategoryAssets,
    clearFilters, handleBackClick, displayedAsset, showBack,
    handleCategoryClick, handleSubcategoryClick, filteredAssets,
  };
}
