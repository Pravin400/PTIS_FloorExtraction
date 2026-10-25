"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/auth-session";
import {
  bulkUpdateMultilingualTranslations,
  getMultilingualResources,
  getMultilingualTranslationsPaged,
} from "@/lib/api/configuration-settings/multilingual-translation/multilingual-translation.service";
import {
  MultilingualTranslation,
  MultilingualTranslationBulkUpdateItem,
  SupportedLanguageCode,
  SUPPORTED_LANGUAGE_CODES,
} from "@/types/multilingual-translation.types";
import { PagedResponse } from "@/types/common.types";

const MAX_PAGE_SIZE = 100;
const MAX_PAGE_NUMBER = 10_000;

async function redirectOnUnauthorized(error: unknown): Promise<never> {
  if (error instanceof ApiError && error.statusCode === 401) {
    const currentLocale = await getLocale();
    redirect(`/${currentLocale}/login`);
  }
  throw error;
}

export async function fetchMultilingualResourcesAction(): Promise<string[]> {
  try {
    return await getMultilingualResources();
  } catch (error) {
    await redirectOnUnauthorized(error);
    throw error;
  }
}

export async function fetchMultilingualTranslationsPagedAction(
  pageNumber: number,
  pageSize: number,
  resource?: string,
  languages?: string[]
): Promise<PagedResponse<MultilingualTranslation>> {
  try {
    if (
      !Number.isFinite(pageNumber) ||
      !Number.isFinite(pageSize) ||
      pageNumber <= 0 ||
      pageSize <= 0 ||
      pageSize > MAX_PAGE_SIZE ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      throw new ApiError(400, "Invalid pagination parameters", "Validation failed");
    }

    const validLanguages = (languages ?? []).filter((l): l is SupportedLanguageCode =>
      (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(l)
    );

    return await getMultilingualTranslationsPaged(
      pageNumber,
      pageSize,
      resource,
      validLanguages
    );
  } catch (error) {
    await redirectOnUnauthorized(error);
    throw error;
  }
}

export async function bulkUpdateMultilingualTranslationsAction(
  items: MultilingualTranslationBulkUpdateItem[]
): Promise<{
  success: boolean;
  message?: string;
  statusCode?: number;
  successCount?: number;
  failedCount?: number;
}> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      throw new ApiError(401, "Unauthorized", "User session expired");
    }

    if (!items || items.length === 0) {
      return { success: false, message: "No changes to save", statusCode: 400 };
    }

    const stamped = items.map((item) => ({
      ...item,
      data: { ...item.data, updatedBy: userId },
    }));

    const result = await bulkUpdateMultilingualTranslations(stamped);

    for (const loc of locales) {
      revalidatePath(`/${loc}/configuration-settings/multilingual-translation`, "page");
    }

    return {
      success: result.allSucceeded,
      successCount: result.successCount,
      failedCount: result.failedCount,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to update translations" };
  }
}
