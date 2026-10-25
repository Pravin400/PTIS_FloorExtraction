/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { floorDetailsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/floor-details.service';
import { logger } from '@/lib/utils/logger';
import { FloorDetailApiRequest, FloorDetailApiResponse } from '@/types/asset/floor-details.types';
import { ActionResult } from '@/types/common.types';
import { cookies } from 'next/headers';
import { getArray } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/shared.utils';

/**
 * Locates an already-persisted floor-detail row for the given (asset, floor, subFloor).
 * A floor detail is unique on (ParentAssetId, FloorId, SubFloorId); bulk unit generation saves
 * floors in parallel, so if the same floor is created concurrently (a duplicate floor in the range,
 * a double-clicked "Generate", or a re-run over a building that already has the floor) only one
 * create wins the unique-index race and the rest get a 409 "already exists". This lets the losers
 * reuse the winner's row instead of failing the whole generation.
 */
async function findExistingFloorDetail(
  assetId: number,
  floorId: number,
  subFloorId?: number | null
): Promise<FloorDetailApiResponse | null> {
  try {
    const res = await floorDetailsService.getFloorsByAsset(assetId);
    if (!res.success || !res.data) return null;
    const floors = getArray(res.data);
    const wantSub = subFloorId ?? null;
    const match = floors.find((f: any) => {
      const fFloorId = Number(f.floorId ?? f.FloorId);
      const fSub = f.subFloorId ?? f.SubFloorId ?? null;
      return fFloorId === Number(floorId) && fSub === wantSub;
    });
    if (!match) return null;
    const resolvedId = Number(match.id ?? match.Id);
    match.id = resolvedId;
    (match as any).Id = resolvedId;
    return match as FloorDetailApiResponse;
  } catch {
    return null;
  }
}

export async function saveFloorDetail(
  data: FloorDetailApiRequest
): Promise<ActionResult<FloorDetailApiResponse>> {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    const userId = userIdStr ? Number(userIdStr) : undefined;
    const payload = {
      ...data,
      createdBy: userId ?? data.createdBy ?? 1,
    };
    const res = await floorDetailsService.createFloor(payload);
    if (res.success && res.data) {
      const body = res.data as any;
      if (body.success === false) {
        // Create reported failure (typically a concurrent-duplicate). Reuse the existing row if present.
        const existing = await findExistingFloorDetail(data.assetId, data.floorId, data.subFloorId);
        if (existing) return { success: true, data: existing };
        return { success: false, error: body.message || 'Failed to save floor detail' };
      }
      return { success: true, data: body.items || body.data || body };
    }
    // Non-success HTTP (e.g. a 409 "already exists" from the parallel create race): the row a
    // concurrent create just committed is authoritative — reuse it rather than failing generation.
    const existing = await findExistingFloorDetail(data.assetId, data.floorId, data.subFloorId);
    if (existing) return { success: true, data: existing };
    return { success: false, error: res.error ?? 'Failed to save floor detail' };
  } catch (err: any) {
    logger.error('saveFloorDetail Error:', { error: err });
    return { success: false, error: 'Network error saving floor detail' };
  }
}

export async function updateFloorDetail(
  id: number,
  data: Partial<FloorDetailApiRequest> & { roomDetails?: any[] | null }
): Promise<ActionResult<FloorDetailApiResponse>> {
  try {
    const getRes = await floorDetailsService.getFloorById(id);
    if (!getRes.success || !getRes.data) {
      return { success: false, error: getRes.error ?? 'Failed to fetch floor detail' };
    }
    const res = await floorDetailsService.updateFloor(id, {
      ...getRes.data,
      ...data,
    });
    if (res.success && res.data) {
      const body = res.data as any;
      if (body.success === false) {
        return { success: false, error: body.message || 'Failed to update floor detail' };
      }
      return { success: true, data: body.items || body.data || body };
    }
    return { success: false, error: res.error ?? 'Failed to update floor detail' };
  } catch (err: any) {
    logger.error('updateFloorDetail Error:', { error: err });
    return { success: false, error: 'Network error updating floor detail' };
  }
}

export async function deleteFloorDetail(id: number): Promise<ActionResult<void>> {
  try {
    const getRes = await floorDetailsService.getFloorById(id);
    if (!getRes.success || !getRes.data) {
      return { success: false, error: getRes.error ?? 'Failed to fetch floor detail for deletion' };
    }

    const res = await floorDetailsService.updateFloor(id, {
      ...getRes.data,
      markedForDeletion: true,
      markedForDeletionDate: new Date().toISOString(),
      isActive: false,
    });
    return res.success
      ? { success: true }
      : { success: false, error: res.error ?? 'Failed to delete floor detail' };
  } catch (err: any) {
    logger.error('deleteFloorDetail Error:', { error: err });
    return { success: false, error: 'Network error deleting floor detail' };
  }
}
