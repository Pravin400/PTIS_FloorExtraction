 

import 'server-only';
import { apiClient } from '@/services/api.service';
import type { PagedResponse } from '@/types/common.types';
import type {
  AssetLeaseRentDetailsListItem,
  AssetLeaseRentDetailsListParams,
  AssetLeaseRentDetailsUpdatePayload,
  AssetLeaseRentDetailsMutationResponse,
  PreviousTenantHistoryItem,
  CreateAssetLeaseRentDetailsPayload,
} from '@/types/asset-types/lease-rent.types';


function buildAssetLeaseRentDetailsQuery(params: AssetLeaseRentDetailsListParams = {}): string {
  const query = new URLSearchParams();

  query.set('PageNumber', String(params.pageNumber ?? 1));
  query.set('PageSize', String(params.pageSize ?? 10));
  query.set('IsActive', String(params.isActive ?? true));

  if (params.searchTerm?.trim()) query.set('SearchTerm', params.searchTerm.trim());
  if (params.workflowStatus?.trim()) query.set('WorkflowStatus', params.workflowStatus.trim());
  if (params.paymentStatus?.trim()) query.set('PaymentStatus', params.paymentStatus.trim());
  if (params.assetCategoryId != null) query.set('AssetCategoryId', String(params.assetCategoryId));
  if (params.assetTypeId != null) query.set('AssetTypeId', String(params.assetTypeId));
  if (params.zoneId != null) query.set('ZoneId', String(params.zoneId));
  if (params.wardId != null) query.set('WardId', String(params.wardId));
  if (params.assetId != null) query.set('AssetId', String(params.assetId));
  if (params.parentAssetId != null) query.set('ParentAssetId', String(params.parentAssetId));
  if (params.fromDate?.trim()) query.set('FromDate', params.fromDate.trim());
  if (params.toDate?.trim()) query.set('ToDate', params.toDate.trim());

  return query.toString();
}

export async function getAssetLeaseRentDetailsList(
  params: AssetLeaseRentDetailsListParams = {}
): Promise<PagedResponse<AssetLeaseRentDetailsListItem>> {
  const query = buildAssetLeaseRentDetailsQuery(params);
  const response = await apiClient.get<PagedResponse<AssetLeaseRentDetailsListItem>>(
    query ? `/AssetLeaseRentDetails?${query}` : '/AssetLeaseRentDetails'
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch asset lease rent details');
  }

  return response.data;
}

export async function getAssetLeaseRentDetailsById(
  id: number
): Promise<AssetLeaseRentDetailsListItem | null> {
  const response = await apiClient.get<AssetLeaseRentDetailsListItem>(`/AssetLeaseRentDetails/${encodeURIComponent(String(id))}`);

  if (!response.success || !response.data) {
    return null;
  }

  return response.data;
}

export async function updateAssetLeaseRentDetails(
  id: number,
  payload: AssetLeaseRentDetailsUpdatePayload
): Promise<AssetLeaseRentDetailsMutationResponse> {
  const response = await apiClient.put<AssetLeaseRentDetailsMutationResponse>(
    `/AssetLeaseRentDetails/${encodeURIComponent(String(id))}`,
    payload
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to update asset lease rent details',
      items: null,
      errors: response.error ? [response.error] : null,
      correlationId: null,
    };
  }

  return response.data;
}

export async function sendToVerification(
  id: number,
  remarks?: string
): Promise<AssetLeaseRentDetailsMutationResponse> {
  const response = await apiClient.post<AssetLeaseRentDetailsMutationResponse>(
    `/AssetLeaseRentDetails/${encodeURIComponent(String(id))}/send-to-verification`,
    { remarks }
  );
  return response.success && response.data
    ? response.data
    : { success: false, message: response.error || 'Failed to send to verification', items: null, errors: null, correlationId: null };
}

export async function sendForVerification(
  id: number,
  payload: AssetLeaseRentDetailsUpdatePayload
): Promise<AssetLeaseRentDetailsMutationResponse> {
  const response = await apiClient.put<AssetLeaseRentDetailsMutationResponse>(
    `/AssetLeaseRentDetails/${encodeURIComponent(String(id))}/send-for-verification`,
    payload
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to send for verification',
      items: null,
      errors: response.error ? [response.error] : null,
      correlationId: null,
    };
  }

  return response.data;
}

export async function verifyLeaseRent(
  id: number,
  remarks?: string
): Promise<AssetLeaseRentDetailsMutationResponse> {
  const response = await apiClient.post<AssetLeaseRentDetailsMutationResponse>(
    `/AssetLeaseRentDetails/${encodeURIComponent(String(id))}/verify`,
    { remarks }
  );
  return response.success && response.data
    ? response.data
    : { success: false, message: response.error || 'Failed to verify lease rent', items: null, errors: null, correlationId: null };
}

export async function approveLeaseRent(
  id: number,
  remarks?: string
): Promise<AssetLeaseRentDetailsMutationResponse> {
  const response = await apiClient.post<AssetLeaseRentDetailsMutationResponse>(
    `/AssetLeaseRentDetails/${encodeURIComponent(String(id))}/approve`,
    { remarks }
  );
  return response.success && response.data
    ? response.data
    : { success: false, message: response.error || 'Failed to approve lease rent', items: null, errors: null, correlationId: null };
}

export async function rejectLeaseRent(
  id: number,
  reason: string
): Promise<AssetLeaseRentDetailsMutationResponse> {
  const response = await apiClient.post<AssetLeaseRentDetailsMutationResponse>(
    `/AssetLeaseRentDetails/${encodeURIComponent(String(id))}/reject`,
    { reason }
  );
  return response.success && response.data
    ? response.data
    : { success: false, message: response.error || 'Failed to reject lease rent', items: null, errors: null, correlationId: null };
}

export async function revertToRegistration(
  id: number,
  remarks?: string
): Promise<AssetLeaseRentDetailsMutationResponse> {
  const response = await apiClient.post<AssetLeaseRentDetailsMutationResponse>(
    `/AssetLeaseRentDetails/${encodeURIComponent(String(id))}/revert-to-registration`,
    { remarks }
  );
  return response.success && response.data
    ? response.data
    : { success: false, message: response.error || 'Failed to revert to registration', items: null, errors: null, correlationId: null };
}

export async function revertToVerification(
  id: number,
  remarks?: string
): Promise<AssetLeaseRentDetailsMutationResponse> {
  const response = await apiClient.post<AssetLeaseRentDetailsMutationResponse>(
    `/AssetLeaseRentDetails/${encodeURIComponent(String(id))}/revert-to-verification`,
    { remarks }
  );
  return response.success && response.data
    ? response.data
    : { success: false, message: response.error || 'Failed to revert to verification', items: null, errors: null, correlationId: null };
}



export async function getPreviousTenantHistory(
  id: number
): Promise<PreviousTenantHistoryItem[]> {
  const response = await apiClient.get<{ items: PreviousTenantHistoryItem[] }>(
    `/AssetLeaseRentDetails/${encodeURIComponent(String(id))}/previous-tenant-history`
  );
  return response.success && response.data?.items ? response.data.items : [];
}



export async function createAssetLeaseRentDetails(
  payload: CreateAssetLeaseRentDetailsPayload
): Promise<AssetLeaseRentDetailsMutationResponse> {
  const response = await apiClient.post<AssetLeaseRentDetailsMutationResponse>(
    '/AssetLeaseRentDetails',
    payload
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to create asset lease rent details',
      items: null,
      errors: response.error ? [response.error] : null,
      correlationId: null,
    };
  }

  return response.data;
}
