import { useCallback, useMemo, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { DashboardDataPayload, DashboardMapAssetType, MunicipalAsset } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';

export interface UseAssetMasterDashboardReturn {
  data: DashboardDataPayload;
  loading: boolean;
  zone: string;
  ward: string;
  activeZone: string;
  activeWard: string;
  zonesList: string[];
  wardsList: string[];
  visibleAssets: MunicipalAsset[];
  encroached: MunicipalAsset[];
  selectedAsset: DashboardMapAssetType | null;
  setSelectedAsset: (asset: DashboardMapAssetType | null) => void;
  catFilters: string[];
  setCatFilters: (names: string[]) => void;
  showEncroachment: boolean;
  setShowEncroachment: (show: boolean) => void;
  handleZoneChange: (z: string) => void;
  handleWardChange: (w: string) => void;
  handleStatsCategoryClick: (cat: string | null) => void;
}

export function useAssetMasterDashboard(initialData: DashboardDataPayload): UseAssetMasterDashboardReturn {
  const data = initialData;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const zone = searchParams.get('zone') || 'all';
  const ward = searchParams.get('ward') || 'all';
  const encroach = searchParams.get('encroach') === 'true';
  const assetIdStr = searchParams.get('asset') || null;
  const catsStr = searchParams.get('cats') || '';

  const visibleAssets = useMemo(() => data.filteredAssets || [], [data.filteredAssets]);

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      if ('zone' in updates || 'ward' in updates || 'encroach' in updates || 'cats' in updates) {
        params.delete('types');
        params.delete('typeId');
        params.delete('typeName');
        params.delete('typeCategory');
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, pathname, router]);

  const catFilters = useMemo(() => {
    const catIds = catsStr.split(',').map(Number).filter(Boolean);
    return catIds.map(id => {
      const cat = data.categories.find(c => c.categoryId === id);
      return cat ? cat.name?.trim().toLowerCase() : '';
    }).filter(Boolean) as string[];
  }, [catsStr, data.categories]);

  const selectedAsset = useMemo(() => {
    if (!assetIdStr) return null;
    
    if (data.fetchedAssets) {
      const fromType = data.fetchedAssets.find((a) => String(a.id) === assetIdStr);
      if (fromType) {
        const mappedAsset: DashboardMapAssetType = {
          id: String(fromType.id),
          name: fromType.name || '',
          category: (searchParams.get('typeCategory') || catFilters[0] || 'asset') as 'building' | 'land' | 'infrastructure' | 'movable',
          subCategory: searchParams.get('typeName') || '',
          zone: fromType.zone || fromType.zoneName || '',
          ward: fromType.ward || fromType.wardName || '',
          location: fromType.location || `${fromType.ward || fromType.wardName || ''} ${fromType.zone || fromType.zoneName || ''}`.trim() || 'Municipal Area',
          valueLakhs: (fromType.capitalValue ?? fromType.marketValue ?? 0) / 1e5,
          status: fromType.status || 'Active',
          coordinates: { lat: Number(fromType.latitude || 0), lng: Number(fromType.longitude || 0) },
          encroachment: { hasEncroachment: false }
        };
        return mappedAsset;
      }
    }

    const found = visibleAssets.find(a => String(a.id) === assetIdStr);
    return (found as DashboardMapAssetType) || null;
  }, [assetIdStr, visibleAssets, data.fetchedAssets, searchParams, catFilters]);

  const handleZoneChange = useCallback((z: string) => {
    if (z === zone) return;
    updateUrl({ zone: z === 'all' ? null : z, ward: null, cats: null, asset: null, encroach: null });
  }, [updateUrl, zone]);

  const handleWardChange = useCallback((w: string) => {
    if (w === ward) return;
    updateUrl({ ward: w === 'all' ? null : w, cats: null, asset: null, encroach: null });
  }, [updateUrl, ward]);

  const setCatFilters = useCallback((names: string[]) => {
    const ids = names.map(n => data.categories.find(c => c.name?.trim().toLowerCase() === n.trim().toLowerCase())?.categoryId).filter(Boolean);
    updateUrl({ cats: ids.length > 0 ? ids.join(',') : null, asset: null });
  }, [data.categories, updateUrl]);

  const setSelectedAsset = useCallback((asset: DashboardMapAssetType | null) => {
    updateUrl({ asset: asset?.id ? String(asset.id) : null });
  }, [updateUrl]);

  const setShowEncroachment = useCallback((show: boolean) => {
    updateUrl({ encroach: show ? 'true' : null });
  }, [updateUrl]);

  const handleStatsCategoryClick = useCallback((cat: string | null) => {
    if (!cat) {
      updateUrl({ cats: null, asset: null });
    } else if (cat === 'Active Encroachments') {
      updateUrl({ encroach: 'true' });
    } else {
      const catObj = data.categories.find(c => String(c.categoryId) === cat || c.name?.trim().toLowerCase() === cat.trim().toLowerCase());
      if (catObj && catObj.categoryId) {
        updateUrl({ cats: String(catObj.categoryId), asset: null });
      }
    }
  }, [data.categories, updateUrl]);

  const zonesList = useMemo(() => ['all', ...(data.allZones || [])].filter(Boolean), [data.allZones]);
  const wardsList = useMemo(() => {
    const master = (data.allWards || [])
      .filter((w) => zone === 'all' || w.zoneNo === zone)
      .map((w) => w.wardNo);
    return ['all', ...new Set(master)].filter(Boolean);
  }, [data.allWards, zone]);

  const encroached = useMemo(() => visibleAssets.filter((a) => {
    const enc = a.encroachment as { hasEncroachment?: boolean } | undefined;
    return enc?.hasEncroachment === true;
  }), [visibleAssets]);

  const activeZone = zone !== 'all' && zonesList.includes(zone) ? zone : 'all';
  const activeWard = ward !== 'all' && wardsList.includes(ward) ? ward : 'all';

  return {
    data, loading: isPending, zone, ward, activeZone, activeWard,
    zonesList, wardsList, visibleAssets, encroached,
    selectedAsset, setSelectedAsset, catFilters, setCatFilters,
    showEncroachment: encroach, setShowEncroachment,
    handleZoneChange, handleWardChange, handleStatsCategoryClick
  };
}
