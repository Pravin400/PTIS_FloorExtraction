import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useLocaleRouter } from "@/hooks/asset/municipal-Asset/useLocaleRouter";
import { useAddAssetDrawerExistingSearch } from "./useAddAssetDrawerExistingSearch";
import { submitAssetForm } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/submit/action";
import { fetchTypesByCategoryAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/lookups/action";
import { isEntityActive } from "@/lib/utils/asset-utils/new-add-new-asset/active-filter.utils";
import type {
  ExistingAssetEntry,
  DrawerMode,
  AddAssetDrawerCategory,
  AddAssetDrawerType,
} from "@/types/asset/municipal-Asset/new-add-new-asset/add-new-asset.types";
import { INITIAL_BUILDING_BASIC_INFO } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";

export type { ExistingAssetEntry, DrawerMode };

const getRecordCategoryId = (t: AddAssetDrawerType): number => {
  const rec = t as Record<string, unknown>;
  const val = rec.categoryId ?? rec.assetCategoryId ?? rec.CategoryId ?? rec.AssetCategoryId ?? rec.category_id;
  return Number(val ?? 0);
};

export function useAddAssetDrawer(
  open: boolean,
  initialCategories: AddAssetDrawerCategory[],
  initialTypes: AddAssetDrawerType[],
  _onClose?: () => void
) {
  const { push } = useLocaleRouter();

  const [mode, setMode] = useState<DrawerMode>("new");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(
    () => (initialCategories || []).filter(isEntityActive),
    [initialCategories]
  );

  const [newData, setNewData] = useState({
    category: "",
    assetType: "",
    categoryId: null as number | null,
    typeId: null as number | null,
  });

  const typesCacheRef = useRef<Record<number, AddAssetDrawerType[]>>({});

  const [types, setTypes] = useState<AddAssetDrawerType[]>(() => {
    return initialTypes && initialTypes.length > 0
      ? initialTypes.filter(isEntityActive)
      : [];
  });

  const updateCategoryContext = async (categoryId: number | null) => {
    if (!categoryId) {
      setTypes([]);
      return;
    }

    // 1. Check in-memory cache first to avoid redundant API calls
    if (typesCacheRef.current[categoryId]) {
      setTypes(typesCacheRef.current[categoryId]);
      return;
    }

    // 2. Filter directly from server-rendered initialTypes if available (instant 0ms, zero network)
    if (initialTypes && initialTypes.length > 0) {
      const matched = initialTypes.filter(
        (t) => getRecordCategoryId(t) === Number(categoryId) && isEntityActive(t)
      );
      if (matched.length > 0) {
        typesCacheRef.current[categoryId] = matched;
        setTypes(matched);
        return;
      }
    }

    // 3. Fallback to server action if not found in initialTypes
    const res = await fetchTypesByCategoryAction(categoryId);
    if (res.success && Array.isArray(res.data)) {
      const activeTypes = res.data.filter(isEntityActive);
      typesCacheRef.current[categoryId] = activeTypes;
      setTypes(activeTypes);
    } else {
      setTypes([]);
    }
  };

  const handleCategorySelection = async (categoryId: number | null) => {
    setNewData((prev) => ({
      ...prev,
      assetType: "",
      typeId: null,
      categoryId,
    }));
    await updateCategoryContext(categoryId);
  };

  const existingSearch = useAddAssetDrawerExistingSearch();

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setMode("new");
      setNewData({ category: "", assetType: "", categoryId: null, typeId: null });
    }
  }

  const handleNewRegisterSubmit = async () => {
    if (!newData.category || !newData.assetType) return;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("newAssetFormData");
    }
    const cat = categories.find((c) => c.categoryName === newData.category);
    const typ = types.find((t) => {
      const label = t.assetTypeName || t.typeName || "";
      return label === newData.assetType;
    });

    const categoryId = cat?.id ?? newData.categoryId ?? 0;
    const typeId = typ?.id ?? newData.typeId ?? 0;

    setIsSubmitting(true);
    try {
      const res = await submitAssetForm({
        ...INITIAL_BUILDING_BASIC_INFO,
        categoryId,
        typeId,
        category: newData.category,
        assetType: newData.assetType,
        assetName: "",
        status: "Draft",
      });

      if (res.success && res.assetId) {
        const params = new URLSearchParams({
          category: newData.category,
          assetType: newData.assetType,
          categoryId: categoryId.toString(),
          typeId: typeId.toString(),
          id: res.assetId.toString(),
          assetId: res.assetId.toString(),
        });
        push(`/assets/municipal-Asset/new-add-new-asset/${res.assetId}/basic-info?${params}`);
      } else {
        toast.error(res?.error || res?.message || "Failed to create draft asset. Please try again.");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error creating draft asset. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExistingAssetSubmit = () => {
    const selectedAsset = existingSearch.selectedAsset;
    if (!selectedAsset) return;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("newAssetFormData");
    }
    const params = new URLSearchParams({
      category: selectedAsset.categoryName,
      assetType: selectedAsset.typeName,
      existingAssetId: selectedAsset.id.toString(),
      existingAssetNo: selectedAsset.assetNo,
    });
    push(`/assets/municipal-Asset/new-add-new-asset/${selectedAsset.id}/basic-info?${params}`);
  };

  return {
    mode, setMode,
    categories, types, newData, setNewData, handleCategorySelection,
    selectedZoneId: existingSearch.selectedZoneId, setSelectedZoneId: existingSearch.setSelectedZoneId,
    selectedWardId: existingSearch.selectedWardId, setSelectedWardId: existingSearch.setSelectedWardId,
    assetSearch: existingSearch.assetSearch, setAssetSearch: existingSearch.setAssetSearch,
    assetResults: existingSearch.assetResults, setAssetResults: existingSearch.setAssetResults,
    totalCount: existingSearch.totalCount, setTotalCount: existingSearch.setTotalCount,
    selectedAsset: existingSearch.selectedAsset, setSelectedAsset: existingSearch.setSelectedAsset,
    isAssetLoading: existingSearch.isAssetLoading, setIsAssetLoading: existingSearch.setIsAssetLoading,
    canSearch: existingSearch.canSearch,
    handleAssetSearchChange: existingSearch.handleAssetSearchChange,
    handleNewRegisterSubmit, handleExistingAssetSubmit,
    isSubmitting
  };
}