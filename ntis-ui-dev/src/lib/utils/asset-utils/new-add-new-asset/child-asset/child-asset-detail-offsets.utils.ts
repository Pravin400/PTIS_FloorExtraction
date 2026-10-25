/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { assetRoomWiseMinusDataService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-room-wise-minus-data.service';
import { logger } from '@/lib/utils/logger';
import { mapOffsetShape } from '../floor-details/floor-offset-normalizer.utils';

function filterMinusDataForRoom(items: any[], roomWiseSubmissionId: any) {
  return items.filter((item: any) => {
    const rId = item.roomWiseSubmissionId ?? item.RoomWiseSubmissionId;
    const isDeleted = item.markedForDeletion === true || item.MarkedForDeletion === true;
    return rId !== undefined && Number(rId) === Number(roomWiseSubmissionId) && !isDeleted;
  });
}

async function resolveRoomOffsets(
  room: any,
  roomWiseSubmissionId: any,
  preFetchedMinusData?: any[]
) {
  // If offsets are already embedded in the room data (from ManageSubUnits response),
  // normalise them and skip the separate API call.
  const rawOffsets = room.offsets ?? room.Offsets;
  if (Array.isArray(rawOffsets) && rawOffsets.length > 0) {
    const activeOffsets = rawOffsets.filter(
      (off: any) => off.markedForDeletion !== true && off.MarkedForDeletion !== true
    );
    room.offsets = activeOffsets.map(mapOffsetShape);
    return;
  }

  // Fallback: fetch offsets from AssetRoomWiseMinusData API or resolve from preFetchedMinusData in-memory
  try {
    if (preFetchedMinusData) {
      room.offsets = filterMinusDataForRoom(preFetchedMinusData, roomWiseSubmissionId).map(mapOffsetShape);
      return;
    }

    const minusRes = await assetRoomWiseMinusDataService.getAll(roomWiseSubmissionId);
    if (minusRes.success && minusRes.data) {
      // The service's unwrapResponse already extracts body?.items
      // so minusRes.data may be:
      //   a) AssetRoomWiseMinusDataDto[]  — already the flat array
      //   b) PagedResult object { items: [], totalCount, ... }
      let rawItems: any[];
      if (Array.isArray(minusRes.data)) {
        rawItems = minusRes.data;
      } else {
        const paged = minusRes.data as any;
        rawItems = Array.isArray(paged.items)
          ? paged.items
          : Array.isArray(paged.data)
            ? paged.data
            : [];
      }
      room.offsets = filterMinusDataForRoom(rawItems, roomWiseSubmissionId).map(mapOffsetShape);
    } else {
      room.offsets = [];
    }
  } catch (err: any) {
    logger.error(`Failed to load offsets for room ${roomWiseSubmissionId}:`, { error: err });
    room.offsets = [];
  }
}

/**
 * Loads room-wise offset (minus) data from AssetRoomWiseMinusData for every
 * room on the detail (Endpoint: GET /AssetRoomWiseMinusData?RoomWiseSubmissionId={room.id}
 * — room.id is the roomWiseDetails row id which IS the RoomWiseSubmissionId).
 * The API may return rooms under 'roomWiseDetails', 'roomDetails', or
 * 'roomWiseSubmissions' — normalised to expose both keys for consumers.
 */
export async function resolveChildAssetRoomOffsets(detail: any, preFetchedMinusData?: any[]) {
  const roomWiseDetails = Array.isArray(detail.roomWiseDetails)
    ? detail.roomWiseDetails
    : Array.isArray(detail.roomDetails)
      ? detail.roomDetails
      : Array.isArray(detail.roomWiseSubmissions)
        ? detail.roomWiseSubmissions
        : [];

  if (roomWiseDetails.length === 0) return;

  // Normalise: always expose as both roomWiseDetails AND roomDetails for UnitPoolPanel
  detail.roomWiseDetails = roomWiseDetails;
  detail.roomDetails = roomWiseDetails;

  for (const room of roomWiseDetails) {
    const roomWiseSubmissionId = room.id ?? room.Id;
    if (!roomWiseSubmissionId) continue;
    await resolveRoomOffsets(room, roomWiseSubmissionId, preFetchedMinusData);
  }
}
