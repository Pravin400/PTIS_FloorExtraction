import { useState, useCallback } from "react";
import {
  UpdateHistoryItem,
  UpdateHistoryDetailItem,
  UpdateHistoryFilterParams,
  ActionResult,
} from "@/types/common-details-update/common-details-update.types";
import { PagedResponse } from "@/types/common.types";
import {
  getUpdateHistoryAction,
  getUpdateHistoryDetailAction,
} from "@/app/[locale]/property-tax/common-details-update/actions";

export interface UsePropertyActivitySearchOptions {
  getUpdateHistoryFn?: (
    params: UpdateHistoryFilterParams
  ) => Promise<ActionResult<PagedResponse<UpdateHistoryItem>>>;
  getUpdateHistoryDetailFn?: (
    activityId: string,
    pageNumber?: number,
    pageSize?: number,
    searchTerm?: string
  ) => Promise<ActionResult<PagedResponse<UpdateHistoryDetailItem>>>;
}

/**
 * Hook to search properties and map them to their corresponding update activities.
 * Uses /api/CommonDetails/update-history to search by PropertyNo (WardNo + PropertyNo + PartitionNo)
 * and compares activityId with /api/CommonDetails/update-activity to display matched activities.
 */
export function usePropertyActivitySearch(options?: UsePropertyActivitySearchOptions) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getUpdateHistoryFn = options?.getUpdateHistoryFn || getUpdateHistoryAction;
  const getUpdateHistoryDetailFn = options?.getUpdateHistoryDetailFn || getUpdateHistoryDetailAction;

  /**
   * Helper function to normalize property string for comparisons
   * Handles formats like 'Ward 3 - 2 - A30', 'Nk7 - 2 - A1', 'Ward 2 - 3 - S1', 'Ward 4-26'
   */
  const normalizePropertySearchStr = (str: string): string => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/\s*-\s*/g, "-") // Normalize " - ", " -", "- " to "-"
      .replace(/\s+/g, " ")     // Collapse multiple spaces
      .trim();
  };

  /**
   * Performs dual-API lookup:
   * 1. Calls update-activity endpoint
   * 2. Calls update-history endpoint with SearchTerm to find property-level records
   * 3. Compares data by activityId and filters activities accordingly
   */
  const searchPropertyActivities = useCallback(
    async (params: UpdateHistoryFilterParams): Promise<PagedResponse<UpdateHistoryItem>> => {
      setIsLoading(true);
      setError(null);

      try {
        const searchTerm = params.SearchTerm?.trim() || "";

        // Call update-activity API
        const activityRes = await getUpdateHistoryFn(params);
        const activityData: PagedResponse<UpdateHistoryItem> =
          activityRes.success && activityRes.data
            ? activityRes.data
            : {
                items: [],
                totalCount: 0,
                pageNumber: params.PageNumber || 1,
                pageSize: params.PageSize || 10,
                totalPages: 1,
                hasPrevious: false,
                hasNext: false,
              };

        if (!searchTerm) {
          setIsLoading(false);
          return activityData;
        }

        const normalizedSearch = normalizePropertySearchStr(searchTerm);

        // Call update-history API with raw search term to find property records (WardNo, PropertyNo, PartitionNo)
        const historyRes = await getUpdateHistoryDetailFn("", 1, 100, searchTerm);
        let historyItems: UpdateHistoryDetailItem[] =
          historyRes.success && historyRes.data?.items ? historyRes.data.items : [];

        // Fallback: If raw search term didn't return history items and normalized search term is different (e.g. spaces around hyphens)
        if (historyItems.length === 0 && normalizedSearch && normalizedSearch !== searchTerm.toLowerCase()) {
          const fallbackRes = await getUpdateHistoryDetailFn("", 1, 100, normalizedSearch);
          if (fallbackRes.success && fallbackRes.data?.items) {
            historyItems = fallbackRes.data.items;
          }
        }

        if (historyItems.length === 0) {
          setIsLoading(false);
          return activityData;
        }

        const matchingActivityIds = new Set<string>();
        const activityMapFromHistory = new Map<string, UpdateHistoryItem>();

        historyItems.forEach((detail) => {
          const actId = detail.activityId != null ? String(detail.activityId) : "";
          if (actId) {
            const detailProp = normalizePropertySearchStr(
              detail.property || `${detail.wardNo || ""}-${detail.propertyNo || ""}-${detail.partitionNo || ""}`
            );
            const detailPropNo = normalizePropertySearchStr(detail.propertyNo || "");
            const detailWardNo = normalizePropertySearchStr(detail.wardNo || "");
            const detailPartitionNo = normalizePropertySearchStr(detail.partitionNo || "");
            const detailCombinedSpace = `${detailWardNo} ${detailPropNo} ${detailPartitionNo}`.trim();

            // Match if normalized search matches any property variations
            if (
              !normalizedSearch ||
              detailProp.includes(normalizedSearch) ||
              detailPropNo.includes(normalizedSearch) ||
              detailWardNo.includes(normalizedSearch) ||
              detailPartitionNo.includes(normalizedSearch) ||
              detailCombinedSpace.includes(normalizedSearch) ||
              String(detail.propertyId) === normalizedSearch
            ) {
              matchingActivityIds.add(actId);
              if (!activityMapFromHistory.has(actId)) {
                activityMapFromHistory.set(actId, {
                  id: Number(actId) || detail.id,
                  activityId: actId,
                  activityType: detail.activityType || "Screen",
                  activityStatus: detail.activityStatus || "Success",
                  createdDate: detail.createdDate || "",
                  records: detail.records || 1,
                  ipAddress: detail.ipAddress || "",
                  remarks: detail.remarks || null,
                  updateName: detail.updateName || "",
                  doneBy: detail.activityDoneBy || detail.doneBy || "",
                  startTime: detail.startTime || "",
                  endTime: detail.endTime || "",
                  duration: detail.duration || 0,
                  activityRemark: detail.activityRemark || null,
                });
              }
            }
          }
        });

        if (matchingActivityIds.size === 0) {
          setIsLoading(false);
          return activityData;
        }

        const existingActivityIds = new Set(
          activityData.items.map((item) => String(item.id || item.activityId))
        );

        const combinedItems: UpdateHistoryItem[] = [...activityData.items];

        matchingActivityIds.forEach((actId) => {
          if (!existingActivityIds.has(actId)) {
            const constructed = activityMapFromHistory.get(actId);
            if (constructed) {
              combinedItems.push(constructed);
              existingActivityIds.add(actId);
            }
          }
        });

        // Filter activities that match property search
        const filteredItems = combinedItems.filter((item) => {
          const itemActId = String(item.id || item.activityId);
          return (
            matchingActivityIds.has(itemActId) ||
            activityData.items.some((orig) => String(orig.id || orig.activityId) === itemActId)
          );
        });

        setIsLoading(false);
        return {
          ...activityData,
          items: filteredItems,
          totalCount: filteredItems.length,
          totalPages: Math.ceil(filteredItems.length / (params.PageSize || 10)) || 1,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        setIsLoading(false);
        return {
          items: [],
          totalCount: 0,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        };
      }
    },
    [getUpdateHistoryFn, getUpdateHistoryDetailFn]
  );

  return {
    isLoading,
    error,
    searchPropertyActivities,
  };
}
