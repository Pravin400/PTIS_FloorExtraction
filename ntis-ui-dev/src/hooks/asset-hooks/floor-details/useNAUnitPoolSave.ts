/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { toast } from "sonner";
import { fetchFloorsByAsset, createChildAssetAction, getSubUnitsByAssetAction, fetchFloorDropdownOptions } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions";
import type { PoolUnit } from "@/types/asset/floor-details.types";
import { useNAAssetForm } from "@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext";
import { mapSubUnitsToFloors } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/direct-room-mapper.utils';
import { syncFloorLevelDetails } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-floor-details-sync.utils';
import { buildBulkSaveChildPayload } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-bulk-save-payload.utils';

// NA = NewAddNewAsset copy of useUnitPoolSave
export function useNAUnitPoolSave(props: any) {
  const { updateFormData } = useNAAssetForm();
  const {
    pool, setPool, parentFloors, formData, t, setIsSaving,
    floorOpenSpaces, floorAmenities, floorConfigDirty, setFloorConfigDirty,
  } = props;

  const handleSaveAll = useCallback(async (): Promise<boolean> => {
    if (pool.length === 0) return true;

    const unsaved = pool.filter((u: PoolUnit) => !u.isSaved || u.isModified);
    const hasChanges = unsaved.length > 0 || floorConfigDirty;
    if (!hasChanges) {
      return true;
    }

    setIsSaving(true);
    const loadingToast = toast.loading(
      t("floorDetails.savingUnitsMsg") || "Saving all units to database..."
    );

    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    const rawAssetId = Number(formData.id || urlParams.get("id") || urlParams.get("assetId"));
    const parentAssetId = isNaN(rawAssetId) || rawAssetId <= 0 ? 0 : rawAssetId;

    if (!parentAssetId) {
      toast.error(
        t("floorDetails.buildingNotSavedMsg") ||
          "Building not saved yet. Complete Basic Info first.",
        { id: loadingToast }
      );
      setIsSaving(false);
      return false;
    }

    try {
      const saved: PoolUnit[] = [];

      const floorDetailsMap = new Map<number, number>();

      try {
        const existRes = await fetchFloorsByAsset(parentAssetId);
        if (existRes.success && Array.isArray(existRes.data)) {
          (existRes.data as any[]).forEach((f: any) => {
            if (f.floorId && f.id) floorDetailsMap.set(Number(f.floorId), Number(f.id));
          });
        }
      } catch {
        /* ignore */
      }

      const uniqueFloorLevels = new Set([
        ...unsaved.map((u: PoolUnit) => u.selectedFloorId).filter((id: any): id is number => !!id),
        ...Object.keys(floorOpenSpaces).map(Number).filter((id) => !isNaN(id)),
        ...Object.keys(floorAmenities).map(Number).filter((id) => !isNaN(id)),
      ]);

      const errors = await syncFloorLevelDetails(
        uniqueFloorLevels,
        floorOpenSpaces,
        floorAmenities,
        parentFloors,
        pool,
        parentAssetId,
        floorDetailsMap
      );

      for (const unit of unsaved) {
        const resolvedFloorDetailsId = unit.selectedFloorId
          ? (floorDetailsMap.get(unit.selectedFloorId) ?? unit.selectedFloorId)
          : undefined;

        const res = await createChildAssetAction(
          buildBulkSaveChildPayload(unit, parentAssetId, resolvedFloorDetailsId, formData)
        );

        if (res.success && res.data) {
          saved.push({
            ...unit,
            dbId: res.data.assetId || unit.dbId,
            unitNumber: res.data.assetNo || unit.unitNumber,
            isSaved: true,
            isModified: false,
          });
        } else {
          const rawErr = res.error || 'failed';
          const friendlyErr = rawErr.includes('LeaseRent_Asset_NotFound')
            ? 'Failed to register renter: Asset unit not found in registry'
            : rawErr;
          errors.push(`${unit.unitNumber}: ${friendlyErr}`);
        }
      }

      let updatedSaved = saved;
      try {
        if (saved.length > 0 && parentAssetId) {
          const freshSubUnits = await getSubUnitsByAssetAction(parentAssetId);
          const dataList = freshSubUnits.data;
          if (freshSubUnits.success && Array.isArray(dataList)) {
            updatedSaved = saved.map((s) => {
              const fresh = dataList.find(
                (f: any) => String(f.id) === String(s.dbId) || String(f.assetId) === String(s.dbId)
              );
              if (fresh) {
                return {
                  ...s,
                  cvBaseRate: fresh.cvBaseRate ?? fresh.CVBaseRate ?? s.cvBaseRate,
                  baseValue: fresh.baseValue ?? fresh.BaseValue ?? s.baseValue,
                  cvFloorFactor: fresh.cvFloorFactor ?? fresh.CVFloorFactor ?? s.cvFloorFactor,
                  cvAgeFactor: fresh.cvAgeFactor ?? fresh.CVAgeFactor ?? s.cvAgeFactor,
                  cvNatureFactor: fresh.cvNatureFactor ?? fresh.CVNatureFactor ?? s.cvNatureFactor,
                  cvUseFactor: fresh.cvUseFactor ?? fresh.CVUseFactor ?? s.cvUseFactor,
                  capitalValue: fresh.capitalValue ?? fresh.CapitalValue ?? s.capitalValue,
                };
              }
              return s;
            });
          }
        }
      } catch (err) {
        console.error('Failed to refetch subunits for updated CVs', err);
      }

      setPool((prev: PoolUnit[]) =>
        prev.map((u) => {
          const s = updatedSaved.find((sv) => sv.tempId === u.tempId);
          return s ?? u;
        })
      );

      if (errors.length > 0) {
        toast.warning(
          t('floorDetails.partialSaveMsg', {
            saved: saved.length,
            failed: errors.length,
            errors: errors.join(', '),
          }) || `Saved ${saved.length} units. ${errors.length} failed: ${errors.join(', ')}`,
          { id: loadingToast }
        );
        return false;
      }
      toast.success(
        t('floorDetails.allUnitsSavedMsg', { count: saved.length }) ||
          `All ${saved.length} unit(s) saved. Proceeding…`,
        { id: loadingToast }
      );
      // Sync context formData.floors immediately so that the Floor Snapshot table on the main page updates at the same time
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
              subUnitsRes.data || [], 
              floorsRes.data || [], 
              dropdownsRes.data
            );
            updateFormData({ floors: mapped });
          }
        }
      } catch (syncErr) {
        console.error("Failed to sync floor snapshot in save hook:", syncErr);
      }

      setFloorConfigDirty(false);
      return true;
    } catch (err: any) {
      toast.error(err.message || t("floorDetails.saveFailedMsg") || "Save failed.", {
        id: loadingToast,
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [pool, formData, t, floorOpenSpaces, floorAmenities, parentFloors, floorConfigDirty, setPool, setIsSaving, setFloorConfigDirty, updateFormData]);

  return handleSaveAll;
}
