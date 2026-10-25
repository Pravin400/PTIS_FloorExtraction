/**
 * Zone and Ward services.
 */

import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";
import type {
  WardApiResponse,
  ZoneApiResponse,
} from "@/types/property-search";
import {
  isWardShape,
  isZoneShape,
  normalizeWard,
  normalizeZone,
} from "../guards/zone-ward-guards";
import { zoneCacheOptions } from "../cache-options";

const logger = createLogger("property-search/zone-ward");

export async function fetchZones(): Promise<ZoneApiResponse[]> {
  try {
    const response = await apiClient.get<{ items: unknown[] }>(
      "/Zone?PageSize=-1",
      zoneCacheOptions
    );

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch zones",
        "Get zones failed"
      );
    }

    if (!response.data || !Array.isArray(response.data.items)) {
      return [];
    }

    return response.data.items
      .filter(isZoneShape)
      .map(normalizeZone)
      .filter((zone) => zone.isActive)
      .sort((a, b) =>
        (a.description ?? a.zoneNo).localeCompare(b.description ?? b.zoneNo, "mr")
      );
  } catch (error) {
    logger.error("Failed to fetch zones", { error: error as Error });
    return [];
  }
}

export async function fetchWardsByZone(
  zoneId: number
): Promise<WardApiResponse[]> {
  const resolvedZoneId = Number(zoneId);
  if (!Number.isFinite(resolvedZoneId) || resolvedZoneId <= 0) {
    return [];
  }

  try {
    const collected = await fetchWardPagesForZone(resolvedZoneId, -1);
    if (collected.length === 0) {
      return fetchWardPagesForZone(resolvedZoneId, 100);
    }
    return collected;
  } catch (error) {
    logger.error("Failed to fetch wards by zone", {
      zoneId: resolvedZoneId,
      error: error as Error,
    });
    return [];
  }
}

async function fetchWardPagesForZone(
  zoneId: number,
  pageSize: number
): Promise<WardApiResponse[]> {
  const collected = new Map<number, WardApiResponse>();
  let pageNumber = 1;
  let hasNext = true;

  while (hasNext) {
    const params = new URLSearchParams();
    params.set("ZoneId", String(zoneId));
    params.set("PageSize", String(pageSize));
    if (pageSize > 0) {
      params.set("PageNumber", String(pageNumber));
    }

    const response = await apiClient.get<{
      items: unknown[];
      hasNext?: boolean;
    }>(`/Ward?${params.toString()}`, zoneCacheOptions);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch wards",
        "Get wards failed"
      );
    }

    if (!response.data || !Array.isArray(response.data.items)) {
      break;
    }

    for (const item of response.data.items) {
      if (!isWardShape(item)) continue;
      const ward = normalizeWard(item);
      if (ward.zoneId !== zoneId || !ward.isActive) continue;
      collected.set(ward.wardId, ward);
    }

    if (pageSize < 0) {
      break;
    }

    hasNext =
      response.data.hasNext ?? response.data.items.length >= pageSize;
    pageNumber += 1;
  }

  return Array.from(collected.values()).sort((a, b) => {
    if (a.sequenceNo !== null && b.sequenceNo !== null && a.sequenceNo !== b.sequenceNo) {
      return a.sequenceNo - b.sequenceNo;
    }
    return (a.wardNo ?? a.description ?? "").localeCompare(b.wardNo ?? b.description ?? "", "mr", {
      numeric: true,
      sensitivity: "base",
    });
  });
}

export async function fetchAllWards(): Promise<WardApiResponse[]> {
  try {
    const response = await apiClient.get<{ items: unknown[] }>(
      "/Ward?PageSize=-1",
      zoneCacheOptions
    );

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch all wards",
        "Get all wards failed"
      );
    }

    if (!response.data || !Array.isArray(response.data.items)) {
      return [];
    }

    return response.data.items
      .filter(isWardShape)
      .map(normalizeWard)
      .filter((ward) => ward.isActive)
      .sort((a, b) => {
        if (a.sequenceNo !== null && b.sequenceNo !== null && a.sequenceNo !== b.sequenceNo) {
          return a.sequenceNo - b.sequenceNo;
        }
        return (a.wardNo ?? a.description ?? "").localeCompare(b.wardNo ?? b.description ?? "", "mr", {
          numeric: true,
          sensitivity: "base",
        });
      });
  } catch (error) {
    logger.error("Failed to fetch all wards", { error: error as Error });
    return [];
  }
}
