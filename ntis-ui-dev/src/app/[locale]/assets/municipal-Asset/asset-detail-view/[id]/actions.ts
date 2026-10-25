'use server';

/**
 * Fetch detailed asset data for the Asset Detail New page.
 */
export async function fetchAssetDetailData(assetId: number) {
  try {
    const { assetDetailService } = await import('@/lib/api/asset/municipal-Asset/asset-detail.service');
    const dataRes = await assetDetailService.fetchFloorAndUnitDetails(assetId);
    if (dataRes?.success && dataRes.data) {
      return { success: true as const, data: dataRes.data };
    }
    return { success: false as const, error: "Failed to fetch asset detail data", data: null };
  } catch (err: unknown) {
    console.error("fetchAssetDetailData failed:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch asset details";
    return { success: false as const, error: message, data: null };
  }
}
