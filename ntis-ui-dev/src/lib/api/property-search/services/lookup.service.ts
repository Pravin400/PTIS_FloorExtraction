/**
 * Lookup Options service.
 */

import { apiClient } from "@/services/api.service";
import { createLogger } from "@/lib/utils/server-logger";
import type { LookupOptionsApiResponse } from "@/types/property-search";
import { normalizeLookupOptions } from "../guards/lookup-guards";
import { EMPTY_LOOKUP_OPTIONS, lookupCacheOptions } from "../cache-options";

const logger = createLogger("property-search/lookup");

export async function fetchLookupOptions(
  zoneId?: number | null,
  wardId?: number | null
): Promise<LookupOptionsApiResponse> {
  // Skip when no zone selected: the autocomplete options are only useful
  // once the user has narrowed the dataset to a zone (and optionally ward).
  if (!zoneId || zoneId <= 0) {
    return EMPTY_LOOKUP_OPTIONS;
  }

  try {
    const params = new URLSearchParams();
    params.set("zoneId", String(zoneId));
    if (wardId && wardId > 0) params.set("wardId", String(wardId));

    const response = await apiClient.get<unknown>(
      `/PropertySearch/lookup-options?${params.toString()}`,
      lookupCacheOptions
    );

    if (!response.success) {
      logger.warn("Lookup options request failed", {
        zoneId,
        wardId,
        statusCode: response.statusCode,
      });
      return EMPTY_LOOKUP_OPTIONS;
    }

    return normalizeLookupOptions(response.data);
  } catch (error) {
    logger.error("Failed to fetch lookup options", {
      zoneId,
      wardId,
      error: error as Error,
    });
    return EMPTY_LOOKUP_OPTIONS;
  }
}
