/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { assetRoomWiseMinusDataService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-room-wise-minus-data.service';
import { logger } from '@/lib/utils/logger';
import { CreateChildAssetRequest } from '@/types/asset/floor-details.types';

export async function deleteExistingRoomOffsets(roomWiseSubmissionId: number) {
  try {
    const existingMinusRes = await assetRoomWiseMinusDataService.getAll(roomWiseSubmissionId);
    if (!existingMinusRes.success || !existingMinusRes.data) return;

    // Handle both flat-array and PagedResult shapes
    let existingItems: any[];
    if (Array.isArray(existingMinusRes.data)) {
      existingItems = existingMinusRes.data;
    } else {
      const paged = existingMinusRes.data as any;
      existingItems = Array.isArray(paged.items)
        ? paged.items
        : Array.isArray(paged.data)
          ? paged.data
          : [];
    }
    const filtered = existingItems.filter((item: any) => {
      const rId = item.roomWiseSubmissionId ?? item.RoomWiseSubmissionId;
      return rId !== undefined && Number(rId) === Number(roomWiseSubmissionId);
    });

    const deletePromises = filtered.map((existing: any) => {
      const existingId = existing.id ?? existing.Id;
      if (existingId) {
        return assetRoomWiseMinusDataService
          .delete(Number(existingId))
          .then(() =>
            logger.info(
              `createChildAssetAction: Deleted existing offset ID ${existingId} for room ${roomWiseSubmissionId}`
            )
          );
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
  } catch (delErr: any) {
    logger.warn(
      `createChildAssetAction: Could not clean existing offsets for room ${roomWiseSubmissionId}:`,
      { error: delErr }
    );
  }
}

export async function insertRoomOffsets(roomWiseSubmissionId: number, offsets: any[], roomNo: any) {
  logger.info(
    `createChildAssetAction: Saving ${offsets.length} offsets for roomNo ${roomNo} (submissionId ${roomWiseSubmissionId}).`
  );
  const savePromises = offsets.map((offset: any) => {
    const offsetPayload = {
      roomWiseSubmissionId: roomWiseSubmissionId,
      lengthMtr:
        offset.length ||
        (offset.shape === 'Circle' || offset.shape === 'Semi Circle' || offset.shape === 'Quarter'
          ? offset.radius
          : 0),
      widthMtr: offset.width || 0,
      areaSqMtr: offset.areaSqM || 0,
      heightMtr: offset.height || 0,
      base1Mtr: offset.base1 || 0,
      base2Mtr: offset.base2 || 0,
      shape: offset.shape || 'Rectangle',
      isActive: true,
    };
    logger.info('createChildAssetAction: Saving offset to /AssetRoomWiseMinusData', { offsetPayload });
    return assetRoomWiseMinusDataService.create(offsetPayload);
  });
  const offsetResults = await Promise.all(savePromises);
  logger.info('createChildAssetAction: Offset save responses:', { count: offsetResults.length });
}

/**
 * Resolves each input room to its DB roomWiseSubmissionId (by roomNo match),
 * then re-syncs its offset (minus-data) rows: deletes existing rows first to
 * avoid duplicate accumulation across multiple "Save & Next" calls, then
 * re-inserts the current offsets.
 */
export async function syncRoomOffsets(
  _data: CreateChildAssetRequest,
  _getSubunitDetail: () => Promise<any>
): Promise<void> {
  // Offsets are already natively persisted by ManageSubUnitsService in C# backend when roomDetails
  // with offsets array is passed in the payload. Running a secondary client-side sync pass
  // causes soft-deletion of the backend-created offset row and re-insertion of a duplicate row.
  return;
}
