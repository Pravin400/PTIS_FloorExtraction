"use server";

import {
  getSection129Schedule,
  applySection129A,
  recalculateSection129A,
  exportSection129ScheduleCsv,
  exportSection129SchedulePdf,
  searchSection129ScheduleByOldGpNo,
} from "@/lib/api/section129/section129.service";
import { searchProperties } from "@/lib/api/property-search";
import type { Section129ApplyRequest, Section129RecalculateRequest, Section129ScheduleApi } from "@/types/section129.types";
import { logger } from "@/lib/utils/logger";

export interface Section129ActionResult {
  success: boolean;
  data: Section129ScheduleApi | null;
  error?: string;
}

/** Resolves a UPIC or Old GP number to a propertyId via property search, then loads its Section 129A schedule. */
export async function searchSection129PropertyByUpicAction(upic: string): Promise<Section129ActionResult> {
  const trimmed = upic.trim();
  if (!trimmed) {
    return { success: false, data: null, error: "Enter a UPIC Number to search." };
  }

  try {
    let searchResult = await searchProperties({ upicId: trimmed, pageNumber: 1, pageSize: 1 });
    let match = searchResult.items?.[0];

    if (!match) {
      searchResult = await searchProperties({ oldPropertyNo: trimmed, pageNumber: 1, pageSize: 1 });
      match = searchResult.items?.[0];
    }

    if (!match) {
      return { success: false, data: null, error: `No property found for '${trimmed}'.` };
    }

    return await getSection129ScheduleAction(match.propertyId);
  } catch (err) {
    logger.error("Section 129A property search failed", { error: err as Error });
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Property search failed",
    };
  }
}

/** Resolves a property by "Old Gram Panchayat Number" (PropertyMastOld.OldEgovNo, comma-separated values accepted). */
export async function searchSection129PropertyByOldGpNoAction(oldGpNo: string): Promise<Section129ActionResult> {
  const trimmed = oldGpNo.trim();
  if (!trimmed) {
    return { success: false, data: null, error: "Enter an Old Gram Panchayat Number to search." };
  }

  try {
    const result = await searchSection129ScheduleByOldGpNo(trimmed);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, data: null, error: result.error };
  } catch (err) {
    logger.error("Section 129A Old Gram Panchayat Number search failed", { error: err as Error });
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Old Gram Panchayat Number search failed",
    };
  }
}

export async function getSection129ScheduleAction(propertyId: number): Promise<Section129ActionResult> {
  try {
    const result = await getSection129Schedule(propertyId);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, data: null, error: result.error };
  } catch (err) {
    logger.error(`Failed to fetch Section 129A schedule for property ${propertyId}`, { error: err as Error });
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch Section 129A schedule",
    };
  }
}

export async function applySection129AAction(
  propertyId: number,
  request: Section129ApplyRequest
): Promise<Section129ActionResult> {
  try {
    const result = await applySection129A(propertyId, request);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, data: null, error: result.error };
  } catch (err) {
    logger.error(`Failed to apply Section 129A for property ${propertyId}`, { error: err as Error });
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Failed to apply Section 129A",
    };
  }
}

export async function recalculateSection129AAction(
  propertyId: number,
  request?: Section129RecalculateRequest
): Promise<Section129ActionResult> {
  try {
    const result = await recalculateSection129A(propertyId, request);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, data: null, error: result.error };
  } catch (err) {
    logger.error(`Failed to recalculate Section 129A for property ${propertyId}`, { error: err as Error });
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Failed to recalculate Section 129A",
    };
  }
}

export interface Section129CsvExportActionResult {
  success: boolean;
  data: { base64: string; contentType: string; contentDisposition: string | null } | null;
  error?: string;
}

export async function exportSection129ScheduleCsvAction(propertyId: number): Promise<Section129CsvExportActionResult> {
  try {
    const result = await exportSection129ScheduleCsv(propertyId);
    return { success: true, data: result };
  } catch (err) {
    logger.error(`Failed to export Section 129A schedule CSV for property ${propertyId}`, { error: err as Error });
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Failed to export Section 129A schedule CSV",
    };
  }
}

export interface Section129PdfExportActionResult {
  success: boolean;
  data: { base64: string; contentType: string; contentDisposition: string | null } | null;
  error?: string;
}

export async function exportSection129SchedulePdfAction(propertyId: number): Promise<Section129PdfExportActionResult> {
  try {
    const result = await exportSection129SchedulePdf(propertyId);
    return { success: true, data: result };
  } catch (err) {
    logger.error(`Failed to export Section 129A schedule PDF for property ${propertyId}`, { error: err as Error });
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Failed to export Section 129A schedule PDF",
    };
  }
}


export interface WardDropdownOption {
  id: number;
  wardNo: string;
  description: string | null;
}

export interface WardPropertyOptionDto {
  propertyId: number;
  propertyNo: string;
  partitionNo: string | null;
  upicId: string | null;
}

export async function getWardsDropdownAction(): Promise<{ success: boolean; data: WardDropdownOption[]; error?: string }> {
  try {
    const { getWards } = await import("@/lib/api/ward.services");
    const res = await getWards(1, -1);
    const items = res?.items ?? [];
    return {
      success: true,
      data: items.map((w) => ({
        id: w.id,
        wardNo: w.wardNo,
        description: w.description ?? null,
      })),
    };
  } catch (err) {
    logger.error("Failed to fetch wards dropdown", { error: err as Error });
    return { success: false, data: [], error: "Failed to fetch wards" };
  }
}

interface WardPropertyOptionRaw {
  propertyId: number;
  propertyNo: string;
  partitionNo: string | null;
  upic: string | null;
}

interface WardPropertiesResponseRaw {
  success?: boolean;
  items?: WardPropertyOptionRaw[];
}

/** Fetches every property + partition row for a ward via `/Property/section129a-ward-properties` —
 *  queried directly from PropertyMast on the backend, NOT a search/assessment-grid endpoint, so a
 *  property that hasn't been assessed yet (no PropertyDetails row — common for Section 129A's
 *  newly-included/extended municipal area properties) still appears. Used to build the single
 *  "Property No" dropdown that shows both plain properties ("10") and their partitions ("10-A6"),
 *  bound by `propertyId`. */
export async function getPropertyOptionsByWardAction(
  wardId: number
): Promise<{ success: boolean; data: WardPropertyOptionDto[]; error?: string }> {
  if (!wardId || wardId <= 0) {
    return { success: false, data: [], error: "WardId is required" };
  }

  try {
    const { apiClient } = await import("@/services/api.service");
    const response = await apiClient.get<WardPropertiesResponseRaw>(
      `/Property/section129a-ward-properties?wardId=${wardId}`
    );

    if (!response.success || !response.data?.success) {
      return { success: false, data: [], error: response.error || "Failed to fetch properties" };
    }

    const items = (response.data.items ?? []).map((it) => ({
      propertyId: it.propertyId,
      propertyNo: it.propertyNo,
      partitionNo: it.partitionNo || null,
      upicId: it.upic || null,
    }));

    return { success: true, data: items };
  } catch (err) {
    logger.error("Failed to fetch ward property options", { error: err as Error });
    return { success: false, data: [], error: "Failed to fetch properties" };
  }
}

