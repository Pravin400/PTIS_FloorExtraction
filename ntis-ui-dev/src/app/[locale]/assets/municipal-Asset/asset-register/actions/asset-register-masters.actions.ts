import { categoryTypeService } from "@/lib/api/asset/category-type.service";
import { zoneService } from "@/lib/api/asset/zone.service";
import { wardService } from "@/lib/api/asset/ward.service";
import { departmentService } from "@/lib/api/asset/department.service";

export async function fetchAssetTypesByCategory(categoryId?: number | null) {
  try {
    let response;
    if (categoryId && categoryId > 0) {
      response = await categoryTypeService.getTypesByCategory(categoryId);
    } else {
      response = await categoryTypeService.getAllTypes();
    }
    if (response.success && response.data) {
      const rawData = response.data as unknown;
      const items = Array.isArray(rawData)
        ? (rawData as Array<Record<string, unknown>>)
        : (((rawData as Record<string, unknown>)?.items as Array<Record<string, unknown>>) || []);
      return items
        .filter((type): type is Record<string, unknown> => Boolean(type && (type.id != null || type.Id != null)))
        .map((type) => ({
          id: Number(type.id ?? type.Id),
          label: String(type.typeName ?? type.TypeName ?? type.assetTypeName ?? type.AssetTypeName ?? `Type ${type.id ?? type.Id}`),
          assetCategoryId: Number(type.assetCategoryId ?? type.AssetCategoryId ?? type.categoryId ?? type.CategoryId),
        }));
    }
  } catch (err) {
    console.error('Failed to fetch asset types by category:', err);
  }
  return [];
}

export async function fetchZones() {
  try {
    const response = await zoneService.getZones();
    if (response.success && response.data) {
      return response.data
        .filter((zone) => zone && zone.id != null)
        .map((zone) => {
          const z = zone as { zoneNo?: string; ZoneNo?: string; zoneName?: string; ZoneName?: string; description?: string; id?: number };
          const label = z.zoneNo || z.ZoneNo || z.zoneName || z.ZoneName || z.description || `Zone ${z.id}`;
          return {
            id: Number(zone.id),
            label,
          };
        });
    }
  } catch (_err) {
    // Empty catch
  }
  return [];
}

export async function fetchWards() {
  try {
    const response = await wardService.getWards();
    if (response.success && response.data) {
      return response.data
        .filter((ward) => ward && ward.id != null)
        .map((ward) => {
          const w = ward as { wardNo?: string; WardNo?: string; wardName?: string; WardName?: string; name?: string; Name?: string; description?: string; id?: number };
          const label = w.wardNo || w.WardNo || w.wardName || w.WardName || w.name || w.Name || w.description || `Ward ${ward.id}`;
          return {
            id: Number(ward.id),
            zoneId: ward.zoneId == null ? null : Number(ward.zoneId),
            label,
          };
        });
    }
  } catch (_err) {
    // Empty catch
  }
  return [];
}

export async function fetchCategoryNameById(categoryId: number): Promise<string> {
  try {
    const response = await categoryTypeService.getCategories();
    if (response.success && response.data) {
      const match = response.data.find((item) => item.id === categoryId);
      return match?.categoryName || '';
    }
  } catch (_err) {
    // Empty catch
  }
  return '';
}

