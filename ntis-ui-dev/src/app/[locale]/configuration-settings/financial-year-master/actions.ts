"use server";

import { cookies } from "next/headers";
import {
  createFinancialYear,
  deleteFinancialYear,
  getFinancialYearById,
  getFinancialYearsPaged,
  ApiError,
  updateFinancialYear,
} from "@/lib/api/financial-year.service";
import { FinancialYear, FinancialYearFormValues } from "@/types/financialYear.types";
import { ActionResult } from "@/types/common.types";
import { logger } from "@/lib/utils/logger";
import { getUserIdFromCookies } from "@/lib/utils/auth-session";
import { createFinancialYearSchema } from "@/lib/validations/financial-year/validation-schemas";
import { getTranslations } from "next-intl/server";
import {
  buildYearPayload,
  extractActionError,
  mapApiErrorsToFormFields,
  mapSchemaErrors,
  revalidateFinancialYearPaths,
  unsetActiveYears,
} from "./actions.helpers";

async function ensureAuthorized() {
  const cookieStore = await cookies();
  return Boolean(getUserIdFromCookies(cookieStore));
}

export async function saveFinancialYearAction(data: FinancialYearFormValues, id?: number): Promise<ActionResult<void>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) return { success: false, error: "Session expired: Please login to continue" };
    const numericUserId = Number(userId) || 1;

    const parsed = createFinancialYearSchema((key) => key).safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Validation failed", validationErrors: mapSchemaErrors(parsed.error.flatten().fieldErrors) };
    }

    const existingYears = (await getFinancialYearsPaged(1, 2000)).items || [];
    const isDuplicateCode = existingYears.some((y) => y.yearCode?.toLowerCase() === data.yearCode.toLowerCase() && y.id !== id);
    const isDuplicateYear = existingYears.some((y) => y.year === Number(data.year) && y.id !== id);
    if (isDuplicateCode || isDuplicateYear) {
      return {
        success: false,
        error: "Validation failed",
        validationErrors: {
          ...(isDuplicateCode ? { yearCode: ["YearCode_Duplicate"] } : {}),
          ...(isDuplicateYear ? { year: ["Year_Duplicate"] } : {}),
        },
      };
    }

    const existing = id ? existingYears.find((y) => y.id === id) : null;
    const currentStatus = existing?.status || "Active";

    if (data.isCurrent) await unsetActiveYears(existingYears, id, numericUserId);
    const payload = {
      isActive: data.isCurrent,
      year: data.year,
      yearCode: data.yearCode.trim().toUpperCase(),
      status: currentStatus,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description || null,
      createdBy: numericUserId,
      updatedBy: numericUserId,
    };
    if (id) await updateFinancialYear(id, payload); else await createFinancialYear(payload);
    revalidateFinancialYearPaths();
    return { success: true };
  } catch (err: unknown) {
    logger.error("saveFinancialYearAction failed", { err });
    if (err instanceof ApiError) {
      try {
        const parsed = JSON.parse(err.responseText || err.message);
        if (parsed?.errors && typeof parsed.errors === "object") {
          return { success: false, error: parsed.title || "Validation failed", validationErrors: mapApiErrorsToFormFields(parsed.errors) };
        }
      } catch {}
    }
    return { success: false, error: extractActionError(err, "Failed to save financial year. Please try again.") };
  }
}

export async function deleteFinancialYearAction(id: number): Promise<ActionResult<void>> {
  try {
    if (!(await ensureAuthorized())) return { success: false, error: "Access denied" };
    const t = await getTranslations("financialYear");
    const year = await getFinancialYearById(id);
    if (year.isActive) return { success: false, error: t("table.messages.cannotDeleteCurrent") };
    await deleteFinancialYear(id);
    revalidateFinancialYearPaths();
    return { success: true };
  } catch (err: unknown) {
    logger.error("deleteFinancialYearAction failed", { err, id });
    return { success: false, error: extractActionError(err, "Failed to delete financial year. Please try again.") };
  }
}

export async function setAsCurrentAction(id: number): Promise<ActionResult<void>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) return { success: false, error: "Access denied" };
    const numericUserId = Number(userId) || 1;

    const year = await getFinancialYearById(id);
    if (year.status === "Closed") return { success: false, error: "Closed financial year cannot be marked as current" };
    const existingYears = (await getFinancialYearsPaged(1, 2000)).items || [];
    await unsetActiveYears(existingYears, id, numericUserId);
    await updateFinancialYear(id, buildYearPayload(year as FinancialYear, true, "Active", numericUserId));
    revalidateFinancialYearPaths();
    return { success: true };
  } catch (err: unknown) {
    logger.error("setAsCurrentAction failed", { err, id });
    return { success: false, error: extractActionError(err, "Failed to set as current. Please try again.") };
  }
}

export async function closeYearAction(id: number): Promise<ActionResult<void>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) return { success: false, error: "Access denied" };
    const numericUserId = Number(userId) || 1;

    const year = await getFinancialYearById(id);
    await updateFinancialYear(id, buildYearPayload(year as FinancialYear, false, "Closed", numericUserId));
    revalidateFinancialYearPaths();
    return { success: true };
  } catch (err: unknown) {
    logger.error("closeYearAction failed", { err, id });
    return { success: false, error: extractActionError(err, "Failed to close year. Please try again.") };
  }
}
