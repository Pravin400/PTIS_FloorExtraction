import "server-only";

import { apiClient } from "@/services/api.service";
import { createLogger } from "@/lib/utils/server-logger";
import type {
  FireAuditCatalogId,
  FireAuditCatalogRow,
  JurisdictionNodeItem,
  JurisdictionHierarchyData,
  AuditorFilterLookupData,
} from "@/types/fire-audit/catalog.types";

const logger = createLogger("FireAudit/CatalogService");

export type {
  JurisdictionNodeItem,
  JurisdictionHierarchyData,
  AuditorFilterLookupData,
};



// Fallback catalog seeds aligned with FAS 03_seed_data.sql
const DEFAULT_OCCUPANCY_SEEDS: FireAuditCatalogRow[] = [
  { id: 1, code: "BUS", name: "Business", detail: "Offices, banks and professional establishments.", isActive: true },
  { id: 2, code: "INS", name: "Institutional", detail: "Hospitals, nursing homes and custodial institutions.", isActive: true },
  { id: 3, code: "MER", name: "Mercantile", detail: "Shops, retail markets and malls.", isActive: true },
  { id: 4, code: "ASM", name: "Assembly", detail: "Theatres, halls, places of worship and assembly buildings.", isActive: true },
  { id: 5, code: "RES", name: "Residential", detail: "Dwellings, apartments, hostels and residential premises.", isActive: true },
  { id: 6, code: "EDU", name: "Educational", detail: "Schools, colleges and training institutions.", isActive: true },
  { id: 7, code: "IND", name: "Industrial", detail: "Factories and industrial plants.", isActive: true },
  { id: 8, code: "STO", name: "Storage", detail: "Warehouses and storage facilities.", isActive: true },
  { id: 9, code: "HAZ", name: "Hazardous", detail: "Buildings storing or processing hazardous materials.", isActive: true },
];

const DEFAULT_APPLICATION_TYPE_SEEDS: FireAuditCatalogRow[] = [
  { id: 1, code: "New FSC", name: "New FSC", detail: "Initial fire safety certificate audit.", isActive: true },
  { id: 2, code: "New Audit", name: "New Audit", detail: "Initial premises comprehensive audit.", isActive: true },
  { id: 3, code: "Renewal", name: "Renewal", detail: "Certificate renewal compliance.", isActive: true },
  { id: 4, code: "Renewal Audit", name: "Renewal Audit", detail: "Periodic renewal fire audit.", isActive: true },
  { id: 5, code: "Periodic Audit", name: "Periodic Audit", detail: "Mandatory statutory interval inspection.", isActive: true },
];

const DEFAULT_JURISDICTION_HIERARCHY: JurisdictionHierarchyData = {
  nodes: [
    { code: "PAN", name: "Panvel" },
    { code: "NPAN", name: "New Panvel" },
    { code: "KAL", name: "Kalamboli" },
    { code: "KHA", name: "Kharghar" },
    { code: "TAL", name: "Taloja" },
    { code: "KAM", name: "Kamothe" },
  ],
  sectors: [
    "Sector 4",
    "Sector 8",
    "Sector 12",
    "Sector 15",
    "Sector 20",
    "Sector 45",
  ],
  wards: [
    "Ward 01",
    "Ward 02",
    "Ward 03",
    "Ward 04",
    "Ward 05",
    "Ward 06",
  ],
};

function isCatalogRowShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.code === "string" && typeof v.name === "string";
}

function normalizeCatalogRow(data: Record<string, unknown>, index: number): FireAuditCatalogRow {
  return {
    id: typeof data.id === "number" ? data.id : index + 1,
    code: String(data.code || ""),
    name: String(data.name || ""),
    detail: String(data.detail || data.description || ""),
    isActive: typeof data.isActive === "boolean" ? data.isActive : true,
  };
}

/**
 * Fetches catalog rows from backend catalog service or falls back to seed data.
 */
export async function getFireAuditCatalog(
  catalogId: FireAuditCatalogId
): Promise<FireAuditCatalogRow[]> {
  const endpoint = `/FireAudit/catalog/${catalogId}`;
  logger.info("[CatalogService] Requesting catalog data", { endpoint, catalogId });

  try {
    const res = await apiClient.get<unknown>(endpoint);
    if (res.success && res.data) {
      const raw = res.data as Record<string, unknown>;
      const rawList = Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw)
          ? raw
          : [];

      const rows = rawList
        .filter(isCatalogRowShape)
        .map(normalizeCatalogRow);

      if (rows.length > 0) {
        return rows;
      }
    }
  } catch (err) {
    logger.info("[CatalogService] Backend catalog not available, using seed fallback", {
      catalogId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (catalogId === "occupancy") return DEFAULT_OCCUPANCY_SEEDS;
  if (catalogId === "applicationTypes") return DEFAULT_APPLICATION_TYPE_SEEDS;
  return [];
}

/**
 * Fetches jurisdiction nodes, sectors, and wards hierarchy.
 */
export async function getJurisdictionHierarchy(): Promise<JurisdictionHierarchyData> {
  const endpoint = "/FireAudit/jurisdiction/hierarchy";
  logger.info("[CatalogService] Requesting jurisdiction hierarchy", { endpoint });

  try {
    const res = await apiClient.get<unknown>(endpoint);
    if (res.success && res.data) {
      const raw = res.data as Record<string, unknown>;
      const rawNodes = Array.isArray(raw?.nodes) ? raw.nodes : [];
      const rawSectors = Array.isArray(raw?.sectors) ? raw.sectors : [];
      const rawWards = Array.isArray(raw?.wards) ? raw.wards : [];

      if (rawNodes.length > 0 || rawSectors.length > 0 || rawWards.length > 0) {
        const nodes: JurisdictionNodeItem[] = rawNodes.map((n: unknown, idx: number) => {
          if (typeof n === "string") return { code: n, name: n };
          const item = (typeof n === "object" && n !== null ? n : {}) as Record<string, unknown>;
          return {
            code: String(item.code || item.id || `NODE-${idx + 1}`),
            name: String(item.name || item.title || `Node ${idx + 1}`),
          };
        });

        const sectors = rawSectors.map((s: unknown) =>
          typeof s === "string" ? s : String((s as Record<string, unknown>)?.name || s)
        );

        const wards = rawWards.map((w: unknown) =>
          typeof w === "string" ? w : String((w as Record<string, unknown>)?.name || w)
        );

        return { nodes, sectors, wards };
      }
    }
  } catch (err) {
    logger.info("[CatalogService] Jurisdiction hierarchy not available, using default seed hierarchy", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return DEFAULT_JURISDICTION_HIERARCHY;
}


/**
 * Aggregate lookup service for Auditor Dashboard filters.
 */
export async function getAuditorFilterLookups(): Promise<AuditorFilterLookupData> {
  const [occupancyRows, appTypeRows, jurisdiction] = await Promise.all([
    getFireAuditCatalog("occupancy"),
    getFireAuditCatalog("applicationTypes"),
    getJurisdictionHierarchy(),
  ]);

  return {
    applicationTypes: appTypeRows.map((r) => ({ code: r.code || r.name, name: r.name })),
    occupancies: occupancyRows.map((r) => ({ code: r.name || r.code, name: r.name })),
    nodes: jurisdiction.nodes,
    sectors: jurisdiction.sectors,
    wards: jurisdiction.wards,
    riskCategories: [
      { code: "High", name: "High" },
      { code: "Medium", name: "Medium" },
      { code: "Low", name: "Low" },
    ],
  };
}
