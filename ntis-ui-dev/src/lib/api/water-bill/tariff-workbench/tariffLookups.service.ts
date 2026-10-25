import { getTariffWorkbenchesPaged, getTariffWorkbenchById } from "./tariffWorkbench.service";
import { getFinancialYearsPaged } from "@/lib/api/financial-year.service";
import { sanitizePagedQuery } from "@/lib/utils/water-bill/utils";
import { logger } from "@/lib/utils/server-logger";
import type {
  TariffWorkbench,
  TariffWorkbenchPagedResponse,
  TariffWorkbenchQueryParameters,
} from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

const ALLOWED_SORT_FIELDS = new Set([
  "id", "tariffcode", "tariffname", "financialyearid", "connectiontypeid",
  "connectioncategoryid", "effectivefrom", "effectiveto",
  "versionno", "status", "isactive", "year", "yearcode", "description",
]);

export function sanitizeTariffQueryParams(
  params?: TariffWorkbenchQueryParameters
): TariffWorkbenchQueryParameters {
  const base = sanitizePagedQuery(params, ALLOWED_SORT_FIELDS);
  return {
    ...base,
    tariffCode: params?.tariffCode?.trim() || undefined,
  } as TariffWorkbenchQueryParameters;
}

export async function fetchTariffWorkbenchesServer(
  params?: TariffWorkbenchQueryParameters
): Promise<TariffWorkbenchPagedResponse> {
  const sanitized = sanitizeTariffQueryParams(params);
  const response = await getTariffWorkbenchesPaged(sanitized);
  if (response.success && response.data && Array.isArray(response.data.items)) {
    return response.data;
  }
  logger.error("Failed to fetch tariff workbenches list from server API", {
    sanitized,
    statusCode: response.statusCode,
    error: response.error,
  });
  return {
    items: [],
    totalCount: 0,
    pageNumber: params?.pageNumber ?? 1,
    pageSize: params?.pageSize ?? 10,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

export async function fetchTariffWorkbenchByIdServer(id: number): Promise<TariffWorkbench | null> {
  const targetId = Number(id);
  if (!Number.isFinite(targetId) || targetId <= 0) return null;
  const response = await getTariffWorkbenchById(targetId);
  if (response.success && response.data && Number(response.data.id) === targetId) {
    return response.data;
  }
  if (response.statusCode === 404) return null;
  logger.error("Error in fetchTariffWorkbenchByIdServer", { targetId, error: response.error });
  return null;
}

import {
  FINANCIAL_YEAR_CONFIG,
  CONNECTION_TYPE_CONFIG,
  CONNECTION_CATEGORY_CONFIG,
  TAP_SIZE_CONFIG,
  normalizeMasterToOptions,
  fetchMasterLookupOptions,
  type MasterLookupOption,
} from "./tariffLookupNormalization";

export interface TariffPageLookups {
  financialYearOptions: MasterLookupOption[];
  connectionTypeOptions: MasterLookupOption[];
  connectionCategoryOptions: MasterLookupOption[];
  tapSizeOptions: MasterLookupOption[];
}

export async function getTariffPageLookups(): Promise<TariffPageLookups> {
  const [fyResult, ctResult, ccResult, tapSizeResult] = await Promise.allSettled([
    getFinancialYearsPaged(1, 2000),
    fetchMasterLookupOptions("/ConnectionTypeMaster?PageNumber=1&PageSize=2000", CONNECTION_TYPE_CONFIG),
    fetchMasterLookupOptions("/ConnectionCategoryMaster?PageNumber=1&PageSize=2000", CONNECTION_CATEGORY_CONFIG),
    fetchMasterLookupOptions("/TapSizeMaster?PageNumber=1&PageSize=2000", TAP_SIZE_CONFIG),
  ]);

  if (fyResult.status === "rejected") {
    throw new Error("Failed to load required Financial Year master data");
  }

  const financialYearOptions = fyResult.status === "fulfilled"
    ? normalizeMasterToOptions(fyResult.value, FINANCIAL_YEAR_CONFIG)
    : [];
  const connectionTypeOptions = ctResult.status === "fulfilled" ? ctResult.value : [];
  const connectionCategoryOptions = ccResult.status === "fulfilled" ? ccResult.value : [];
  const tapSizeOptions = tapSizeResult.status === "fulfilled" ? tapSizeResult.value : [];

  return { financialYearOptions, connectionTypeOptions, connectionCategoryOptions, tapSizeOptions };
}

export const getTariffFormLookups = getTariffPageLookups;
export type TariffFormLookups = TariffPageLookups;
