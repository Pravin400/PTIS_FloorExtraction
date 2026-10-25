import type {
  DepartmentMaster,
  DepartmentMasterFormModel,
} from '@/types/departmentMaster.types';

export function normalizeDepartmentMaster(data: unknown): DepartmentMaster {
  const item = data as Record<string, unknown>;

  return {
    departmentId: (() => {
      const value = item.departmentId ?? item.DepartmentId ?? item.id ?? item.Id;
      const numericValue = Number(value);
      return Number.isNaN(numericValue) ? 0 : numericValue;
    })(),
    departmentCode: String(item.departmentCode ?? item.DepartmentCode ?? ''),
    departmentName: String(item.departmentName ?? item.DepartmentName ?? ''),
    departmentNameLocal: String(item.departmentNameLocal ?? item.DepartmentNameLocal ?? ''),
    departmentDescription: String(
      item.departmentDescription ?? item.DepartmentDescription ?? ''
    ),
    isActive: Boolean(item.isActive ?? item.IsActive ?? true),
    createdBy: Number(item.createdBy ?? item.CreatedBy ?? 0) || 0,
    createdAt: String(item.createdAt ?? item.CreatedAt ?? ''),
    updatedBy: Number(item.updatedBy ?? item.UpdatedBy ?? 0) || 0,
    updatedAt: String(item.updatedAt ?? item.UpdatedAt ?? ''),
  };
}

export function buildDepartmentQueryString(
  params: Record<string, string | number>
): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    query.append(key, String(value));
  });

  return query.toString();
}

export function buildDepartmentPayload(data: DepartmentMasterFormModel) {
  return {
    departmentId: data.departmentId ?? 0,
    departmentCode: data.departmentCode,
    departmentName: data.departmentName,
    departmentNameLocal: data.departmentNameLocal,
    departmentIcon: "",
    departmentDescription: data.departmentDescription,
    isActive: data.isActive,
  };
}
