'use server';

import type {
  WaterConnectionFormModel,
  WaterConnectionPageData,
  WaterConnectionTypeLookup,
  WaterConnectionSizeLookup,
  WaterConnectionStatusLookup,
  WaterRateMasterLookup,
  PropertyInfo,
} from '@/types/water-connection.types';
import {
  getWaterConnectionsPaged,
  getAllWaterConnections,
  getWaterConnectionTypes,
  getWaterConnectionSizes,
  getWaterConnectionStatuses,
  getWaterRateMasters,
  createWaterConnection,
  updateWaterConnection,
  deleteWaterConnection,
  ApiError,
} from '@/lib/api/waterconnection.services';
import { getPropertyBasicDetails } from '@/lib/api/ptis/propertybasicdetails/property-basic-details.service';
import { getPropertyKycById } from '@/lib/api/property-kyc.service';

/** Lightweight action — fetches ONLY the paged connections list.
 *  Use this for client-side page/pageSize changes to avoid re-fetching
 *  property details and lookup data on every pagination event.
 */
export async function getWaterConnectionsOnlyAction(
  propertyId: number,
  pageNumber: number,
  pageSize: number
): Promise<{
  connections: import('@/types/water-connection.types').WaterConnection[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}> {
  const response = await getWaterConnectionsPaged(propertyId, pageNumber, pageSize);
  return {
    connections: response.items ?? response.data ?? [],
    totalCount: response.totalCount,
    totalPages: response.totalPages,
    pageNumber: response.pageNumber,
    pageSize: response.pageSize,
  };
}

/** Fetch ALL connections for a property (unpaged) for stats calculation */
export async function getAllWaterConnectionsAction(
  propertyId: number
): Promise<import('@/types/water-connection.types').WaterConnection[]> {
  return getAllWaterConnections(propertyId);
}

export async function getWaterConnectionPageData(
  propertyId: number,
  pageNumber: number,
  pageSize: number
): Promise<WaterConnectionPageData> {
  const [
    connectionsResponse,
    typeOptions,
    sizeOptions,
    statusOptions,
    rateMastersFromApi,
    basicDetails,
    kycResponse,
  ] = await Promise.all([
    getWaterConnectionsPaged(propertyId, pageNumber, pageSize),
    getWaterConnectionTypes().catch(
      () => [] as Awaited<ReturnType<typeof getWaterConnectionTypes>>
    ),
    getWaterConnectionSizes().catch(
      () => [] as Awaited<ReturnType<typeof getWaterConnectionSizes>>
    ),
    getWaterConnectionStatuses().catch(
      () => [] as Awaited<ReturnType<typeof getWaterConnectionStatuses>>
    ),
    getWaterRateMasters().catch(() => [] as WaterRateMasterLookup[]),
    getPropertyBasicDetails(propertyId).catch(() => null),
    getPropertyKycById(propertyId).catch(() => null),
  ]);

  const kyc = kycResponse?.items ?? null;
  const property: PropertyInfo = {
    id: propertyId,
    propertyNo: basicDetails?.propertyNo ?? `PROP-${propertyId}`,
    ownerName: kyc?.ownerName ?? '—',
    customerId: `CID-${propertyId}`,
    customerType: 'Individual',
    contact: kyc?.mobileNo ?? '—',
    email: kyc?.emailId ?? '—',
    address: kyc?.address ?? '—',
    zone: basicDetails?.division || basicDetails?.taxZoneNo || '—',
    ward: basicDetails?.wardNo ?? '—',
    buildingType: basicDetails?.categoryName ?? '—',
  };

  return {
    property,
    connections: connectionsResponse.items ?? connectionsResponse.data ?? [],
    totalCount: connectionsResponse.totalCount,
    totalPages: connectionsResponse.totalPages,
    pageNumber: connectionsResponse.pageNumber,
    pageSize: connectionsResponse.pageSize,
    typeOptions: typeOptions.length > 0 ? typeOptions : [],
    sizeOptions: sizeOptions.length > 0 ? sizeOptions : [],
    statusOptions: statusOptions.length > 0 ? statusOptions : [],
    rateMasters: rateMastersFromApi.length > 0 ? rateMastersFromApi : [],
  };
}

export async function getConnectionLookupsAction(): Promise<{
  typeOptions: WaterConnectionTypeLookup[];
  sizeOptions: WaterConnectionSizeLookup[];
  statusOptions: WaterConnectionStatusLookup[];
  rateMasters: WaterRateMasterLookup[];
}> {
  const [typeOptions, sizeOptions, statusOptions, rateMastersFromApi] = await Promise.all([
    getWaterConnectionTypes().catch(() => [] as WaterConnectionTypeLookup[]),
    getWaterConnectionSizes().catch(() => [] as WaterConnectionSizeLookup[]),
    getWaterConnectionStatuses().catch(() => [] as WaterConnectionStatusLookup[]),
    getWaterRateMasters().catch(() => [] as WaterRateMasterLookup[]),
  ]);

  return {
    typeOptions,
    sizeOptions,
    statusOptions,
    rateMasters: rateMastersFromApi,
  };
}

export async function getWaterRateMastersAction(): Promise<WaterRateMasterLookup[]> {
  return getWaterRateMasters().catch(() => [] as WaterRateMasterLookup[]);
}

export async function saveWaterConnectionAction(
  data: WaterConnectionFormModel
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (data.id != null) {
      await updateWaterConnection(data.id, data);
    } else {
      await createWaterConnection(data);
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof ApiError ? e.message : 'Save failed',
    };
  }
}

export async function deleteWaterConnectionAction(
  id: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    await deleteWaterConnection(id);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof ApiError ? e.message : 'Delete failed',
    };
  }
}
