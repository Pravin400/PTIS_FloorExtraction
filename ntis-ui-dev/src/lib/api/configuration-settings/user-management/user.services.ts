import { apiClient } from '@/services/api.service';
import type { BackendUser, User, UserResponse } from '@/types/user-management';
import type { PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { mapBackendUserToUser, noStoreOptions } from './user-management.utils';

type UserListParams = {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
};

function buildUserQueryParams(params: UserListParams): string {
  const queryParams = new URLSearchParams();

  if (params.pageNumber !== undefined) {
    queryParams.append('PageNumber', params.pageNumber.toString());
  }

  if (params.pageSize !== undefined) {
    queryParams.append('PageSize', params.pageSize.toString());
  }

  if (params.searchTerm?.trim()) {
    queryParams.append('SearchTerm', params.searchTerm.trim());
  }

  if (params.isActive !== undefined) {
    queryParams.append('IsActive', String(params.isActive));
  }

  return queryParams.toString();
}

async function fetchUserById(id: string): Promise<User> {
  const response = await apiClient.get<BackendUser>(`/users/${id}`, noStoreOptions);

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to fetch user'
    );
  }

  return mapBackendUserToUser(response.data);
}

/**
 * READ Services
 */

export async function getUsers(params: UserListParams = {}): Promise<PagedResponse<User>> {
  const queryString = buildUserQueryParams(params);
  const endpoint = queryString ? `/users?${queryString}` : '/users';

  const response = await apiClient.get<UserResponse>(endpoint, noStoreOptions);

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to fetch users'
    );
  }

  return {
    items: response.data.items.map(mapBackendUserToUser),
    totalCount: response.data.totalCount,
    pageNumber: response.data.pageNumber,
    pageSize: response.data.pageSize,
    totalPages: response.data.totalPages,
    hasPrevious: response.data.hasPrevious,
    hasNext: response.data.hasNext,
  };
}

export async function getUserById(id: string): Promise<User> {
  return fetchUserById(id);
}
