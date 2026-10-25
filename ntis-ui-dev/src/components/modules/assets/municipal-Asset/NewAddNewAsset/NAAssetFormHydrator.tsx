"use client";

import { useEffect, useRef } from "react";
import { useNAAssetForm } from "./NAAssetFormContext";
import { mapDbAssetToFormData } from "@/lib/utils/asset-utils/new-add-new-asset/mapDbAssetToFormData";
import type { AssetFormData, HydratorInitialData } from "@/types/asset/municipal-Asset/new-add-new-asset";
export type { HydratorInitialData };

// NA = NewAddNewAsset — independent copy of AssetFormHydrator
export function NAAssetFormHydrator({
  initialData,
}: {
  initialData: HydratorInitialData | null | undefined;
}) {
  const { formData, setFormData, setLastSavedFormData, setIsDataLoading } =
    useNAAssetForm();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (
      initialData &&
      (!formData.hydrated || initialData.dbAsset) &&
      !hydratedRef.current
    ) {
      hydratedRef.current = true;

      setFormData?.((prev: AssetFormData) => {
        const { dbAsset, ...restInitial } = initialData;
        let updates: Partial<AssetFormData> = {
          ...restInitial,
          hydrated: true,
        };

        if (dbAsset) {
          const mapped = mapDbAssetToFormData(dbAsset, prev);
          updates = { ...updates, ...mapped };
        }

        const nextData: AssetFormData = { ...prev, ...updates };
        if (setLastSavedFormData) {
          // structuredClone correctly handles undefined, Date, and File values
          // unlike JSON.parse(JSON.stringify(...)) which silently drops them
          setLastSavedFormData(structuredClone(nextData));
        }
        return nextData;
      });

      if (setIsDataLoading) setIsDataLoading(false);
    }
  }, [initialData, formData.hydrated, setFormData, setLastSavedFormData, setIsDataLoading]);

  return null;
}
