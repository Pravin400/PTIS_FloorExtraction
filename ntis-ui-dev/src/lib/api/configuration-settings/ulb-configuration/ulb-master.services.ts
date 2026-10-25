import { apiClient } from '@/services/api.service';
import type { PagedResponse } from '@/types/common.types';
import type {
  ULBConfigurationFormData,
  UlbConfigurationMaster,
  UlbImageMasterDto,
  UlbMasterMutationResponse,
} from '@/types/ulbconfig-master.types';
import { ApiError } from '@/lib/utils/api';
import {
  ULB_MASTER_DEFAULT_PAGE_SIZE,
  ULB_MASTER_ENDPOINT,
} from './ulb-master.constants';
import { mapFormDataToUlbMasterPayload } from './ulb-master.mapper';
import { normalizeUlbMaster, parseUlbMasterMutationResponse } from './ulb-master-types-guard';

import { getAppConfig } from '@/config/app.config';
import { serverFetch } from '@/lib/utils/server-fetch';

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

function buildUlbMasterQuery(pageNumber: number, pageSize: number): string {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });

  return `${ULB_MASTER_ENDPOINT}?${params.toString()}`;
}

function normalizePagedUlbMasters(
  paged: PagedResponse<Record<string, unknown>>
): PagedResponse<UlbConfigurationMaster> {
  const items = (paged.items ?? [])
    .map((item) => normalizeUlbMaster(item))
    .filter((item): item is UlbConfigurationMaster => item !== null);

  return {
    ...paged,
    items,
    totalCount: paged.totalCount ?? items.length,
  };
}

// ---------------------------------------------------------------------------
// ULB Master — GET
// ---------------------------------------------------------------------------

/** GET `/ULBMaster` — paginated ULB master records. */
export async function getUlbMastersPaged(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<UlbConfigurationMaster>> {
  const response = await apiClient.get<PagedResponse<Record<string, unknown>>>(
    buildUlbMasterQuery(pageNumber, pageSize)
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch ULB master records',
      'Get ULB masters failed'
    );
  }

  if (!response.data) {
    throw new ApiError(500, 'No data received from server', 'Get ULB masters — invalid response');
  }

  return normalizePagedUlbMasters(response.data);
}

/** GET `/ULBMaster/{id}` — single ULB master record. */
export async function getUlbMasterById(id: number): Promise<UlbConfigurationMaster> {
  const response = await apiClient.get<Record<string, unknown>>(
    `${ULB_MASTER_ENDPOINT}/${id}`
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch ULB master',
      `Get ULB master ${id} failed`
    );
  }

  if (!response.data) {
    throw new ApiError(
      500,
      'No data received from server',
      `Get ULB master ${id} — invalid response`
    );
  }

  const normalized = normalizeUlbMaster(response.data);
  if (!normalized) {
    throw new ApiError(500, 'Invalid ULB master response', `Get ULB master ${id} — invalid shape`);
  }

  return normalized;
}

/** Returns the first ULB master record for the configuration screen. */
export async function getUlbMaster(): Promise<UlbConfigurationMaster | null> {
  const paged = await getUlbMastersPaged(1, ULB_MASTER_DEFAULT_PAGE_SIZE);
  return paged.items[0] ?? null;
}

// ---------------------------------------------------------------------------
// ULB Master — POST / PUT
// ---------------------------------------------------------------------------

/** POST `/ULBMaster` — create ULB master configuration. */
export async function createUlbMaster(
  formData: ULBConfigurationFormData
): Promise<{ ulb: UlbConfigurationMaster; message: string }> {
  const payload = mapFormDataToUlbMasterPayload(formData);

  const response = await apiClient.post<UlbMasterMutationResponse>(ULB_MASTER_ENDPOINT, payload);

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to create ULB master',
      'Create ULB master failed'
    );
  }

  return parseUlbMasterMutationResponse(response.data, 'Failed to create ULB master');
}

/** PUT `/ULBMaster/{id}` — update ULB master configuration. */
export async function updateUlbMaster(
  id: number,
  formData: ULBConfigurationFormData
): Promise<{ ulb: UlbConfigurationMaster; message: string }> {
  const payload = mapFormDataToUlbMasterPayload(formData, id);

  const response = await apiClient.put<UlbMasterMutationResponse>(
    `${ULB_MASTER_ENDPOINT}/${id}`,
    payload
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to update ULB master',
      `Update ULB master ${id} failed`
    );
  }

  return parseUlbMasterMutationResponse(response.data, 'Failed to update ULB master');
}


/** GET `/UlbImageMaster` — paginated ULB image master records. */
export async function getUlbImages(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<UlbImageMasterDto>> {
  const response = await apiClient.get<PagedResponse<UlbImageMasterDto>>(
    `/UlbImageMaster?PageNumber=${pageNumber}&PageSize=${pageSize}`
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch ULB images',
      'Get ULB images failed'
    );
  }

  if (!response.data) {
    throw new ApiError(500, 'No data received from server', 'Get ULB images — invalid response');
  }

  return response.data;
}

/** DELETE `/UlbImageMaster/{id}/purge` — permanently delete (purge) image by its ID. */
export async function deleteUlbImage(id: number): Promise<void> {
  const response = await apiClient.delete<void>(`/UlbImageMaster/${id}/purge`);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to delete ULB image',
      `Delete ULB image ${id} failed`
    );
  }
}

/** PUT `/UlbImageMaster/{id}` — update image type / details. */
export async function updateUlbImageType(
  id: number,
  imageType: string,
  imageId: number
): Promise<void> {
  const payload = {
    id,
    imageType,
    imageId,
  };

  const response = await apiClient.put<unknown>(`/UlbImageMaster/${id}`, payload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to update ULB image type',
      `Update ULB image type ${id} failed`
    );
  }
}

/** GET `/UlbImageMaster/{documentGuid}/view` — fetch document/image stream */
export async function getUlbImageView(
  documentGuid: string
): Promise<{ base64: string; contentType: string }> {
  const config = getAppConfig();
  const baseUrl = config.api.baseUrl?.trim();
  if (!baseUrl) {
    throw new Error('Backend API base URL is not configured');
  }

  let cleanBase = baseUrl.replace(/\/+$/, '');
  if (cleanBase.endsWith('/api')) {
    cleanBase = cleanBase.substring(0, cleanBase.length - 4);
  }
  const finalRoot = cleanBase.endsWith('/') ? cleanBase : `${cleanBase}/`;
  const url = `${finalRoot}api/UlbImageMaster/${encodeURIComponent(documentGuid)}/view`;

  const headers: Record<string, string> = {
    Accept: '*/*',
  };

  // We deliberately do NOT send the Authorization Bearer token here.
  // ULB Master images (Logo, Background) are public branding assets.
  // If we send a token belonging to another user/tenant, the .NET backend might 
  // reject it due to strict ownership checks. By omitting the token, we utilize 
  // the public anonymous access path (the same one the Login screen uses).

  const response = await serverFetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Failed to fetch ULB image view: ${response.statusText}`,
      'Get ULB image view failed'
    );
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return { base64, contentType };
}

/** POST `/UlbImageMaster` — create ULB image master record. */
export async function createUlbImageMaster(
  imageType: string,
  imageId: number
): Promise<UlbImageMasterDto> {
  const payload = {
    imageType,
    imageId,
    isActive: true,
  };

  const response = await apiClient.post<UlbImageMasterDto>('/UlbImageMaster', payload);

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to create ULB image master record',
      'Create ULB image master failed'
    );
  }

  return response.data;
}
