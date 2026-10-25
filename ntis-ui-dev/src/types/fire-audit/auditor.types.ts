import { z } from "zod";
import type { LucideIcon } from "lucide-react";
import type { AuditorFilterLookupData } from "./catalog.types";
import {
  AUDITOR_APPLICATION_STATUSES,
  type AuditorApplicationStatus,
  AUDITOR_RISK_CATEGORIES,
  type AuditorRiskCategory,
} from "@/constants/fire-audit/auditor.constants";

export * from "@/constants/fire-audit/auditor.constants";
export * from "@/services/fire-audit/auditor.mapper";

export const AUDITOR_APPLICATION_TYPES = [
  "New FSC",
  "New Audit",
  "Renewal",
  "Renewal Audit",
  "Periodic Audit",
  "Unknown",
] as const;

export type AuditorApplicationType = (typeof AUDITOR_APPLICATION_TYPES)[number];

export const AUDITOR_DATE_FILTERS = [
  "today",
  "this_week",
  "thisWeek",
  "last_7",
  "last_30",
  "this_month",
  "thisMonth",
  "dateToday",
  "dateThisWeek",
  "dateThisMonth",
] as const;

export type AuditorDateFilter = (typeof AUDITOR_DATE_FILTERS)[number];

export const AUDITOR_PAGE_SIZES = [10, 25, 50, 100] as const;
export type AuditorPageSize = (typeof AUDITOR_PAGE_SIZES)[number];

function sanitizeParamString(val: unknown, maxLength = 100): string | undefined {
  if (Array.isArray(val)) val = val[0];
  if (typeof val === "string") {
    const cleaned = val.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, maxLength);
    if (cleaned && cleaned.toUpperCase() !== "ALL") return cleaned;
  }
  return undefined;
}

const pageSchema = z.preprocess((val) => {
  const v = Array.isArray(val) ? val[0] : val;
  const num = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : 1;
  return isNaN(num) || num < 1 ? 1 : Math.floor(num);
}, z.number().int().min(1).default(1));

const pageSizeSchema = z.preprocess((val) => {
  const v = Array.isArray(val) ? val[0] : val;
  const num = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : 10;
  return (AUDITOR_PAGE_SIZES as readonly number[]).includes(num) ? num : 10;
}, z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]).default(10));

const statusSchema = z.preprocess((val) => {
  const v = Array.isArray(val) ? val[0] : val;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed.toUpperCase() === "ALL") return undefined;
    if ((AUDITOR_APPLICATION_STATUSES as readonly string[]).includes(trimmed)) return trimmed;
  }
  return undefined;
}, z.enum(AUDITOR_APPLICATION_STATUSES).optional());

const appTypeSchema = z.preprocess((val) => {
  const v = Array.isArray(val) ? val[0] : val;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed.toUpperCase() === "ALL") return undefined;
    if ((AUDITOR_APPLICATION_TYPES as readonly string[]).includes(trimmed)) return trimmed;
  }
  return undefined;
}, z.enum(AUDITOR_APPLICATION_TYPES).optional());

const riskCategorySchema = z.preprocess((val) => {
  const v = Array.isArray(val) ? val[0] : val;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed.toUpperCase() === "ALL") return undefined;
    if ((AUDITOR_RISK_CATEGORIES as readonly string[]).includes(trimmed)) return trimmed;
  }
  return undefined;
}, z.enum(AUDITOR_RISK_CATEGORIES).optional());

const dateFilterSchema = z.preprocess((val) => {
  const v = Array.isArray(val) ? val[0] : val;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed.toUpperCase() === "ALL") return undefined;
    if ((AUDITOR_DATE_FILTERS as readonly string[]).includes(trimmed as AuditorDateFilter)) return trimmed;
  }
  return undefined;
}, z.enum(AUDITOR_DATE_FILTERS).optional());

const sortOrderSchema = z.preprocess((val) => {
  const v = Array.isArray(val) ? val[0] : val;
  if (typeof v === "string") {
    const lower = v.trim().toLowerCase();
    if (lower === "asc" || lower === "desc") return lower;
  }
  return undefined;
}, z.enum(["asc", "desc"]).optional());

