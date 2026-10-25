/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { PoolUnit } from '@/types/asset/floor-details.types';
import {
  createChildAssetAction,
  calculateUnitCVAction,
  fetchFloorsByAsset,
  syncFloorAreaAndCVAction,
  getSubUnitsByAssetAction,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';
import { resolveOrCreateUnitFloorDetailsId } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-floor-detail-resolver.utils';
import { buildUnitDetailChildPayload } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-save-payload.utils';
import { mapInitialSubUnitsToPool } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-initial-mapping.utils';
import { useNAAssetForm } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext';
import { syncFloorSnapshotAfterSave, formatUnitSaveErrorMessage } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-save-detail.utils';

export function useNAUnitPoolSaveUnitDetail(
  activeUnit: PoolUnit | null,
  setActiveUnit: React.Dispatch<React.SetStateAction<PoolUnit | null>>,
  parentFloors: any[],
  setParentFloors: React.Dispatch<React.SetStateAction<any[]>>,
  setPool: React.Dispatch<React.SetStateAction<PoolUnit[]>>,
  formData: any,
  t: (key: string, values?: any) => string,
  dropdownOptions: any,
  departments: any[],
  onSuccess?: (savedFloorItem?: any, options?: { keepDrawerOpen?: boolean }) => void
) {
  const { updateFormData } = useNAAssetForm();

  const handleSaveUnitDetail = useCallback(
    async (updated: any, options?: { isDuplicateMode?: boolean }) => {
      const isDuplicateMode = !!options?.isDuplicateMode;
      const urlParams =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();
      const rawAssetId = Number(formData.id || urlParams.get('id') || urlParams.get('assetId'));
      const parentAssetId = isNaN(rawAssetId) || rawAssetId <= 0 ? 0 : rawAssetId;

      if (!parentAssetId) {
        toast.error(
          t('floorDetails.buildingNotSavedMsg') ||
          'Building not saved yet. Complete Basic Info first.'
        );
        return;
      }

      const unit = activeUnit;
      if (!unit) return;

      const loadingToast = toast.loading(
        isDuplicateMode
          ? `Duplicating unit on selected sub-floor...`
          : `Saving unit ${unit.unitNumber} to database...`
      );

      try {
        const { resolvedFloorDetailsId, newFloorId } = await resolveOrCreateUnitFloorDetailsId(
          updated,
          unit,
          parentAssetId,
          parentFloors,
          isDuplicateMode
        );

        const { childPayload } = buildUnitDetailChildPayload(
          updated,
          unit,
          formData,
          parentAssetId,
          resolvedFloorDetailsId,
          newFloorId,
          isDuplicateMode
        );

        const res = await createChildAssetAction(childPayload as any);

        if (res.success && res.data) {
          const returnedDbId =
            res.data && typeof res.data === 'object'
              ? Number(res.data.assetId || 0)
              : Number(res.data || 0);

          const returnedSubUnitsDetailsId =
            res.data && typeof res.data === 'object' && res.data.subUnitsDetailsId
              ? Number(res.data.subUnitsDetailsId)
              : undefined;

          if (returnedDbId) {
            try {
              toast.loading(`Calculating Capital Value for unit...`, { id: loadingToast });
              const cvRes = await calculateUnitCVAction(returnedDbId, returnedSubUnitsDetailsId);
              if (cvRes.success && cvRes.data) {
                const updatedCV =
                  cvRes.data.capitalValue ||
                  cvRes.data.CapitalValue ||
                  cvRes.data.totalCapitalValue ||
                  cvRes.data.TotalCapitalValue ||
                  0;
                updated.capitalValue = updatedCV;
              }
            } catch (cvErr) {
              console.warn('Failed to calculate CV for unit during save details:', cvErr);
            }
          }

          if (newFloorId) {
            const syncRes = await syncFloorAreaAndCVAction(parentAssetId, newFloorId);
            if (syncRes.success && syncRes.data?.floors) {
              setParentFloors(syncRes.data.floors);
            } else {
              const existRes = await fetchFloorsByAsset(parentAssetId);
              if (existRes.success && Array.isArray(existRes.data)) {
                setParentFloors(existRes.data);
              }
            }
          }

          // Fetch fresh sub-unit list from the backend
          let freshSavedUnit: any = null;
          if (returnedDbId) {
            try {
              const freshRes = await getSubUnitsByAssetAction(parentAssetId, true);
              if (freshRes.success && Array.isArray(freshRes.data)) {
                const freshUnit = (freshRes.data as any[]).find((u: any) => Number(u.assetId || u.id) === returnedDbId);
                if (freshUnit) {
                  freshSavedUnit = freshUnit;
                  const mappedUnit = mapInitialSubUnitsToPool([freshUnit], parentFloors, dropdownOptions, departments)[0];
                  if (!(mappedUnit as any).subFloorName && (updated as any).subFloorName) {
                    (mappedUnit as any).subFloorName = (updated as any).subFloorName;
                  }
                  if (isDuplicateMode) {
                    setPool((prev) => [...prev, { ...mappedUnit, stagedFiles: unit.stagedFiles }]);
                  } else {
                    setPool((prev) =>
                      prev.map((p) =>
                        p.tempId === unit.tempId || (p.unitNumber && unit.unitNumber && p.unitNumber === unit.unitNumber)
                          ? { ...mappedUnit, stagedFiles: p.stagedFiles }
                          : p
                      )
                    );
                  }
                }
              }
            } catch (err) {
              console.warn('Failed to refresh saved unit from server', err);
              if (isDuplicateMode) {
                setPool((prev) => [...prev, { ...unit, ...updated, isSaved: true, dbId: returnedDbId }]);
              } else {
                setPool((prev) =>
                  prev.map((p) =>
                    p.tempId === unit.tempId || (p.unitNumber && unit.unitNumber && p.unitNumber === unit.unitNumber)
                      ? { ...p, ...updated, isSaved: true, dbId: returnedDbId }
                      : p
                  )
                );
              }
            }
          }

          // Sync context formData.floors so NAFloorTable updates immediately
          await syncFloorSnapshotAfterSave(parentAssetId, Number(formData.typeId) || 0, updateFormData);

          if (onSuccess && freshSavedUnit) {
            onSuccess(freshSavedUnit, { keepDrawerOpen: true });
          }

          if (isDuplicateMode) {
            toast.success(
              `Unit duplicated successfully. You can select another Sub Floor to duplicate again.`,
              { id: loadingToast }
            );
            // In duplicate mode, keep configurator open for repeated duplication
          } else {
            const msg = t('floorDetails.unitDetailSavedSuccess', { unitNumber: unit.unitNumber });
            toast.success(
              msg === 'floorDetails.unitDetailSavedSuccess' ? `Unit ${unit.unitNumber} saved successfully.` : msg,
              { id: loadingToast }
            );
            setActiveUnit(null);
          }
        } else {
          const rawError = String(res.error || 'Failed to save unit details.');
          toast.error(formatUnitSaveErrorMessage(unit, rawError), { id: loadingToast });
        }
      } catch (err: any) {
        console.error('Error saving unit inline:', err);
        const rawError = String(err?.message || 'An error occurred while saving unit details.');
        toast.error(formatUnitSaveErrorMessage(unit, rawError), { id: loadingToast });
      }
    },
    [activeUnit, parentFloors, formData, t, setActiveUnit, setParentFloors, setPool, updateFormData, dropdownOptions, departments, onSuccess]
  );

  return { handleSaveUnitDetail };
}
