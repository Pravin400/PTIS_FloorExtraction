import { useState, useCallback, useEffect, useRef } from "react";
import { fetchAssetsByFilter } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/lookups/action";
import type { ExistingAssetEntry, RawExistingAssetItem } from "@/types/asset/municipal-Asset/new-add-new-asset";

export function useAddAssetDrawerExistingSearch() {
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetResults, setAssetResults] = useState<ExistingAssetEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedAsset, setSelectedAsset] = useState<ExistingAssetEntry | null>(null);
  const [isAssetLoading, setIsAssetLoading] = useState(false);

  const canSearch = !!(selectedZoneId && selectedWardId);

  // Debounced search-as-you-type: the trigger is the search input's onChange
  // (via handleAssetSearchChange below) rather than a useEffect watching
  // assetSearch — a ref-held timer gives the same 350ms debounce latency
  // without an effect firing an API call on every render.
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performAssetSearch = useCallback(async (zoneId: number, wardId: number, search: string) => {
    setIsAssetLoading(true);
    try {
      const res = await fetchAssetsByFilter({
        zoneId,
        wardId,
        search: search.trim(),
        pageSize: 50,
      });
      if (res.success && res.data) {
        const term = search.trim().toLowerCase();
        const rawItems = res.data as RawExistingAssetItem[];
        const filtered = rawItems.filter((a) => {
          const code = (a.assetNo || a.assetCode || "").toLowerCase();
          const name = (a.assetName || "").toLowerCase();
          return code.includes(term) || name.includes(term);
        });

        const mapped: ExistingAssetEntry[] = filtered.map((a) => ({
          id: a.id,
          assetNo: a.assetNo || a.assetCode || "",
          assetName: a.assetName || "",
          categoryName: a.assetCategoryName || "",
          typeName: a.assetTypeName || "",
          address: a.address || "",
          zoneName: a.zoneName || null,
          wardName: a.wardName || null,
          assetCategoryId: a.assetCategoryId ?? null,
          assetTypeId: a.assetTypeId ?? null,
        }));

        setAssetResults(mapped);
        setTotalCount(mapped.length);
      } else {
        setAssetResults([]);
        setTotalCount(0);
      }
    } finally {
      setIsAssetLoading(false);
    }
  }, []);

  const handleAssetSearchChange = useCallback((value: string) => {
    setAssetSearch(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    if (!selectedZoneId || !selectedWardId || !value.trim()) {
      setAssetResults([]);
      setTotalCount(0);
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      performAssetSearch(selectedZoneId, selectedWardId, value);
    }, 350);
  }, [selectedZoneId, selectedWardId, performAssetSearch]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const resetExisting = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setSelectedZoneId(null);
    setSelectedWardId(null);
    setAssetSearch("");
    setAssetResults([]);
    setTotalCount(0);
    setSelectedAsset(null);
  }, []);

  return {
    selectedZoneId, setSelectedZoneId,
    selectedWardId, setSelectedWardId,
    assetSearch, setAssetSearch,
    assetResults, setAssetResults,
    totalCount, setTotalCount,
    selectedAsset, setSelectedAsset,
    isAssetLoading, setIsAssetLoading,
    canSearch,
    handleAssetSearchChange,
    resetExisting,
  };
}