export const auditorFiltersSchema = z
  .object({
    searchTerm: z.unknown().optional(),
    q: z.unknown().optional(),
    status: statusSchema,
    appType: appTypeSchema,
    buildingType: z.unknown().optional(),
    occupancyType: z.unknown().optional(),
    node: z.unknown().optional(),
    sector: z.unknown().optional(),
    wardNo: z.unknown().optional(),
    riskCategory: riskCategorySchema,
    dateFilter: dateFilterSchema,
    sortBy: z.unknown().optional(),
    sortOrder: sortOrderSchema,
    page: pageSchema,
    pageSize: pageSizeSchema,
  })
  .transform((data) => ({
    searchTerm:
      sanitizeParamString(data.searchTerm) ?? sanitizeParamString(data.q),
    status: data.status,
    appType: data.appType,
    buildingType:
      sanitizeParamString(data.buildingType) ??
      sanitizeParamString(data.occupancyType),
    node: sanitizeParamString(data.node),
    sector: sanitizeParamString(data.sector),
    wardNo: sanitizeParamString(data.wardNo),
    riskCategory: data.riskCategory,
    dateFilter: data.dateFilter,
    sortBy: sanitizeParamString(data.sortBy),
    sortOrder: data.sortOrder,
    page: data.page,
    pageSize: data.pageSize,
  }));

export interface AuditorDashboardFilters {
  searchTerm?: string;
  status?: AuditorApplicationStatus | string;
  appType?: AuditorApplicationType | string;
  buildingType?: string;
  node?: string;
  sector?: string;
  wardNo?: string;
  riskCategory?: AuditorRiskCategory | string;
  dateFilter?: AuditorDateFilter | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export function parseAuditorFilters(rawParams: unknown): AuditorDashboardFilters {
  const input = typeof rawParams === "object" && rawParams !== null ? rawParams : {};
  const parsed = auditorFiltersSchema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }
  return {
    page: 1,
    pageSize: 10,
  };
}

export interface AuditorApplication extends Record<string, unknown> {
  id: string;
  appDate: string;
  appType: AuditorApplicationType;
  buildingName: string;
  propertyId: string;
  applicant: string;
  mobile: string;
  email: string;
  address: string;
  node: string;
  sector: string;
  wardNo: string;
  buildingType: string;
  occupancy: string;
  height: string;
  floors: string;
  plotArea: string;
  builtupArea: string;
  score: number;
  days: string;
  sla?: string;
  slaDaysLeft?: number;
  dueDate: string;
  riskCategory: AuditorRiskCategory;
  auditor: string;
  auditorId: string;
  auditorDesignation: string;
  allocationDate: string;
  inspectionDate: string;
  reportDate: string;
  reportNo: string;
  deficienciesCount: number;
  status: AuditorApplicationStatus;
  certNo?: string;
  issueDate?: string;
  createdAt?: string;
  docs?: unknown;
}

export interface AuditorDashboardStats {
  submitted: number;
  pending: number;
  returned: number;
  reinspect: number;
  approved: number;
  issued: number;
  total: number;
  today?: number;
}

export type AuditorDashboardStatsKey =
  | "submitted"
  | "pending"
  | "returned"
  | "reinspect"
  | "approved"
  | "issued";

export interface AuditorRecentActivityItem {
  id: string;
  title: string;
  building: string;
  timestamp: string;
  createdAt?: string;
  type?: string;
  appId?: string;
}

export interface AuditorDashboardResponse {
  stats: AuditorDashboardStats;
  applications: AuditorApplication[];
  totalRecords: number;
  filteredCount: number;
  todayCount?: number;
}

export type FilterFieldKey =
  | "appType"
  | "buildingType"
  | "node"
  | "sector"
  | "wardNo"
  | "dateFilter"
  | "riskCategory";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterFieldConfig {
  key: FilterFieldKey;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  options: FilterOption[];
}

export interface AuditorFilterDraftState {
  appType: string;
  buildingType: string;
  node: string;
  sector: string;
  wardNo: string;
  dateFilter: string;
  riskCategory: string;
}

export interface AuditorFiltersBarProps {
  filters: AuditorDashboardFilters;
  onApplyFilters: (newFilters: AuditorDashboardFilters) => void;
  onResetFilters: () => void;
  lookups?: AuditorFilterLookupData;
  isLoading?: boolean;
  className?: string;
}

