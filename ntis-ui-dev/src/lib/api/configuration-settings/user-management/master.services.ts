import { apiClient } from '@/services/api.service';
import type {
  BackendUserRole,
  Role,
  UserRoleResponse,
  Department,
  MasterModule,
  BackendDesignation,
  Designation,
  DesignationResponse,
} from '@/types/user-management';
import { ApiError } from '@/lib/utils/api';
import {
  mapBackendRoleToRole,
  mapBackendDesignationToDesignation,
  userManagementCacheOptions,
} from './user-management.utils';

/**
 * READ Services (Roles, Departments, Modules, Designations)
 */

export async function getRoles(
  params: { searchTerm?: string; isActive?: boolean } = {}
): Promise<Role[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('PageSize', '1000');
  if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
  if (params.isActive !== undefined) queryParams.append('IsActive', String(params.isActive));

  const response = await apiClient.get<UserRoleResponse>(
    `/UserRole?${queryParams.toString()}`,
    userManagementCacheOptions
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to fetch roles'
    );
  }
  return response.data.items.map(mapBackendRoleToRole).filter((r): r is Role => r !== null);
}

export async function getRoleById(id: string): Promise<Role> {
  const response = await apiClient.get<BackendUserRole>(
    `/UserRole/${id}`,
    userManagementCacheOptions
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to fetch role'
    );
  }
  const role = mapBackendRoleToRole(response.data);
  if (!role) throw new Error('Role mapping failed');
  return role;
}

export async function getDepartments(params: { isActive?: boolean } = {}): Promise<Department[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('PageSize', '1000');
  if (params.isActive !== undefined) queryParams.append('IsActive', String(params.isActive));

  const response = await apiClient.get<{ items: Department[] }>(
    `/DepartmentMaster?${queryParams.toString()}`,
    userManagementCacheOptions
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to fetch departments'
    );
  }
  return response.data.items || [];
}

export async function getModules(params: { isActive?: boolean } = {}): Promise<MasterModule[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('PageSize', '1000');
  if (params.isActive !== undefined) queryParams.append('IsActive', String(params.isActive));

  const response = await apiClient.get<{ items: MasterModule[] }>(
    `/ModuleMaster?${queryParams.toString()}`,
    userManagementCacheOptions
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to fetch modules'
    );
  }
  return response.data.items || [];
}

export async function getDesignations(
  params: { searchTerm?: string; isActive?: boolean } = {}
): Promise<Designation[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('PageSize', '1000');
  if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
  if (params.isActive !== undefined) queryParams.append('IsActive', String(params.isActive));

  const response = await apiClient.get<DesignationResponse>(
    `/DesignationMaster?${queryParams.toString()}`,
    userManagementCacheOptions
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to fetch designations'
    );
  }
  return (response.data.items || [])
    .map(mapBackendDesignationToDesignation)
    .filter((d): d is Designation => d !== null);
}

export async function getDesignationById(id: string): Promise<Designation> {
  const response = await apiClient.get<BackendDesignation>(
    `/DesignationMaster/${id}`,
    userManagementCacheOptions
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to fetch designation'
    );
  }
  const mapped = mapBackendDesignationToDesignation(response.data);
  if (!mapped) throw new Error('Designation mapping failed');
  return mapped;
}
