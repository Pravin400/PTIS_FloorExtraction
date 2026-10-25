/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import type { Department, ApiDepartmentItem } from "@/types/municipal-asset-service.types";

export type { Department };

/**
 * Service for fetching Department master data
 */
export const departmentService = {
  /**
   * Get all active Departments
   */
  getDepartments: async (): Promise<ApiResponse<Department[]>> => {
    const response = await apiClient.get<{ items?: ApiDepartmentItem[] } | ApiDepartmentItem[]>("/OwningDepartment?IsActive=true&PageSize=-1", { cacheStrategy: 300  } as any);
    if (response.success && response.data) {
      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : (data.items || []);
      const normalized = items
        .filter((item) => 
          item.isActive !== false && 
          item.IsActive !== false && 
          item.status?.toLowerCase() !== 'inactive'
        )
        .map((item) => {
          const departmentName = item.owningDepartmentName || item.departmentName || `Department ${item.id}`;
          const imageUrl = item.departmentIcon || item.imageUrl || item.logo || item.logoUrl || item.icon || item.image || item.deptImage || item.deptLogo || "";
          return {
            ...item,
            departmentName,
            imageUrl
          };
        });
      return { ...response, data: normalized };
    }
    return response as ApiResponse<Department[]>;
  },
};
