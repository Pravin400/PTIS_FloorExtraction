"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { locales } from "@/i18n/config";
import { createDepartmentMaster, updateDepartmentMaster, deleteDepartmentMaster, getDepartmentMastersPaged, getDepartmentById } from "@/lib/api/configuration-settings/department-master/departmentMaster.service";
import { DepartmentMasterFormModel, DepartmentMaster } from "@/types/departmentMaster.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/auth-session";
import { syncDepartmentLicenseWithMaster } from "@/lib/api/configuration-settings/ulb-configuration/ulbConfiguration.service";


export async function fetchDepartmentsPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
) {
  try {
    return await getDepartmentMastersPaged(pageNumber, pageSize, searchTerm);
  } catch (error) {
    throw error;
  }
}

export async function getDepartmentByIdAction(id: number): Promise<DepartmentMaster> {
  try {
    const result = await getDepartmentById(id);
    if (!result) throw new Error("Department not found");
    return result;
  } catch (error) {
    throw error;
  }
}

export async function saveDepartmentMasterAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const id = formData.get("departmentId") ? Number(formData.get("departmentId")) : undefined;
    const data: DepartmentMasterFormModel = {
      departmentId: id,
      departmentCode: formData.get("departmentCode") as string,
      departmentName: formData.get("departmentName") as string,
      departmentNameLocal: formData.get("departmentNameLocal") as string,
      departmentDescription: formData.get("departmentDescription") as string,
      isActive: formData.get("isActive") === "true",
    };

    // Server-side validation
    const code = data.departmentCode?.trim() || "";
    const name = data.departmentName?.trim() || "";
    const nameLocal = data.departmentNameLocal?.trim() || "";
    const desc = data.departmentDescription?.trim() || "";

    if (!code) return { success: false, error: "Department Code is required" };
    if (code.length < 2 || code.length > 50) return { success: false, error: "Department Code must be between 2 and 50 characters" };
    if (/^0+$/.test(code)) return { success: false, error: "Department Code cannot consist only of zeros" };
    if (!/[a-zA-Z0-9]/.test(code)) return { success: false, error: "Department Code must contain at least one letter or digit" };
    if (!/^[A-Za-z0-9]+([A-Za-z0-9\s_-]*[A-Za-z0-9]+)*$/.test(code)) return { success: false, error: "Department Code must be alphanumeric (underscores, spaces and hyphens allowed)" };

    if (!name) return { success: false, error: "Department Name is required" };
    if (name.length < 3 || name.length > 100) return { success: false, error: "Department Name must be between 3 and 100 characters" };
    if (!/[\p{L}]/u.test(name)) return { success: false, error: "Department Name must contain at least one letter" };
    if (/^[0-9\s,.\-\/()]+$/.test(name)) return { success: false, error: "Department Name cannot consist only of numbers or punctuation" };
    if (!/^[\p{L}\p{M}\p{N}]+(([\p{L}\p{M}\p{N}\/,.\-()&]|\s(?!\s))*[\p{L}\p{M}\p{N}]+)*$/u.test(name)) return { success: false, error: "Department Name contains invalid characters or consecutive spaces" };

    if (nameLocal) {
      if (nameLocal.length < 3 || nameLocal.length > 100) return { success: false, error: "Local Name must be between 3 and 100 characters" };
      if (!/[\p{L}]/u.test(nameLocal)) return { success: false, error: "Local Name must contain at least one letter" };
    }

    if (desc) {
      if (desc.length > 500) return { success: false, error: "Description must be at most 500 characters" };
      if (!/[\p{L}\p{N}]/u.test(desc)) return { success: false, error: "Description must contain at least one letter or digit" };
    }

    let targetDeptId = id;
    if (id) {
      await updateDepartmentMaster(data, userId);
    } else {
      await createDepartmentMaster(data, userId);
      const paged = await getDepartmentMastersPaged(1, 1, data.departmentCode);
      targetDeptId = paged.items[0]?.departmentId;
    }

    if (targetDeptId) {
      await syncDepartmentLicenseWithMaster(targetDeptId, data.isActive, userId);
    }

    revalidateTag("user-management", "default");

    for (const locale of locales) {
      revalidatePath(`/${locale}/configuration-settings/department-master`, "page");
    }

    return { success: true, message: id ? "Department updated successfully" : "Department created successfully" };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to save department" };
  }
}

export async function deleteDepartmentAction(
  departmentId: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 0;
    await deleteDepartmentMaster(departmentId);
    await syncDepartmentLicenseWithMaster(departmentId, false, userId);
    revalidateTag("user-management", "default");
    for (const locale of locales) {
      revalidatePath(`/${locale}/configuration-settings/department-master`, "page");
    }
    return { success: true, message: "Department deleted successfully" };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete department" };
  }
}