export async function fetchAssetTypesByCategoryAction(categoryId?: number | string | null) {
  try {
    const numericCategoryId = categoryId && categoryId !== 'all' && !isNaN(Number(categoryId)) ? Number(categoryId) : null;
    let res;
    if (numericCategoryId) {
      res = await categoryTypeService.getTypesByCategory(numericCategoryId);
    } else {
      res = await categoryTypeService.getAllTypes();
    }
    if (res.success && res.data) {
      const rawData = res.data as unknown;
      const items = Array.isArray(rawData)
        ? (rawData as Array<Record<string, unknown>>)
        : (((rawData as Record<string, unknown>)?.items as Array<Record<string, unknown>>) || []);
      let types = items
        .filter((type): type is Record<string, unknown> => Boolean(type && (type.id != null || type.Id != null)))
        .map((type) => ({
          id: Number(type.id ?? type.Id),
          label: String(type.typeName ?? type.TypeName ?? type.assetTypeName ?? type.AssetTypeName ?? `Type ${type.id ?? type.Id}`),
          assetCategoryId: Number(type.assetCategoryId ?? type.AssetCategoryId ?? type.categoryId ?? type.CategoryId),
        }));

      if (numericCategoryId && types.length === 0) {
        const allRes = await categoryTypeService.getAllTypes();
        if (allRes.success && allRes.data) {
          const allRaw = allRes.data as unknown;
          const allItems = Array.isArray(allRaw)
            ? (allRaw as Array<Record<string, unknown>>)
            : (((allRaw as Record<string, unknown>)?.items as Array<Record<string, unknown>>) || []);
          types = allItems
            .filter((type): type is Record<string, unknown> => Boolean(type && (type.id != null || type.Id != null)))
            .map((type) => ({
              id: Number(type.id ?? type.Id),
              label: String(type.typeName ?? type.TypeName ?? type.assetTypeName ?? type.AssetTypeName ?? `Type ${type.id ?? type.Id}`),
              assetCategoryId: Number(type.assetCategoryId ?? type.AssetCategoryId ?? type.categoryId ?? type.CategoryId),
            }))
            .filter((t) => t.assetCategoryId === numericCategoryId);
        }
      }

      return { success: true, types, error: null };
    }
    return { success: false, types: [], error: res.error || 'Failed to fetch asset types' };
  } catch (err: unknown) {
    console.error('Failed to fetch asset types by category in server action:', err);
    return {
      success: false,
      types: [],
      error: err instanceof Error ? err.message : 'Failed to fetch asset types',
    };
  }
}

export async function fetchCategoriesAction() {
  try {
    const res = await categoryTypeService.getCategories();
    if (res.success && res.data) {
      const rawData = res.data as unknown;
      const items = Array.isArray(rawData)
        ? (rawData as Array<Record<string, unknown>>)
        : (((rawData as Record<string, unknown>)?.items as Array<Record<string, unknown>>) || []);
      const categories = items
        .filter((cat): cat is Record<string, unknown> => Boolean(cat && (cat.id != null || cat.Id != null)))
        .map((cat) => ({
          id: Number(cat.id ?? cat.Id),
          label: String(cat.categoryName ?? cat.CategoryName ?? `Category ${cat.id ?? cat.Id}`),
        }));
      return { success: true, categories, error: null };
    }
    return { success: false, categories: [], error: res.error || 'Failed to fetch categories' };
  } catch (err: unknown) {
    console.error('Failed to fetch categories in server action:', err);
    return { success: false, categories: [], error: err instanceof Error ? err.message : 'Failed to fetch categories' };
  }
}

export async function fetchDepartmentsAction() {
  try {
    const res = await departmentService.getDepartments();
    if (res.success && res.data) {
      const rawData = res.data as unknown;
      const items = Array.isArray(rawData)
        ? (rawData as Array<Record<string, unknown>>)
        : (((rawData as Record<string, unknown>)?.items as Array<Record<string, unknown>>) || []);
      const departments = items
        .filter((dept): dept is Record<string, unknown> => Boolean(dept && (dept.id != null || dept.Id != null)))
        .map((dept) => ({
          id: Number(dept.id ?? dept.Id),
          label: String(dept.departmentName ?? dept.DepartmentName ?? `Department ${dept.id ?? dept.Id}`),
        }));
      return { success: true, departments, error: null };
    }
    return { success: false, departments: [], error: res.error || 'Failed to fetch departments' };
  } catch (err: unknown) {
    console.error('Failed to fetch departments in server action:', err);
    return { success: false, departments: [], error: err instanceof Error ? err.message : 'Failed to fetch departments' };
  }
}
