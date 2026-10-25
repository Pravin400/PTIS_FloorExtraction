/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { PoolUnit } from '@/types/asset/floor-details.types';
import {
  deleteChildAssetAction,
  syncFloorAreaAndCVAction,
  fetchFloorsByAsset,
  fetchFloorDropdownOptions,
  getSubUnitsByAssetAction,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';
import { mapSubUnitsToFloors } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/direct-room-mapper.utils';
import { useNAAssetForm } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext';

/**
 * NA (NewAddNewAsset) version of useUnitPoolRemove.
 *
 * Differences from the old-wizard version:
 *  - Uses actions from `new-add-new-asset` (not `add-New-Asset`)
 *  - After every deletion, syncs `formData.floors` via context `updateFormData`
 *    so the Floor Submission table on the main page updates immediately.
 */
export function useNAUnitPoolRemove(
  pool: PoolUnit[],
  setPool: React.Dispatch<React.SetStateAction<PoolUnit[]>>,
  setParentFloors: React.Dispatch<React.SetStateAction<any[]>>,
  formData: any,
  t: (key: string, values?: any) => string
) {
  const { updateFormData } = useNAAssetForm();

  const handleRemove = useCallback(
    async (tempId: string) => {
      const unit = pool.find((u) => u.tempId === tempId);

      const urlParams =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();
      const rawId = Number(formData.id || urlParams.get('id') || urlParams.get('assetId'));
      const parentAssetId = isNaN(rawId) || rawId <= 0 ? 0 : rawId;

      if (unit && unit.dbId) {
        const loadingToast = toast.loading(
          t('floorDetails.deletingUnitMsg') || 'Deleting unit from database...'
        );
        try {
          const res = await deleteChildAssetAction(unit.dbId);
          if (res.success) {
            setPool((prev) => prev.filter((u) => u.tempId !== tempId));

            if (unit.selectedFloorId && parentAssetId > 0) {
              const syncRes = await syncFloorAreaAndCVAction(parentAssetId, unit.selectedFloorId);
              if (syncRes.success && syncRes.data?.floors) {
                setParentFloors(syncRes.data.floors);
              } else {
                const existRes = await fetchFloorsByAsset(parentAssetId);
                if (existRes.success && Array.isArray(existRes.data)) {
                  setParentFloors(existRes.data);
                }
              }
            }

            // ── Sync context formData.floors so the Floor Submission table updates immediately ──
            try {
              const typeId = Number(formData.typeId) || 0;
              if (parentAssetId > 0 && typeId > 0) {
                const [dropdownsRes, subUnitsRes, floorsRes] = await Promise.all([
                  fetchFloorDropdownOptions(typeId),
                  getSubUnitsByAssetAction(parentAssetId),
                  fetchFloorsByAsset(parentAssetId),
                ]);
                if (dropdownsRes.success && subUnitsRes.success && floorsRes.success) {
                  const mapped = mapSubUnitsToFloors(
                    (subUnitsRes.data as any[]) || [],
                    (floorsRes.data as any[]) || [],
                    dropdownsRes.data
                  );
                  updateFormData({ floors: mapped });
                }
              }
            } catch (syncErr) {
              console.error('Failed to sync floor snapshot after unit removal:', syncErr);
            }

            toast.success(t('floorDetails.deleteUnitSuccessMsg') || 'Unit deleted successfully.', {
              id: loadingToast,
            });
          } else {
            toast.error(res.error || 'Failed to delete unit.', { id: loadingToast });
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to delete unit.', { id: loadingToast });
        }
      } else {
        // Unsaved (local-only) unit — just remove from pool
        setPool((prev) => prev.filter((u) => u.tempId !== tempId));
      }
    },
    [pool, t, formData.id, formData.typeId, setPool, setParentFloors, updateFormData]
  );

  return { handleRemove };
}
