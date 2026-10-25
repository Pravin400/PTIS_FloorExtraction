"use server";

import { getCitizenServices } from "@/lib/api/water-bill/citizenService.service";
import { getDepartmentPortalConfiguration } from "@/lib/api/water-bill/portalConfig.service";
import { getPortalContent } from "@/lib/api/water-bill/portalContent.service";
import { ApiError } from "@/lib/utils/api";
import type { CitizenServiceItem } from "@/types/water-bill/citizenService.types";
import type { PortalConfigJson } from "@/types/water-bill/portalConfig.types";
import type { PortalContentGrouped, PortalContentItem } from "@/types/water-bill/portalContent.types";

const MAX_PAGE_SIZE = 100;

function sortByDisplayOrder<T extends { displayOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.displayOrder - b.displayOrder);
}

function isPublished(item: PortalContentItem, now: number): boolean {
  if (!item.isActive) return false;
  if (item.publishFromDate && new Date(item.publishFromDate).getTime() > now) return false;
  if (item.publishToDate && new Date(item.publishToDate).getTime() < now) return false;
  return true;
}

export async function fetchActivePortalConfigServerAction(departmentId?: number): Promise<PortalConfigJson> {
  try {
    const result = await getDepartmentPortalConfiguration({ departmentId, pageNumber: 1, pageSize: 10 });
    const active = result.items.find((item) => item.isActive) ?? result.items[0];
    const rawConfig = active?.configJson as unknown;

    if (!rawConfig) {
      throw new ApiError(404, "No portal configuration found", "Get portal configuration failed");
    }

    if (typeof rawConfig === "string") {
      try {
        return JSON.parse(rawConfig) as PortalConfigJson;
      } catch (parseError) {
        console.error("[fetchActivePortalConfigServerAction] Failed to parse configJson:", parseError);
        throw new ApiError(500, "Failed to parse portal configuration", "Invalid configuration format");
      }
    }

    return rawConfig as PortalConfigJson;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      console.error(`[fetchActivePortalConfigServerAction] API Error ${error.statusCode}:`, error.responseText);
    } else {
      console.error("[fetchActivePortalConfigServerAction] Error:", error);
    }
    throw error;
  }
}

export async function fetchPortalContentServerAction(departmentId?: number): Promise<PortalContentGrouped> {
  try {
    const result = await getPortalContent({ departmentId, pageNumber: 1, pageSize: MAX_PAGE_SIZE });
    const now = Date.now();
    const published = result.items.filter((item) => isPublished(item, now));

    return {
      updates: sortByDisplayOrder(published.filter((item) => item.contentType === "LATEST_UPDATE")),
      announcements: sortByDisplayOrder(published.filter((item) => item.contentType === "ANNOUNCEMENT")),
      importantLinks: sortByDisplayOrder(published.filter((item) => item.contentType === "IMPORTANT_LINK")),
    };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      console.error(`[fetchPortalContentServerAction] API Error ${error.statusCode}:`, error.responseText);
    } else {
      console.error("[fetchPortalContentServerAction] Error:", error);
    }
    throw error;
  }
}

export async function fetchCitizenServicesServerAction(departmentId?: number): Promise<CitizenServiceItem[]> {
  try {
    const result = await getCitizenServices({ departmentId, pageNumber: 1, pageSize: MAX_PAGE_SIZE });
    return sortByDisplayOrder(result.items.filter((item) => item.isActive));
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      console.error(`[fetchCitizenServicesServerAction] API Error ${error.statusCode}:`, error.responseText);
    } else {
      console.error("[fetchCitizenServicesServerAction] Error:", error);
    }
    throw error;
  }
}
