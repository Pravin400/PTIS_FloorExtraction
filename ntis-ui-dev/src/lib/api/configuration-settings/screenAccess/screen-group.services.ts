import { apiClient } from '@/services/api.service';
import type { ScreenGroupMasterData } from '@/types/screen-access.types';
import type { PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { DEFAULT_GROUP_ICON } from '@/lib/constants/screen-access.constants';
import { parseBoolean } from '@/lib/utils/type-guards';

export function normalizeScreenGroup(data: Record<string, unknown>): ScreenGroupMasterData {
  const id = Number(
    data.screenGroupId ??
      data.ScreenGroupId ??
      data.groupId ??
      data.GroupId ??
      data.id ??
      data.Id ??
      0
  );

  const groupName = String(
    data.screenGroupName ??
      data.ScreenGroupName ??
      data.groupName ??
      data.GroupName ??
      data.name ??
      ''
  );
  const groupLocalName = String(
    data.screenGroupLocalName ??
      data.ScreenGroupLocalName ??
      data.screenGroupNameLocal ??
      data.ScreenGroupNameLocal ??
      data.groupLocalName ??
      data.GroupLocalName ??
      data.localName ??
      data.LocalName ??
      ''
  );

  const isGarbled = (str: string) => !str || /\?{2,}/.test(str);

  return {
    screenGroupId: id,
    screenGroupName: !isGarbled(groupName)
      ? groupName
      : !isGarbled(groupLocalName)
        ? groupLocalName
        : groupName,
    screenGroupLocalName: groupLocalName || undefined,
    screenGroupCode: String(data.screenGroupCode ?? data.groupCode ?? data.code ?? ''),
    screenGroupIcon: String(data.screenGroupIcon ?? data.icon ?? ''),
    displayOrder: Number(data.displayOrder ?? data.DisplayOrder ?? 0),
    isActive: parseBoolean(data.isActive ?? data.IsActive ?? true),
    description: String(data.description ?? data.Description ?? ''),
    createdDate: data.createdDate != null ? String(data.createdDate) : null,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
    createdBy: data.createdBy != null ? Number(data.createdBy) : null,
    updatedBy: data.updatedBy != null ? Number(data.updatedBy) : null,
  };
}

export async function getScreenGroups(
  params: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    isActive?: boolean;
  } = {}
): Promise<PagedResponse<ScreenGroupMasterData>> {
  const queryParams = new URLSearchParams();
  if (params.pageNumber !== undefined)
    queryParams.append('PageNumber', params.pageNumber.toString());
  if (params.pageSize !== undefined) queryParams.append('PageSize', params.pageSize.toString());
  if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
  if (params.isActive !== undefined) queryParams.append('IsActive', params.isActive.toString());

  const response = await apiClient.get<PagedResponse<unknown>>(
    `/ScreenGroupMaster?${queryParams.toString()}`
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch screen groups',
      'Get screen groups failed'
    );
  }

  if (!response.data) {
    throw new ApiError(500, 'No data received from server', 'Invalid response format');
  }

  const items = (response.data.items ?? []) as Record<string, unknown>[];
  const normalizedItems = items.map(normalizeScreenGroup);

  return { ...response.data, items: normalizedItems };
}

export async function getScreenGroupById(id: number): Promise<ScreenGroupMasterData> {
  const response = await apiClient.get<unknown>(
    `/ScreenGroupMaster/${encodeURIComponent(String(id))}`
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch screen group',
      `Get screen group ${id} failed`
    );
  }

  if (!response.data) {
    throw new ApiError(
      500,
      'Unexpected data format received from server',
      'Data validation failed'
    );
  }

  return normalizeScreenGroup(response.data as Record<string, unknown>);
}

export async function createScreenGroup(
  data: Partial<ScreenGroupMasterData>,
  userId?: number
): Promise<void> {
  const payload = {
    isActive: true,
    screenGroupIcon: DEFAULT_GROUP_ICON,
    ...data,
    screenGroupLocalName: data.screenGroupName || data.screenGroupLocalName,
    ScreenGroupLocalName: data.screenGroupName || data.screenGroupLocalName,
    screenGroupNameLocal: data.screenGroupName || data.screenGroupLocalName,
    ScreenGroupNameLocal: data.screenGroupName || data.screenGroupLocalName,
    groupLocalName: data.screenGroupName || data.screenGroupLocalName,
    displayOrder: Number(data.displayOrder ?? 0),
    createdBy: userId,
  };

  const response = await apiClient.post<unknown>('/ScreenGroupMaster', payload);
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      'screenManagement.groups.messages.createError',
      'Create screen group failed'
    );
  }
}

export async function updateScreenGroup(
  id: number,
  data: Partial<ScreenGroupMasterData>,
  userId?: number
): Promise<void> {
  const payload: Record<string, unknown> = {
    ...data,
    screenGroupId: id,
    screenGroupLocalName: data.screenGroupName || data.screenGroupLocalName,
    ScreenGroupLocalName: data.screenGroupName || data.screenGroupLocalName,
    screenGroupNameLocal: data.screenGroupName || data.screenGroupLocalName,
    ScreenGroupNameLocal: data.screenGroupName || data.screenGroupLocalName,
    groupLocalName: data.screenGroupName || data.screenGroupLocalName,
    updatedBy: userId,
  };

  if (data.displayOrder !== undefined) {
    payload.displayOrder = Number(data.displayOrder);
  }

  const response = await apiClient.put<unknown>(
    `/ScreenGroupMaster/${encodeURIComponent(String(id))}`,
    payload
  );
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      'screenManagement.groups.messages.updateError',
      'Update screen group failed'
    );
  }
}

export async function deleteScreenGroup(id: number): Promise<string> {
  const response = await apiClient.delete<Record<string, unknown>>(
    `/ScreenGroupMaster/${encodeURIComponent(String(id))}`
  );
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      'screenManagement.groups.messages.deleteError',
      'Delete screen group failed'
    );
  }
  return String(response.data?.message || '');
}
