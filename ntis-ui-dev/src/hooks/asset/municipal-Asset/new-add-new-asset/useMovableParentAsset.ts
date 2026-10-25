import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAssetMasterById, fetchAssetsByFilter } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/lookups/action";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";

import type {
  BuildingBasicInfoFormData,
  MovableParentAssetItem,
} from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import type { AssetFloorDetailItem } from "@/types/asset/municipal-Asset/new-add-new-asset/detail-tabs.types";
import type {
  ParentAssetRecord,
  ParentSubunitLookupItem,
} from "@/types/asset/municipal-Asset/new-add-new-asset/form-orchestrator.types";

export type { ParentAssetRecord };

export function useMovableParentAsset(
  formData: BuildingBasicInfoFormData,
  updateFormData: (patch: Partial<BuildingBasicInfoFormData>) => void,
  t: (key: string, values?: Record<string, string | number>) => string,
  initialParentAsset: ParentAssetRecord | MovableParentAssetItem | null = null,
  initialParentFloors: AssetFloorDetailItem[] = [],
  initialParentSubunits: ParentSubunitLookupItem[] = []
) {
  const [selectedParentAsset, setSelectedParentAsset] = useState<ParentAssetRecord | MovableParentAssetItem | null>(initialParentAsset);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ParentAssetRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [floors, setFloors] = useState<AssetFloorDetailItem[]>(initialParentFloors);
  const [subunits, setSubunits] = useState<ParentSubunitLookupItem[]>(initialParentSubunits);
  const [isLoadingFloors] = useState(false);
  const [isLoadingSubunits] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [prevInitialParentAsset, setPrevInitialParentAsset] = useState(initialParentAsset);
  if (initialParentAsset !== prevInitialParentAsset) {
    setPrevInitialParentAsset(initialParentAsset);
    setSelectedParentAsset(initialParentAsset);
  }

  const [prevInitialParentFloors, setPrevInitialParentFloors] = useState(initialParentFloors);
  if (initialParentFloors !== prevInitialParentFloors) {
    setPrevInitialParentFloors(initialParentFloors);
    setFloors(initialParentFloors);
  }

  const [prevInitialParentSubunits, setPrevInitialParentSubunits] = useState(initialParentSubunits);
  if (initialParentSubunits !== prevInitialParentSubunits) {
    setPrevInitialParentSubunits(initialParentSubunits);
    setSubunits(initialParentSubunits);
  }

  const performParentSearch = useCallback(async (search: string) => {
    setIsSearching(true);
    try {
      const res = await fetchAssetsByFilter({ search });
      if (res.success && res.data) {
        const rawItems = res.data as ParentAssetRecord[];
        const nonMovable = rawItems.filter(
          (a) =>
            !(a.assetCategoryName || "").toLowerCase().includes("movable") &&
            !(a.categoryName || "").toLowerCase().includes("movable")
        );
        setSearchResults(nonMovable);
      }
    } catch (err) {
      logger.error("Failed to search parent assets", { error: err instanceof Error ? err : undefined });
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      performParentSearch(value);
    }, 400);
  }, [performParentSearch]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleSelectAsset = async (asset: ParentAssetRecord | MovableParentAssetItem) => {
    try {
      const numericId = typeof asset.id === "number" ? asset.id : Number(asset.id || 0);
      const fullDetails = numericId > 0 ? await fetchAssetMasterById(numericId) : null;
      const parent = (fullDetails || asset) as ParentAssetRecord;
      setSelectedParentAsset(parent);

      const d = parent.details || {};
      const zoneId = d.zoneId || parent.zoneId ? String(d.zoneId || parent.zoneId) : "";
      const wardId = d.wardId || parent.wardId ? String(d.wardId || parent.wardId) : "";
      const subZoneId = d.subZoneId || parent.subZoneId ? String(d.subZoneId || parent.subZoneId) : "";
      const moujaId = d.moujaId || parent.moujaId ? String(d.moujaId || parent.moujaId) : "";
      const address = d.address || parent.address || "";
      const locality = d.nearestLandmark || d.locality || parent.locality || "";
      const pinCode = d.pinCode || parent.pinCode || "";
      const lat = d.latitude || parent.latitude ? String(d.latitude || parent.latitude) : "";
      const lng = d.longitude || parent.longitude ? String(d.longitude || parent.longitude) : "";
      const deptId = parent.departmentId ? String(parent.departmentId) : "";
      const surveyNo = d.csn || d.CSN || parent.csn || "";
      const propNo = d.propertyNo || parent.propertyNo || parent.propertyNumber || parent.assetNo || "";

      updateFormData({
        parentBuildingId: parent.id,
        zone: zoneId,
        zoneId: zoneId,
        ward: wardId,
        wardId: wardId,
        subzone: subZoneId,
        subZoneId: subZoneId,
        mouja: moujaId,
        moujaId: moujaId,
        fullAddress: address,
        locality: locality,
        pinCode: pinCode,
        latitude: lat,
        longitude: lng,
        department: deptId,
        departmentId: deptId,
        surveyNumber: surveyNo,
        propertyNumber: propNo,
        partitionNo: d.partitionNo || parent.partitionNo || "",
        upicId: d.upicId || parent.upicId || "",
        plotNumber: d.plotNo || parent.plotNo || "",
        assetCondition: parent.assetConditionId ? String(parent.assetConditionId) : "",
        assetName: parent.assetName || "",
        assetNameRegional: parent.assetRegionalName || "",
        ownershipType: parent.ownershipType || "",
        inChargeName: d.inChargeName || parent.inChargeName || "",
        inChargeNameRegional: d.inChargeRegionalName || parent.inChargeRegionalName || "",
        inChargeDesignation: d.inChargeDesignationId || parent.inChargeDesignationId ? String(d.inChargeDesignationId || parent.inChargeDesignationId) : "",
        inChargeMobile: d.inChargeMobile || parent.inChargeMobile || "",
        inChargeEmail: d.inChargeEmail || parent.inChargeEmail || "",
        isRented: d.isRented !== undefined ? (d.isRented ? "true" : "false") : (parent.isRented !== undefined ? (parent.isRented ? "true" : "false") : ""),
        attributes: {
          ...formData.attributes,
          parentFloorId: "",
          subunitId: "",
          roomNumber: "",
        },
      });

      toast.success(t("wizard.toasts.selectedParentAsset", { name: parent.assetName || "" }));
    } catch (err) {
      toast.error(t("wizard.toasts.failedParentDetails"));
      logger.error("Failed to fetch parent asset details", { error: err instanceof Error ? err : undefined });
    }
  };

  const handleClearSelected = () => {
    setSelectedParentAsset(null);
    setFloors([]);
    setSubunits([]);
    updateFormData({
      parentBuildingId: null,
      zone: "",
      zoneId: "",
      ward: "",
      wardId: "",
      subzone: "",
      subZoneId: "",
      mouja: "",
      moujaId: "",
      fullAddress: "",
      locality: "",
      pinCode: "",
      latitude: "",
      longitude: "",
      surveyNumber: "",
      propertyNumber: "",
      partitionNo: "",
      upicId: "",
      plotNumber: "",
      assetCondition: "",
      assetName: "",
      assetNameRegional: "",
      ownershipType: "",
      inChargeName: "",
      inChargeNameRegional: "",
      inChargeDesignation: "",
      inChargeMobile: "",
      inChargeEmail: "",
      isRented: "",
      attributes: {
        ...formData.attributes,
        parentFloorId: "",
        subunitId: "",
        roomNumber: "",
      },
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    handleSearchTermChange,
    searchResults,
    selectedParentAsset,
    isSearching,
    floors,
    subunits,
    isLoadingFloors,
    isLoadingSubunits,
    handleSelectAsset,
    handleClearSelected,
  };
}
