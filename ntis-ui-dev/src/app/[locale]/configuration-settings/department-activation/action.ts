"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { locales } from "@/i18n/config";
import { departmentActivationService } from "@/lib/api/configuration-settings/department-activation/departmentActivation.service";
import { DepartmentUpdateRequest, ModuleUpdateRequest } from "@/types/departmentActivation.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/auth-session";
import { syncDepartmentLicenseWithMaster } from "@/lib/api/configuration-settings/ulb-configuration/ulbConfiguration.service";

export async function updateDepartmentStatusAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) return { success: false, error: "Unauthorized" };

    const data: DepartmentUpdateRequest = {
      departmentId: Number(formData.get("departmentId")),
      departmentCode: formData.get("departmentCode") as string,
      departmentName: formData.get("departmentName") as string,
      departmentNameLocal: formData.get("departmentNameLocal") as string,
      departmentIcon: formData.get("departmentIcon") as string,
      departmentDescription: formData.get("departmentDescription") as string,
      isActive: formData.get("isActive") === "true",
    };

    const result = await departmentActivationService.updateDepartmentStatus(data, userId);
    if (!result.success) return { success: false, error: result.error };

    await syncDepartmentLicenseWithMaster(data.departmentId, data.isActive, userId);

    revalidateTag("user-management", "default");

    for (const locale of locales) {
      revalidatePath(`/${locale}/configuration-settings/department-activation`, "page");
      revalidatePath(`/${locale}/configuration-settings/module-master`, "page");
      revalidatePath(`/${locale}/configuration-settings/screenAccess`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

export async function updateModuleStatusAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) return { success: false, error: "Unauthorized" };

    const data: ModuleUpdateRequest = {
      moduleId: Number(formData.get("moduleId")),
      departmentId: Number(formData.get("departmentId")),
      moduleCode: formData.get("moduleCode") as string,
      moduleName: formData.get("moduleName") as string,
      moduleNameLocal: formData.get("moduleNameLocal") as string,
      moduleIcon: formData.get("moduleIcon") as string,
      moduleLabel: formData.get("moduleLabel") as string,
      moduleDescription: formData.get("moduleDescription") as string,
      isActive: formData.get("isActive") === "true",
    };

    const result = await departmentActivationService.updateModuleStatus(data, userId);
    if (!result.success) return { success: false, error: result.error };

    revalidateTag("user-management", "default");

    for (const locale of locales) {
      revalidatePath(`/${locale}/configuration-settings/department-activation`, "page");
      revalidatePath(`/${locale}/configuration-settings/module-master`, "page");
      revalidatePath(`/${locale}/configuration-settings/screenAccess`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}
