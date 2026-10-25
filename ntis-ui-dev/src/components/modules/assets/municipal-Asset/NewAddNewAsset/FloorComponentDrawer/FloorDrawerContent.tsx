'use client';
import type { FloorDrawerContentProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FloorDetailsPage from "./components/FloorDetailsStep";
import { NAAssetFormHydrator } from "../NAAssetFormHydrator";
import {
  fetchFloorDropdownOptions,
  getSubUnitsByAssetAction,
  fetchDepartmentsAction,
  fetchFloorsByAsset,
  fetchSubUseTypesAction,
  fetchSubFloorAction
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions";
import { getInitialWizardDataAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/initial-data/action";
import { mapSubUnitsToFloors, resolveAmsTypeOfUseId } from "@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-utils";
import { LoadingState } from '@/components/common/LoadingState';



export function FloorDrawerContent({
  assetId,
  categoryId,
  typeId,
  categoryStr,
  assetTypeStr,
  mode = 'floorSubmission',
  editFloorId,
  onSuccess,
}: FloorDrawerContentProps) {
  const searchParams = useSearchParams();
  const directFloorIdStr = searchParams?.get('directFloorId') || '';
  const directUseTypeIdStr = searchParams?.get('directUseTypeId') || '';
  const directFloorIdParam = directFloorIdStr ? Number(directFloorIdStr) : null;
  const directUseTypeIdParam = directUseTypeIdStr ? Number(directUseTypeIdStr) : null;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    dropdownOptions?: unknown;
    initialSubUnits?: unknown[];
    initialFloors?: unknown[];
    initialSubUseTypeMap?: Record<string, unknown>;
    initialDirectSubFloorOptions?: unknown[];
    initialDirectSubUseTypeOptions?: unknown[];
    initialWizardData?: unknown;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // Simulating the page.tsx fetches
        const [
          dropdownsRes,
          subUnitsRes,
          departmentsRes,
          floorsRes,
          initialWizardDataRes,
          directSubFloorRes,
          directSubUseTypeRes
        ] = await Promise.all([
          fetchFloorDropdownOptions(typeId),
          assetId > 0 ? getSubUnitsByAssetAction(assetId) : Promise.resolve({ success: true, data: [] }),
          fetchDepartmentsAction(),
          assetId > 0 ? fetchFloorsByAsset(assetId) : Promise.resolve({ success: true, data: [] }),
          getInitialWizardDataAction(assetId, categoryId, typeId, categoryStr, assetTypeStr),
          directFloorIdParam ? fetchSubFloorAction(directFloorIdParam) : Promise.resolve({ success: true, data: [] }),
          directUseTypeIdParam ? fetchSubUseTypesAction(directUseTypeIdParam) : Promise.resolve({ success: true, data: [] }),
        ]);

        if (!isMounted) return;

        const dropdownOptions = dropdownsRes.success ? {
          ...dropdownsRes.data,
          departments: departmentsRes.success ? departmentsRes.data : []
        } : null;

        const initialSubUnits = subUnitsRes.success && Array.isArray(subUnitsRes.data) ? subUnitsRes.data : [];
        const initialFloors = floorsRes.success && Array.isArray(floorsRes.data) ? floorsRes.data : [];
        const initialDirectSubFloorOptions = directSubFloorRes?.success && Array.isArray(directSubFloorRes.data) ? directSubFloorRes.data : [];
        const initialDirectSubUseTypeOptions = directSubUseTypeRes?.success && Array.isArray(directSubUseTypeRes.data) ? directSubUseTypeRes.data : [];
        const initialWizardData = initialWizardDataRes?.success ? initialWizardDataRes.data : null;

        let initialSubUseTypeMap: Record<string, Record<string, unknown>[]> = {};
        if (dropdownOptions?.useTypes) {
          const useTypesForResolve = dropdownOptions.useTypes;
          const savedFloorsForLabels = mapSubUnitsToFloors(initialSubUnits, initialFloors, dropdownOptions);
          const uniqueUseTypeIds = Array.from(
            new Set(savedFloorsForLabels.map((f: Record<string, unknown>) => Number(f.typeOfUseId)).filter(Boolean))
          );
          const mapEntries = await Promise.all(
            uniqueUseTypeIds.map(async (useTypeId) => {
              const amsId = resolveAmsTypeOfUseId(useTypeId as number, useTypesForResolve);
              if (!amsId) return null;
              const res = await fetchSubUseTypesAction(amsId);
              if (res.success && Array.isArray(res.data)) {
                return [String(useTypeId), res.data] as const;
              }
              return null;
            })
          );
          initialSubUseTypeMap = Object.fromEntries(
            mapEntries.filter((e): e is readonly [string, Record<string, unknown>[]] => e !== null)
          );
        }

        if (isMounted) {
          setData({
            dropdownOptions,
            initialSubUnits,
            initialFloors,
            initialSubUseTypeMap,
            initialDirectSubFloorOptions,
            initialDirectSubUseTypeOptions,
            initialWizardData
          });
        }
      } catch (error) {
        console.error("Error loading floor details data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [assetId, categoryId, typeId, categoryStr, assetTypeStr, directFloorIdParam, directUseTypeIdParam]);

  if (loading || !data) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8">
        <LoadingState
          message="Loading Floor Details..."
          minHeight="200px"
          messageClassName="text-xs font-bold text-slate-500 uppercase tracking-widest"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ overflowY: 'auto' }}>
      <NAAssetFormHydrator initialData={data.initialWizardData as Parameters<typeof NAAssetFormHydrator>[0]['initialData']} />
      <FloorDetailsPage
        dropdownOptions={data.dropdownOptions}
        initialSubUnits={data.initialSubUnits}
        initialFloors={data.initialFloors}
        initialSubUseTypeMap={data.initialSubUseTypeMap}
        initialDirectSubFloorOptions={data.initialDirectSubFloorOptions}
        initialDirectSubUseTypeOptions={data.initialDirectSubUseTypeOptions}
        mode={mode}
        editFloorId={editFloorId}
        onSuccess={onSuccess}
      />
    </div>
  );
}
