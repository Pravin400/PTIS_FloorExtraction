import { apiClient } from '@/services/api.service';
import type {
  Role,
  BackendUserRole,
  Designation,
  BackendDesignation,
} from '@/types/user-management';
import { ApiError } from '@/lib/utils/api';
import { mapBackendRoleToRole, mapBackendDesignationToDesignation } from './user-management.utils';

export async function createUserRole(role: Partial<Role>, userId?: number): Promise<Role> {
  const backendRole = {
    userRoleName: role.name,
    departmentId: role.departmentId ? Number(role.departmentId) : undefined,
    isActive: role.isActive,
    createdBy: userId || 0,
  };
  const response = await apiClient.post<BackendUserRole>('/UserRole', backendRole);
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to create role'
    );
  }
  const mapped = mapBackendRoleToRole(response.data);
  if (mapped) return mapped;
  return {
    id: '0',
    userRoleId: 0,
    name: role.name || '',
    departmentId: role.departmentId ? Number(role.departmentId) : undefined,
    departmentName: role.departmentName,
    isActive: !!(role.isActive ?? true),
    status: (role.isActive ?? true) ? 'Active' : 'Inactive',
  } as Role;
}

export async function updateUserRole(role: Partial<Role>, userId?: number): Promise<void> {
  const backendRole = {
    userRoleId: role.userRoleId,
    userRoleName: role.name,
    departmentId: role.departmentId ? Number(role.departmentId) : undefined,
    isActive: role.isActive,
    updatedBy: userId || 0,
  };
  const response = await apiClient.put<void>(`/UserRole/${role.userRoleId}`, backendRole);
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to update role'
    );
  }
}

export async function deleteUserRole(id: string): Promise<void> {
  const response = await apiClient.delete<void>(`/UserRole/${id}`);
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to delete role'
    );
  }
}

export async function createDesignation(
  designation: Partial<Designation>,
  userId?: number
): Promise<Designation> {
  const backendDesignation = {
    designationCode: designation.code,
    designationName: designation.name,
    designationLocal: designation.localName || designation.name,
    designationDescription: designation.description,
    isActive: designation.isActive ?? true,
    createdBy: userId || 0,
  };
  const response = await apiClient.post<BackendDesignation>(
    '/DesignationMaster',
    backendDesignation
  );
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to create designation'
    );
  }
  const mapped = mapBackendDesignationToDesignation(response.data);
  if (mapped) return mapped;
  return {
    id: '0',
    code: designation.code || '',
    name: designation.name || '',
    localName: designation.localName || '',
    description: designation.description || '',
    status: designation.isActive === false ? 'Inactive' : 'Active',
    isActive: designation.isActive ?? true,
    userCount: 0,
  } as Designation;
}

export async function updateDesignation(
  designation: Partial<Designation>,
  userId?: number
): Promise<void> {
  const backendDesignation = {
    designationCode: designation.code,
    designationName: designation.name,
    designationLocal: designation.localName || designation.name,
    designationDescription: designation.description,
    isActive: designation.isActive,
    updatedBy: userId || 0,
  };
  const response = await apiClient.put<void>(
    `/DesignationMaster/${designation.id}`,
    backendDesignation
  );
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to update designation'
    );
  }
}

export async function deleteDesignation(id: string): Promise<void> {
  const response = await apiClient.delete<void>(`/DesignationMaster/${id}`);
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to delete designation'
    );
  }
}
