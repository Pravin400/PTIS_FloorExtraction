/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { manageSubUnitsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/manage-subunits.service';
import { logger } from '@/lib/utils/logger';
import { CreateChildAssetRequest, CreateChildAssetResponse } from '@/types/asset/floor-details.types';
import { ActionResult } from '@/types/common.types';
import { cookies } from 'next/headers';
import { buildChildAssetPayload } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/child-asset-payload-builder.utils';
import { createSubunitDetailFetcher } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/child-asset-subunit-detail-fetcher.utils';
import { } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/child-asset-renter-id-resolver.utils';
import { } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/child-asset-renter-registration.utils';
import { syncRoomOffsets } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/child-asset-room-offset-sync.utils';

/**
 * Persists a child asset via /ManageSubUnits/create, then handles the renter/lease
 * registration side-effects and room-wise offset (minus-data) sync that the create endpoint
 * itself does not perform. Returns the final ActionResult for createChildAssetAction.
 */
async function persistChildAsset(
  data: CreateChildAssetRequest,
  formDataPayload: FormData,
  _userId: number | undefined
): Promise<ActionResult<CreateChildAssetResponse>> {
  logger.info('createChildAssetAction: Calling manageSubUnitsService.create with FormData payload');
  const res = await manageSubUnitsService.create(formDataPayload as any);
  logger.info('createChildAssetAction: API response', { response: res });

  if (!res.success || !res.data) {
    const rawError = String(res.error || res.message || 'Failed to save child asset');
    const isDuplicateMpms = /mpms|ux_assetdetails_mpmsno|duplicate key.*mpms/i.test(rawError);

    if (isDuplicateMpms) {
      let mpmsVal = data.mpmsNo || (data as any).MpmsNo || (data as any).MPMSNo || (data as any).details?.mpmsNo || (data as any).details?.MpmsNo || '';
      if (!mpmsVal) {
        const match = rawError.match(/duplicate key value is \(([^)]+)\)/i);
        if (match && match[1]) {
          mpmsVal = match[1];
        }
      }
      return {
        success: false,
        error: `Don't Enter Duplicate MPMSNo "${mpmsVal}" (A record with the same details already exists.)`,
      };
    }

    const errorDetails =
      (res.message && res.message !== 'undefined'
        ? res.message + (res.error && res.error !== res.message ? ` (${res.error})` : '')
        : (res.error || 'Failed to save child asset')) +
      (res.statusCode ? ` [Status: ${res.statusCode}]` : '');
    return { success: false, error: errorDetails };
  }

  const createdAssetId =
    res.data.assetId ??
    (res.data as any).id ??
    (res.data as any).Id ??
    (res.data as any).AssetId ??
    (res.data as any).assetID;
  const subUnitsDetailsIdVal =
    (res.data as any).subUnitsDetailsId ??
    (res.data as any).SubUnitsDetailsId ??
    (res.data as any).id ??
    (res.data as any).Id ??
    null;
  const roomWiseSubmissionDetailId =
    (res.data as any).roomWiseSubmissionDetailId ||
    (res.data as any).RoomWiseSubmissionDetailId ||
    (res.data as any).roomWiseSubmissionDetailsId ||
    (res.data as any).RoomWiseSubmissionDetailsId ||
    subUnitsDetailsIdVal;

  if (createdAssetId) {
    const getSubunitDetail = createSubunitDetailFetcher(createdAssetId);

    // The backend's CreateChildAssetAsync (POST /ManageSubUnits/create) already handles
    // lease/rent record updates/deletes internally in Step 3 of its transaction.
    // Calling here would cause a double-update which triggers a
    // unique-constraint conflict: "A record with the same details already exists."
    //
    // is only needed for legacy flows where the backend did NOT
    // handle lease records. Since CreateChildAssetAsync always has assetId > 0 (the
    // asset is pre-allocated by bulkGenerate before this call), we skip it here.
    //
    // If this is ever used for a true "create from scratch" path (assetId == 0) that
    // reaches this point, uncomment the block below and add an assetId guard.
    //
    // const renterDetailsId = await (res.data, data, createdAssetId, getSubunitDetail);
    // const renterResult = await (data, createdAssetId, renterDetailsId, roomWiseSubmissionDetailId, userId);
    // if (!renterResult.success) { return renterResult; }

    await syncRoomOffsets(data, getSubunitDetail);
  }

  return {
    success: true,
    data: {
      success: true,
      message: res.message || 'Detailed child asset saved successfully',
      assetId: createdAssetId || null,
      assetNo: res.data.unitNo || (res.data as any).assetNo || null,
      roomWiseSubmissionDetailsId: roomWiseSubmissionDetailId,
      subUnitsDetailsId: subUnitsDetailsIdVal,
      errors: [],
    },
  };
}

/**
 * Server action to create a single detailed child asset with room configuration and rent info
 */
export async function createChildAssetAction(
  data: CreateChildAssetRequest
): Promise<ActionResult<CreateChildAssetResponse>> {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    const userId = userIdStr ? Number(userIdStr) : undefined;

    const formDataPayload = await buildChildAssetPayload(data, userId);
    return await persistChildAsset(data, formDataPayload, userId);
  } catch (err: any) {
    logger.error('createChildAssetAction Error:', { error: err });
    return { success: false, error: 'Network error saving detailed child asset: ' + err.message };
  }
}
