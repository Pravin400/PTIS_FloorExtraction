import { Department, Module } from "@/types/departmentActivation.types";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Normalizes Department Activation data from API to UI format.
 * Cleans up common "mock" values like "string" often returned by Swagger/development APIs.
 */
const cleanString = (val: unknown) => {
    const str = String(val ?? "").trim();
    return str.toLowerCase() === "string" ? "" : str;
};

export function normalizeDepartment(data: Record<string, unknown>): Department {
    return {
        departmentId: Number(
            data.departmentId ??
            data.DepartmentId ??
            data.departmentMasterId ??
            data.DepartmentMasterId ??
            data.id ??
            data.Id ??
            0
        ),
        departmentCode: cleanString(data.departmentCode ?? data.DepartmentCode),
        departmentName: cleanString(data.departmentName ?? data.DepartmentName),
        departmentNameLocal: cleanString(data.departmentNameLocal ?? data.DepartmentNameLocal),
        departmentIcon: cleanString(data.departmentIcon ?? data.DepartmentIcon),
        departmentDescription: cleanString(data.departmentDescription ?? data.DepartmentDescription),
        isActive: parseBoolean(data.isActive ?? data.IsActive ?? data.isStatus ?? data.Status),
    };
}

export function normalizeModule(data: Record<string, unknown>): Module {
    return {
        moduleId: Number(
            data.moduleId ??
            data.ModuleId ??
            data.moduleMasterId ??
            data.ModuleMasterId ??
            data.id ??
            data.Id ??
            0
        ),
        departmentId: Number(
            data.departmentId ??
            data.DepartmentId ??
            data.departmentMasterId ??
            data.DepartmentMasterId ??
            0
        ),
        departmentName: cleanString(data.departmentName ?? data.DepartmentName),
        moduleCode: cleanString(data.moduleCode ?? data.ModuleCode),
        moduleName: cleanString(data.moduleName ?? data.ModuleName),
        moduleNameLocal: cleanString(data.moduleNameLocal ?? data.ModuleNameLocal),
        moduleIcon: cleanString(data.moduleIcon ?? data.ModuleIcon),
        moduleLabel: cleanString(data.moduleLabel ?? data.ModuleLabel),
        moduleDescription: cleanString(data.moduleDescription ?? data.ModuleDescription),
        isActive: parseBoolean(data.isActive ?? data.IsActive ?? data.isStatus ?? data.Status),
    };
}
