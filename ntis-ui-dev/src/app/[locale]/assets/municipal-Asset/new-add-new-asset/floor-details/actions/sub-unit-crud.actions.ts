/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { floorDetailsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/floor-details.service';
import { manageSubUnitsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/manage-subunits.service';
import { logger } from '@/lib/utils/logger';
import {
  BulkGenerateChildAssetsRequest,
  BulkGenerateChildAssetsResponse,
  SubUnitApiRequest,
  SubUnitApiResponse,
} from '@/types/asset/floor-details.types';
import { ActionResult } from '@/types/common.types';
import { cookies } from 'next/headers';
import { getArray } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/shared.utils';

export async function fetchSubUnitsByFloor(
  floorDetailId: number
): Promise<ActionResult<SubUnitApiResponse[]>> {
  try {
    const res = await floorDetailsService.getSubUnitsByFloor(floorDetailId);
    return { success: true, data: res.success ? getArray(res.data) : [] };
  } catch (err: any) {
    logger.error('fetchSubUnitsByFloor Error:', { error: err });
    return { success: true, data: [] };
  }
}

export async function saveSubUnit(
  data: SubUnitApiRequest
): Promise<ActionResult<SubUnitApiResponse>> {
  try {
    const res = await floorDetailsService.createSubUnit(data);
    return res.success && res.data
      ? { success: true, data: res.data }
      : { success: false, error: res.error ?? 'Failed to save sub-unit' };
  } catch (err: any) {
    logger.error('saveSubUnit Error:', { error: err });
    return { success: false, error: 'Network error saving sub-unit' };
  }
}

export async function deleteSubUnit(id: number): Promise<ActionResult<void>> {
  try {
    const res = await floorDetailsService.deleteSubUnit(id);
    return res.success
      ? { success: true }
      : { success: false, error: res.error ?? 'Failed to delete sub-unit' };
  } catch (err: any) {
    logger.error('deleteSubUnit Error:', { error: err });
    return { success: false, error: 'Network error deleting sub-unit' };
  }
}

export async function updateSubUnitAction(
  id: number,
  data: Partial<SubUnitApiRequest>
): Promise<ActionResult<SubUnitApiResponse>> {
  try {
    const res = await floorDetailsService.updateSubUnit(id, data);
    if (res.success && res.data) {
      const body = res.data as any;
      if (body.success) {
        return { success: true, data: body.items };
      } else {
        return { success: false, error: body.message || 'Failed to update sub-unit' };
      }
    }
    return { success: false, error: res.error ?? 'Failed to update sub-unit' };
  } catch (err: any) {
    logger.error('updateSubUnitAction Error:', { error: err });
    return { success: false, error: 'Network error updating sub-unit' };
  }
}

/**
 * Server action to bulk generate sub-units / child assets under a parent building
 */
export async function bulkGenerateSubUnitsAction(
  data: BulkGenerateChildAssetsRequest
): Promise<ActionResult<BulkGenerateChildAssetsResponse>> {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    const userId = userIdStr ? Number(userIdStr) : undefined;

    const payload = {
      ...data,
      createdBy: userId ?? data.createdBy ?? 1,
    };
    const res = await floorDetailsService.bulkGenerateSubUnits(payload);
    if (res.success && res.data) {
      const body = res.data as any;
      if (body.success) {
        return { success: true, data: body.items };
      } else {
        return { success: false, error: body.message || 'Failed to bulk generate sub-units' };
      }
    }
    return { success: false, error: res.error ?? 'Failed to bulk generate sub-units' };
  } catch (err: any) {
    logger.error('bulkGenerateSubUnitsAction Error:', { error: err });
    return { success: false, error: 'Network error bulk generating sub-units' };
  }
}

/**
 * Server action to bulk generate floor details and subunits across multiple floors in one transaction
 */
export async function bulkGenerateAcrossFloorsAction(data: any): Promise<ActionResult<any>> {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    const userId = userIdStr ? Number(userIdStr) : undefined;

    const payload = {
      ...data,
      createdBy: userId ?? data.createdBy ?? 1,
    };
    const res = await floorDetailsService.bulkGenerateAcrossFloors(payload);
    if (res.success && res.data) {
      const body = res.data as any;
      if (body.success) {
        return { success: true, data: body.items };
      } else {
        const detailErrors = body.items?.errors;
        const details =
          Array.isArray(detailErrors) && detailErrors.length > 0 ? detailErrors.join(', ') : '';
        return { success: false, error: details || body.message || 'Failed to generate subunits' };
      }
    }
    return { success: false, error: res.error ?? 'Failed to generate subunits' };
  } catch (err: any) {
    logger.error('bulkGenerateAcrossFloorsAction Error:', { error: err });
    return { success: false, error: 'Network error bulk generating subunits across floors' };
  }
}

/**
 * Pre-allocates a single child asset slot for duplicate-floor mode.
 * Unlike bulkGenerateSubUnitsAction, this correctly handles the already-unwrapped
 * response that comes back from floorDetailsService.bulkGenerateSubUnits.
 */
