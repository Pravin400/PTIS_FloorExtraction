
"use server";

import { revalidatePath } from "next/cache";
import { createTaxZone, updateTaxZone, deleteTaxZone, getTaxZonePagedServer, getTaxZoneById, ApiError } from "@/lib/api/taxzone.services";
import type { PagedResponse, TaxZone } from "@/types/taxzone.types";
import { validateRequiredStringFromFormData, getOptionalStringFromFormData, getBooleanFromFormData } from "@/lib/utils/validation-helpers";

import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

export async function getTaxZonePagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<TaxZone>> {
  return await getTaxZonePagedServer(pageNumber, pageSize, searchTerm);
}

export async function getTaxZoneByIdAction(id: string | number): Promise<TaxZone> {
  return await getTaxZoneById(id);
}

export async function deleteTaxZoneAction(formData: FormData) {
  // ✅ Use generic reusable validator
  const locale = validateRequiredStringFromFormData(formData, "locale");
  const idRaw = validateRequiredStringFromFormData(formData, "id");
  
  // Validate id is a positive number
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid id: must be a positive number");
  }

  await deleteTaxZone(id);
  revalidatePath(`/${locale}/property-tax/taxzone-master/taxzone`);
}

export async function saveTaxZone(id: string, formData: FormData) {
  // ✅ Use generic reusable validators with proper type checking and trimming
  let locale: string;
  let taxZoneNo: string;
  let taxZoneType: string;
  
  try {
    locale = validateRequiredStringFromFormData(formData, "locale");
  } catch {
    return { ok: false, error: "invalid_locale" };
  }
  
  try {
    taxZoneNo = validateRequiredStringFromFormData(formData, "taxZoneNo");
  } catch {
    return { ok: false, error: "invalid_taxZoneNo" };
  }
  
  try {
    taxZoneType = validateRequiredStringFromFormData(formData, "taxZoneType");
  } catch {
    return { ok: false, error: "invalid_taxZoneType" };
  }
  
  // ✅ Optional fields - safely extract with type checking
  const remark = getOptionalStringFromFormData(formData, "remark");
  const isActive = getBooleanFromFormData(formData, "isActive");

  // Read logged in user ID from cookie store
  const cookieStore = await cookies();
  const userIdFromCookie = getUserIdFromCookies(cookieStore);
  const rawCreatedBy = formData.get("createdBy");
  const rawUpdatedBy = formData.get("updatedBy");

  const createdBy = userIdFromCookie ?? (rawCreatedBy ? Number(rawCreatedBy) : null);
  const updatedBy = userIdFromCookie ?? (rawUpdatedBy ? Number(rawUpdatedBy) : null);
  
  // ✅ Validate id parameter - must be empty or a valid number
  let numericId: number | undefined = undefined;
  let isUpdate = false;

  if (id && id.trim() !== "") {
    numericId = Number(id);
    
    // ❌ Reject malformed IDs - security fix
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return {
        ok: false,
        error: "invalid_id",
      };
    }
    
    isUpdate = true;
  }
  
  const payload: {
    id?: number;
    taxZoneNo: string;
    taxZoneType: string;
    remark: string;
    isActive: boolean;
    createdBy?: number | null;
    updatedBy?: number | null;
  } = {
    id: numericId,
    taxZoneNo: taxZoneNo,
    taxZoneType: taxZoneType,
    remark: remark,
    isActive: isActive,
  };

  try {
    if (isUpdate) {
      payload.updatedBy = updatedBy;
      await updateTaxZone(payload);
      revalidatePath(`/${locale}/property-tax/taxzone-master/taxzone`);
      return { ok: true, mode: "update" as const };
    } else {
      payload.createdBy = createdBy;
      await createTaxZone(payload);
      revalidatePath(`/${locale}/property-tax/taxzone-master/taxzone`);
      return { ok: true, mode: "create" as const };
    }
  } catch (error) {
    // Handle 409 Conflict (duplicate record)
    if (error instanceof ApiError && error.statusCode === 409) {
      return {
        ok: false,
        error: "duplicate",
      };
    }
    
    // Handle other API errors
    if (error instanceof ApiError) {
      return {
        ok: false,
        error: "api_error",
        message: error.message || "An error occurred while saving the record.",
      };
    }
    
    // Handle generic errors
    return {
      ok: false,
      error: "unknown",
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
}

