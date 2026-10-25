/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { apiClient } from '@/services/api.service';
import { logger } from '@/lib/utils/logger';
import { CreateChildAssetRequest } from '@/types/asset/floor-details.types';

/**
 * Resolves the AssetLeaseRentDetails row id for the just-created child asset,
 * trying (in order): the create response itself, the fetched subunit detail,
 * then a direct /AssetLeaseRentDetails query by assetId. Returns undefined if
 * no renter input was provided at all (no resolution attempted).
 */
export async function resolveRenterDetailsId(
  createResponseData: any,
  data: CreateChildAssetRequest,
  createdAssetId: number,
  getSubunitDetail: () => Promise<any>
): Promise<number | undefined> {
  const rentInfo = data.rentInformation;
  const hasRenterInput = !!(data.renterName || rentInfo?.leaseRentType);
  let renterDetailsId = createResponseData.renterDetailsId || createResponseData.renterDetails?.id;
  logger.info('createChildAssetAction: Initial renterDetailsId from create response:', {
    renterDetailsId,
    data: createResponseData,
  });

  if (!renterDetailsId && hasRenterInput) {
    try {
      const detail = await getSubunitDetail();
      if (detail) {
        renterDetailsId =
          detail.renterDetailsId ||
          detail.renterDetails?.id ||
          (Array.isArray(detail.renterDetails) && detail.renterDetails[0]?.id) ||
          (detail.renterDetailsList && detail.renterDetailsList[0]?.id);
        logger.info(
          'createChildAssetAction: Resolved renterDetailsId from fetched details:',
          { renterDetailsId }
        );
      }
    } catch (getErr: any) {
      logger.error('Failed to fetch subunit details to resolve renterDetailsId:', {
        error: getErr as Error,
      });
    }
  }

  // Fallback: Query /AssetLeaseRentDetails by assetId if renterDetailsId is not found
  if (!renterDetailsId && hasRenterInput) {
    try {
      logger.info(
        'createChildAssetAction: Querying /AssetLeaseRentDetails for assetId ' + createdAssetId
      );
      const listRes = await apiClient.get<any>(`/AssetLeaseRentDetails?AssetId=${createdAssetId}`);
      if (listRes.success && listRes.data) {
        const items =
          listRes.data.items ||
          listRes.data.data ||
          (Array.isArray(listRes.data) ? listRes.data : []);
        if (items.length > 0) {
          renterDetailsId = items[0].id;
          logger.info(
            'createChildAssetAction: Resolved renterDetailsId from lease list query:',
            { renterDetailsId }
          );
        }
      }
    } catch (listErr: any) {
      logger.error('Failed to query /AssetLeaseRentDetails to resolve renterDetailsId:', {
        error: listErr as Error,
      });
    }
  }

  return renterDetailsId;
}
