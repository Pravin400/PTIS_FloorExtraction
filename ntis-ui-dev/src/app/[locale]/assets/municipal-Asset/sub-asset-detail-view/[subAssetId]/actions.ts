'use server';

import { subAssetDetailNewService } from '@/lib/api/asset/municipal-Asset/sub-asset-detail.service';

export async function fetchSubAssetDetailNewData(subAssetId: number) {
  try {
    const dataRes = await subAssetDetailNewService.fetchSubAssetDetails(subAssetId);
    return dataRes;
  } catch (_error) {
    return { success: false, data: null };
  }
}

export async function fetchCollectionHistoryData(subAssetId: number) {
  try {
    const dataRes = await subAssetDetailNewService.fetchCollectionHistory(subAssetId);
    return dataRes;
  } catch (_error) {
    return { success: false, data: [] };
  }
}