export async function preallocateDuplicateSlotAction(
  parentAssetId: number,
  unitType: string,
  floorDetailsId?: number
): Promise<ActionResult<number>> {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    const userId = userIdStr ? Number(userIdStr) : undefined;

    const res = await floorDetailsService.bulkGenerateSubUnits({
      parentAssetId,
      type: unitType,
      count: 1,
      floorDetailsId: floorDetailsId || undefined,
      prefix: '',
      startNumber: 1,
      areaSqFt: 0,
      createdBy: userId ?? 1,
    });

    logger.info('preallocateDuplicateSlotAction: raw response', {
      success: res.success,
      statusCode: res.statusCode,
      errorMessage: res.error,
      data: JSON.stringify(res.data),
    });

    if (res.success && res.data) {
      const raw = res.data as any;
      // The raw response can have multiple shapes depending on the API version:
      //   • array directly         → [{ assetId, assetNo }]
      //   • { items: [...] }       → unwrapped by apiClient
      //   • { generatedAssets: [] }
      //   • { data: { items: [] } }
      //   • { success, items: [] } → full envelope (jsonRequest path)
      let assets: any[] = [];
      if (Array.isArray(raw)) {
        assets = raw;
      } else if (Array.isArray(raw.generatedAssets)) {
        assets = raw.generatedAssets;
      } else if (Array.isArray(raw.items)) {
        assets = raw.items;
      } else if (raw.data && Array.isArray(raw.data)) {
        assets = raw.data;
      } else if (raw.data?.items && Array.isArray(raw.data.items)) {
        assets = raw.data.items;
      } else if (raw.data?.generatedAssets && Array.isArray(raw.data.generatedAssets)) {
        assets = raw.data.generatedAssets;
      }

      const first = assets[0];
      const allocatedId = Number(
        first?.assetId ?? first?.AssetId ?? first?.id ?? first?.Id ?? 0
      );
      logger.info('preallocateDuplicateSlotAction: parsed', { assets: JSON.stringify(assets), allocatedId });
      if (allocatedId > 0) {
        return { success: true, data: allocatedId };
      }
    }
    return { success: false, error: res.error ?? 'No asset ID returned from pre-allocation' };
  } catch (err: any) {
    logger.error('preallocateDuplicateSlotAction Error:', { error: err });
    return { success: false, error: err.message ?? 'Network error during pre-allocation' };
  }
}

/**
 * Server action to synchronize FloorId across all ams.SubUnitsDetails records for a specific Unit AssetId.
 * Calls PUT /ManageSubUnits/{unitAssetId}/sync-floor?floorId={floorId}.
 * If the dedicated sync-floor endpoint is not yet reachable, it seamlessly falls back to updating each active
 * submission record for this unit via updateFloorSubmission.
 */
export async function syncUnitFloorAction(
  unitAssetId: number,
  floorId: number,
  existingEntries?: any[]
): Promise<ActionResult<boolean>> {
  try {
    const res = await manageSubUnitsService.syncUnitFloor(unitAssetId, floorId);
    if (res.success) {
      return { success: true, data: true };
    }

    // Graceful fallback if sync-floor endpoint returned non-success:
    if (Array.isArray(existingEntries) && existingEntries.length > 0) {
      for (const entry of existingEntries) {
        const subUnitsDetailsId = entry.subUnitsDetailsId || entry.id;
        if (subUnitsDetailsId && subUnitsDetailsId > 0) {
          const entrySubFloorId =
            entry.subFloorId !== undefined && entry.subFloorId !== '' && entry.subFloorId !== null
              ? (Number(entry.subFloorId) > 0 ? Number(entry.subFloorId) : null)
              : (entry.formDataSnapshot?.subFloorId && Number(entry.formDataSnapshot.subFloorId) > 0
                  ? Number(entry.formDataSnapshot.subFloorId)
                  : null);

          const payload = {
            ...(entry.formDataSnapshot || {}),
            parentAssetId: unitAssetId,
            floorId,
            subFloorId: entrySubFloorId,
          };
          await manageSubUnitsService.updateFloorSubmission(subUnitsDetailsId, payload);
        }
      }
      return { success: true, data: true };
    }

    return { success: false, error: res.error ?? 'Failed to synchronize unit floor' };
  } catch (err: any) {
    logger.error('syncUnitFloorAction Error:', { error: err });
    // Fallback on network/endpoint error:
    if (Array.isArray(existingEntries) && existingEntries.length > 0) {
      try {
        for (const entry of existingEntries) {
          const subUnitsDetailsId = entry.subUnitsDetailsId || entry.id;
          if (subUnitsDetailsId && subUnitsDetailsId > 0) {
            const entrySubFloorId =
              entry.subFloorId !== undefined && entry.subFloorId !== '' && entry.subFloorId !== null
                ? (Number(entry.subFloorId) > 0 ? Number(entry.subFloorId) : null)
                : (entry.formDataSnapshot?.subFloorId && Number(entry.formDataSnapshot.subFloorId) > 0
                    ? Number(entry.formDataSnapshot.subFloorId)
                    : null);

            const payload = {
              ...(entry.formDataSnapshot || {}),
              parentAssetId: unitAssetId,
              floorId,
              subFloorId: entrySubFloorId,
            };
            await manageSubUnitsService.updateFloorSubmission(subUnitsDetailsId, payload);
          }
        }
        return { success: true, data: true };
      } catch (fallbackErr: any) {
        logger.error('syncUnitFloorAction fallback Error:', { error: fallbackErr });
      }
    }
    return { success: false, error: 'Network error synchronizing unit floor' };
  }
}

