import { DepartmentMaster } from "@/types/departmentMaster.types";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Normalizes Department Master data from API to UI format.
 * Cleans up common "mock" values like "string" often returned by Swagger/development APIs.
 */
export function normalizeDepartmentMaster(data: Record<string, unknown>): DepartmentMaster {
    const cleanString = (val: unknown) => {
        const str = String(val ?? "").trim();
        return str.toLowerCase() === "string" ? "" : str;
    };

    return {
        departmentId: Number(data.departmentId ?? data.DepartmentId ?? data.departmentMasterId ?? data.DepartmentMasterId ?? data.id ?? data.Id ?? 0),
        departmentCode: cleanString(data.departmentCode ?? data.DepartmentCode),
        departmentName: cleanString(data.departmentName ?? data.DepartmentName),
        departmentNameLocal: cleanString(data.departmentNameLocal ?? data.DepartmentNameLocal),
        departmentDescription: cleanString(data.departmentDescription ?? data.DepartmentDescription),
        isActive: parseBoolean(data.isActive ?? data.IsActive ?? data.isStatus),
        createdAt: String(
            data.createdAt ?? data.CreatedAt ?? data.createdDate ?? data.CreatedDate ?? ""
        ),
        updatedAt: String(
            data.updatedAt ?? data.UpdatedAt ?? data.updatedDate ?? data.UpdatedDate ?? ""
        ),
    };
}
