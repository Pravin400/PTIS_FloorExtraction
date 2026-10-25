import { useState, useEffect, useCallback } from "react";
import { BuildingListItem } from "@/types/zone-master/properties/building-list.types";
import { getBuildingListByWardAction } from "@/app/[locale]/property-tax/zone-master/actions";

interface UseBuildingListProps {
  wardId: number | null | undefined;
}

interface UseBuildingListReturn {
  buildingList: BuildingListItem[];
  loadingBuildingList: boolean;
  buildingListError: string | null;
  refetchBuildingList: () => Promise<void>;
}
/**
 * Hook to fetch building list for a ward.
 * Returns properties with propertyNo and category name for dropdown display.
 */
export function useBuildingList({ wardId }: UseBuildingListProps): UseBuildingListReturn {
  const [buildingList, setBuildingList] = useState<BuildingListItem[]>([]);
  const [loadingBuildingList, setLoadingBuildingList] = useState(false);
  const [buildingListError, setBuildingListError] = useState<string | null>(null);

  const fetchBuildingList = useCallback(async () => {
    if (!wardId || wardId <= 0) {
      setBuildingList([]);
      setBuildingListError(null);
      return;
    }

    setLoadingBuildingList(true);
    setBuildingListError(null);

    try {
      const result = await getBuildingListByWardAction(wardId);
      
      if (result.success && Array.isArray(result.data)) {
        setBuildingList(result.data);
      } else {
        setBuildingListError(result.error || "Failed to fetch building list");
        setBuildingList([]);
      }
    } catch (error) {
      setBuildingListError(error instanceof Error ? error.message : "Failed to fetch building list");
      setBuildingList([]);
    } finally {
      setLoadingBuildingList(false);
    }
  }, [wardId]);

  // Fetch building list when wardId changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBuildingList();
  }, [fetchBuildingList]);

  return {
    buildingList,
    loadingBuildingList,
    buildingListError,
    refetchBuildingList: fetchBuildingList,
  };
}
