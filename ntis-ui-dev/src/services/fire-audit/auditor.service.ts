import "server-only";

import { apiClient } from "@/services/api.service";
import { createLogger } from "@/lib/utils/server-logger";
import type {
  AuditorDashboardFilters,
  AuditorDashboardResponse,
  AuditorDashboardStats,
} from "@/types/fire-audit/auditor.types";
import { calculateStatsFromApplications } from "@/types/fire-audit/auditor.types";
import {
  isAuditorApplicationShape,
  normalizeAuditorApplication,
  isAuditorDashboardStatsShape,
  normalizeAuditorDashboardStats,
} from "./auditor.mapper";
import { parseFiltersFromSearchParams } from "@/lib/utils/fire-audit/auditor-params";

const AUDITOR_APPLICATIONS_ENDPOINT = "/FireAudit/auditor/applications";

const logger = createLogger("FireAudit/AuditorService");

const EMPTY_STATS: AuditorDashboardStats = {
  submitted: 0,
  pending: 0,
  returned: 0,
  reinspect: 0,
  approved: 0,
  issued: 0,
  total: 0,
  today: 0,
};

const EMPTY_RESPONSE: AuditorDashboardResponse = {
  stats: EMPTY_STATS,
  applications: [],
  totalRecords: 0,
  filteredCount: 0,
  todayCount: 0,
};

/**
 * Fetches auditor dashboard data via shared apiClient.
 * When backend data is not available or empty, returns empty data structures
 * (0 KPI counts, empty applications list, and 0 total records).
 */
export async function getAuditorDashboardData(
  rawFilters: AuditorDashboardFilters = {}
): Promise<AuditorDashboardResponse> {
  const filters = parseFiltersFromSearchParams(rawFilters);
  const query = new URLSearchParams();
  if (filters.page) query.set("page", String(filters.page));
  if (filters.pageSize) query.set("pageSize", String(filters.pageSize));
  if (filters.searchTerm) query.set("q", filters.searchTerm);
  if (filters.status) query.set("status", filters.status);
  if (filters.appType) query.set("appType", filters.appType);
  if (filters.buildingType) query.set("buildingType", filters.buildingType);
  if (filters.node) query.set("node", filters.node);
  if (filters.sector) query.set("sector", filters.sector);
  if (filters.wardNo) query.set("wardNo", filters.wardNo);
  if (filters.riskCategory) query.set("riskCategory", filters.riskCategory);
  if (filters.dateFilter) query.set("dateFilter", filters.dateFilter);
  if (filters.sortBy) query.set("sortBy", filters.sortBy);
  if (filters.sortOrder) query.set("sortOrder", filters.sortOrder);

  const queryString = query.toString();
  const endpoint = queryString
    ? `${AUDITOR_APPLICATIONS_ENDPOINT}?${queryString}`
    : AUDITOR_APPLICATIONS_ENDPOINT;

  logger.info("[AuditorService] Calling backend API for auditor applications", {
    endpoint,
    filters,
  });

  try {
    const res = await apiClient.get<unknown>(endpoint);

    if (res.success && res.data) {
      logger.info("[AuditorService] Successfully received response from backend API", {
        statusCode: res.statusCode,
      });

      const raw = res.data as Record<string, unknown>;

      const rawApplications = Array.isArray(raw?.applications)
        ? raw.applications
        : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw)
            ? raw
            : [];

      const applications = rawApplications
        .filter(isAuditorApplicationShape)
        .map(normalizeAuditorApplication);

      const stats: AuditorDashboardStats = isAuditorDashboardStatsShape(raw?.stats)
        ? normalizeAuditorDashboardStats(raw.stats)
        : applications.length > 0
          ? calculateStatsFromApplications(applications)
          : EMPTY_STATS;
      const totalRecords =
        typeof raw?.totalRecords === "number"
          ? raw.totalRecords
          : typeof raw?.totalCount === "number"
            ? raw.totalCount
            : applications.length;

      const filteredCount =
        typeof raw?.filteredCount === "number"
          ? raw.filteredCount
          : totalRecords;

      const todayCount =
        typeof raw?.todayCount === "number"
          ? raw.todayCount
          : typeof stats.today === "number"
            ? stats.today
            : 0;

      return {
        stats,
        applications,
        totalRecords,
        filteredCount,
        todayCount,
      };
    }

    logger.info("[AuditorService] Backend returned no data or endpoint not yet available, returning empty state", {
      statusCode: res.statusCode,
      error: res.error,
    });
    return EMPTY_RESPONSE;
  } catch (err: unknown) {
    logger.error("[AuditorService] Error fetching from backend API, returning empty state", {
      operation: "getAuditorDashboardData",
    }, err);
    return EMPTY_RESPONSE;
  }
}
