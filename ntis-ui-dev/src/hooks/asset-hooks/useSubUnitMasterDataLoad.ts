/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import {
  fetchFloorsByAsset,
  fetchFloorDropdownOptions,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';

/** Loads parent floors + floor dropdown options for the sub-unit configurator,
 * preferring already-fetched props/context data and only calling the server
 * actions for whichever half (floors / dropdowns) is genuinely missing. */
export function useSubUnitMasterDataLoad(
  unit: any,
  globalFormData: any,
  propFloors: any[],
  propDropdownOptions: any
) {
  const [loading, setLoading] = useState(false);

  const [parentFloors, setParentFloors] = useState<any[]>(() => {
    if (propFloors && propFloors.length > 0) return propFloors;
    if (globalFormData?.floors && globalFormData.floors.length > 0) return globalFormData.floors;
    return [];
  });
  const [dropdownOptions, setDropdownOptions] = useState<any>(propDropdownOptions || null);

  useEffect(() => {
    if (propFloors && propFloors.length > 0) {
      setTimeout(() => { setParentFloors(propFloors); }, 0);
    } else if (globalFormData?.floors && globalFormData.floors.length > 0) {
      setTimeout(() => { setParentFloors(globalFormData.floors); }, 0);
    }
  }, [propFloors, globalFormData?.floors]);

  useEffect(() => {
    if (propDropdownOptions) {
      setTimeout(() => { setDropdownOptions(propDropdownOptions); }, 0);
    }
  }, [propDropdownOptions]);

  useEffect(() => {
    let ignore = false;
    async function loadMasterData() {
      const parentAssetIdVal =
        unit.parentAssetId ||
        globalFormData.parentBuildingId ||
        globalFormData.id ||
        globalFormData.assetId;
      const parsedParentId = Number(parentAssetIdVal);

      const needsFloors = parentFloors.length === 0 && parsedParentId && parsedParentId > 0;
      const needsDropdowns = !dropdownOptions;

      if (!needsFloors && !needsDropdowns) return;

      setLoading(true);
      try {
        let floorsData = parentFloors;
        let dropdownsData = dropdownOptions;

        const promises: Promise<any>[] = [];

        if (needsFloors) {
          promises.push(
            fetchFloorsByAsset(parsedParentId).then((res: any) => {
              if (res.success && Array.isArray(res.data)) {
                floorsData = res.data;
              }
            })
          );
        }

        if (needsDropdowns) {
          const urlParams =
            typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const assetTypeIdVal =
            globalFormData?.assetTypeId ??
            globalFormData?.typeId ??
            (urlParams ? Number(urlParams.get('typeId') || urlParams.get('TypeId')) : undefined);
          const assetTypeId = assetTypeIdVal ? Number(assetTypeIdVal) : undefined;
          promises.push(
            fetchFloorDropdownOptions(assetTypeId).then((res: any) => {
              if (res.success && res.data) {
                const data = res.data as any;
                dropdownsData = data.dropdownOptions || data;
              }
            })
          );
        }

        await Promise.all(promises);

        if (!ignore) {
          if (needsFloors) setTimeout(() => { setParentFloors(floorsData); }, 0);
          if (needsDropdowns) setDropdownOptions(dropdownsData);
        }
      } catch (err) {
        console.error('Failed to load master data for sub-unit configurator:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadMasterData();
    return () => {
      ignore = true;
    };
  }, [
    unit.parentAssetId,
    globalFormData.parentBuildingId,
    globalFormData.id,
    globalFormData.assetId,
    globalFormData?.assetTypeId,
    globalFormData?.typeId,
    parentFloors,
    dropdownOptions,
  ]);

  return { loading, parentFloors, dropdownOptions };
}
