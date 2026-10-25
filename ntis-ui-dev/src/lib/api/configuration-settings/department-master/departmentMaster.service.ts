import { apiClient } from "@/services/api.service";
import { DepartmentMaster, DepartmentMasterFormModel } from "@/types/departmentMaster.types";
import { PagedResponse } from "@/types/common.types";
import { normalizeDepartmentMaster } from "./department-types-guard";

const API_ENDPOINTS = {
    getAll: '/DepartmentMaster',
    create: '/DepartmentMaster',
    update: (id: number) => `/DepartmentMaster/${id}`,
    delete: (id: number) => `/DepartmentMaster/${id}`,
};

export async function getDepartmentMasters(pageNumber = 1, pageSize = 10, searchTerm?: string): Promise<DepartmentMaster[]> {
    const pagedData = await getDepartmentMastersPaged(pageNumber, pageSize, searchTerm);
    return pagedData.items || [];
}

export async function getDepartmentById(id: number): Promise<DepartmentMaster | null> {
    const response = await apiClient.get<DepartmentMaster>(
        `${API_ENDPOINTS.getAll}/${id}`
    );
    if (!response.success || !response.data) {
        return null;
    }
    return normalizeDepartmentMaster(response.data);
}

export async function getDepartmentMastersPaged(
    pageNumber: number,
    pageSize: number,
    searchTerm?: string,
    status?: string
): Promise<PagedResponse<DepartmentMaster>> {
    const params = new URLSearchParams();
    params.append("PageNumber", String(pageNumber));
    params.append("PageSize", String(pageSize));
    if (searchTerm?.trim()) {
        params.append("SearchTerm", searchTerm.trim());
    }
    if (status) {
        params.append("IsActive", status);
    }

    const response = await apiClient.get<PagedResponse<DepartmentMaster>>(
        `${API_ENDPOINTS.getAll}?${params.toString()}`
    );

    if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch departments");
    }

    const normalizedItems = (response.data.items || []).map(normalizeDepartmentMaster);
    return { ...response.data, items: normalizedItems };
}

export async function createDepartmentMaster(data: DepartmentMasterFormModel, userId: number): Promise<void> {
    const payload = {
        departmentId: 0,
        departmentCode: data.departmentCode,
        departmentName: data.departmentName,
        departmentNameLocal: data.departmentNameLocal,
        departmentIcon: "",
        departmentDescription: data.departmentDescription,
        isActive: data.isActive,
        createdBy: userId
    };

    const response = await apiClient.post(API_ENDPOINTS.create, payload);

    if (!response.success) {
        throw new Error(response.error || "Failed to create department");
    }
}

export async function updateDepartmentMaster(data: DepartmentMasterFormModel, userId: number): Promise<void> {
    if (!data.departmentId) throw new Error("Department ID is required for update");

    const payload = {
        departmentId: data.departmentId,
        departmentCode: data.departmentCode,
        departmentName: data.departmentName,
        departmentNameLocal: data.departmentNameLocal,
        departmentIcon: "",
        departmentDescription: data.departmentDescription,
        isActive: data.isActive,
        updatedBy: userId
    };

    const response = await apiClient.put(API_ENDPOINTS.update(data.departmentId), payload);

    if (!response.success) {
        throw new Error(response.error || "Failed to update department");
    }
}

export async function deleteDepartmentMaster(id: number): Promise<void> {
    const response = await apiClient.delete(API_ENDPOINTS.delete(id));

    if (!response.success) {
        throw new Error(response.error || `Failed to delete department ${id}`);
    }
}

/**
 * Get all Department Masters (utility for bulk actions)
 */
export async function getAllDepartmentMasters(): Promise<{ success: boolean; data: DepartmentMaster[] | null; error?: string }> {
    try {
        const data = await getDepartmentMasters(1, 1000);
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, data: null, error: error instanceof Error ? error.message : "An unexpected error occurred" };
    }
}
