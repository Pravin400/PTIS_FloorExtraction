import { apiClient } from "@/services/api.service";
import { logger } from "@/lib/utils/server-logger";

export interface MasterLookupOption {
  value: string;
  label: string;
}

export interface MasterOptionConfig {
  masterName: string;
  extractLabel: (item: Record<string, unknown>) => string | null;
  idKeys?: readonly string[];
}

const DEFAULT_ID_KEYS = ["id", "Id", "ID", "value", "Value"] as const;

/**
 * Recursively unwraps various API response envelope shapes to extract an array of record objects.
 * Handles:
 * - Direct array: `[...]`
 * - Standard paged: `{ items: [...] }` or `{ Items: [...] }`
 * - Nested data envelope: `{ data: [...] }` or `{ data: { items: [...] } }` or `{ data: { data: [...] } }`
 * - Result envelope: `{ result: [...] }` or `{ result: { items: [...] } }`
 * - Records / List envelopes: `{ records: [...] }`, `{ list: [...] }`
 */
export function extractMasterPayloadItems(raw: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 3 || raw == null || typeof raw !== "object") {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item)
    );
  }

  const obj = raw as Record<string, unknown>;

  // Check direct items / Items
  if (Array.isArray(obj.items)) {
    return extractMasterPayloadItems(obj.items, depth + 1);
  }
  if (Array.isArray(obj.Items)) {
    return extractMasterPayloadItems(obj.Items, depth + 1);
  }

  // Check data / Data envelope
  const data = obj.data ?? obj.Data;
  if (data != null) {
    if (Array.isArray(data)) {
      return extractMasterPayloadItems(data, depth + 1);
    }
    if (typeof data === "object") {
      const nestedItems = extractMasterPayloadItems(data, depth + 1);
      if (nestedItems.length > 0) return nestedItems;
    }
  }

  // Check result / Result envelope
  const result = obj.result ?? obj.Result;
  if (result != null) {
    if (Array.isArray(result)) {
      return extractMasterPayloadItems(result, depth + 1);
    }
    if (typeof result === "object") {
      const nestedResult = extractMasterPayloadItems(result, depth + 1);
      if (nestedResult.length > 0) return nestedResult;
    }
  }

  // Check records / Records
  if (Array.isArray(obj.records)) {
    return extractMasterPayloadItems(obj.records, depth + 1);
  }
  if (Array.isArray(obj.Records)) {
    return extractMasterPayloadItems(obj.Records, depth + 1);
  }

  // Check list / List
  if (Array.isArray(obj.list)) {
    return extractMasterPayloadItems(obj.list, depth + 1);
  }
  if (Array.isArray(obj.List)) {
    return extractMasterPayloadItems(obj.List, depth + 1);
  }

  return [];
}

/**
 * Validates that an ID is a legitimate, non-empty, non-zero identifier.
 */
function isValidIdentifier(id: unknown): boolean {
  if (id == null) return false;
  if (typeof id === "number") {
    return Number.isFinite(id) && id > 0;
  }
  if (typeof id === "string") {
    const trimmed = id.trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null" || trimmed === "NaN") {
      return false;
    }
    const num = Number(trimmed);
    if (Number.isFinite(num)) {
      return num > 0;
    }
    return true;
  }
  return false;
}

/**
 * Normalizes any backend master response into a validated array of dropdown options { value, label }.
 */
export function normalizeMasterToOptions(
  raw: unknown,
  config: MasterOptionConfig
): MasterLookupOption[] {
  const items = extractMasterPayloadItems(raw);

  if (items.length === 0 && raw != null && typeof raw === "object") {
    const keys = Object.keys(raw as object);
    if (keys.length > 0 && !("items" in (raw as object) && Array.isArray((raw as Record<string, unknown>).items))) {
      logger.warn(`Master payload structure for [${config.masterName}] contains no recognizable list envelope`, {
        masterName: config.masterName,
        keys,
      });
    }
  }

  const idKeys = config.idKeys ?? DEFAULT_ID_KEYS;
  const options: MasterLookupOption[] = [];
  const seenValues = new Set<string>();

  for (const item of items) {
    let rawId: unknown = undefined;
    for (const key of idKeys) {
      if (item[key] !== undefined && item[key] !== null) {
        rawId = item[key];
        break;
      }
    }

    if (!isValidIdentifier(rawId)) {
      continue;
    }

    const rawLabel = config.extractLabel(item);
    if (!rawLabel || typeof rawLabel !== "string") {
      continue;
    }

    const label = rawLabel.trim();
    if (
      !label ||
      label === "undefined" ||
      label === "null" ||
      label === "[object Object]"
    ) {
      continue;
    }

    const value = String(rawId).trim();
    if (!seenValues.has(value)) {
      seenValues.add(value);
      options.push({ value, label });
    }
  }

  return options;
}

// ==========================================
// Field Extractors for Specific Master Types
// ==========================================

export function extractFinancialYearLabel(item: Record<string, unknown>): string | null {
  const yearCode = item.yearCode ?? item.YearCode;
  if (typeof yearCode === "string" && yearCode.trim()) return yearCode.trim();

  const year = item.year ?? item.Year;
  if (year != null && String(year).trim()) return String(year).trim();

  const desc = item.yearDescription ?? item.YearDescription ?? item.description ?? item.Description;
  if (typeof desc === "string" && desc.trim()) return desc.trim();

  return null;
}

export function extractConnectionTypeLabel(item: Record<string, unknown>): string | null {
  const connType = item.connectionType ?? item.ConnectionType;
  if (typeof connType === "string" && connType.trim()) return connType.trim();

  const code = item.connectionTypeCode ?? item.ConnectionTypeCode;
  if (typeof code === "string" && code.trim()) return code.trim();

  const name = item.name ?? item.Name;
  if (typeof name === "string" && name.trim()) return name.trim();

  const desc = item.description ?? item.Description;
  if (typeof desc === "string" && desc.trim()) return desc.trim();

  return null;
}

export function extractConnectionCategoryLabel(item: Record<string, unknown>): string | null {
  const category = item.connectionCategory ?? item.ConnectionCategory;
  if (typeof category === "string" && category.trim()) return category.trim();

  const catName =
    item.connectionCategoryName ??
    item.ConnectionCategoryName ??
    item.categoryName ??
    item.CategoryName;
  if (typeof catName === "string" && catName.trim()) return catName.trim();

  const code = item.connectionCategoryCode ?? item.ConnectionCategoryCode;
  if (typeof code === "string" && code.trim()) return code.trim();

  const name = item.name ?? item.Name;
  if (typeof name === "string" && name.trim()) return name.trim();

  return null;
}

export function extractTapSizeLabel(item: Record<string, unknown>): string | null {
  const name = item.tapSizeName ?? item.TapSizeName;
  if (typeof name === "string" && name.trim()) return name.trim();

  const size = item.tapSize ?? item.TapSize;
  if (typeof size === "string" && size.trim()) return size.trim();

  const nominalVal = item.nominalSizeValue ?? item.NominalSizeValue;
  const sizeUnit = item.sizeUnit ?? item.SizeUnit;
  if (nominalVal != null && String(nominalVal).trim()) {
    const unitStr = typeof sizeUnit === "string" && sizeUnit.trim() ? ` ${sizeUnit.trim()}` : "";
    return `${nominalVal}${unitStr}`.trim();
  }

  const rawSize = item.size ?? item.Size ?? item.sizeInInches ?? item.SizeInInches;
  if (rawSize != null && String(rawSize).trim()) return String(rawSize).trim();

  const code = item.tapSizeCode ?? item.TapSizeCode;
  if (typeof code === "string" && code.trim()) return code.trim();

  return null;
}

// Master Configuration Presets
export const FINANCIAL_YEAR_CONFIG: MasterOptionConfig = {
  masterName: "FinancialYearMaster",
  extractLabel: extractFinancialYearLabel,
};

export const CONNECTION_TYPE_CONFIG: MasterOptionConfig = {
  masterName: "ConnectionTypeMaster",
  extractLabel: extractConnectionTypeLabel,
};

export const CONNECTION_CATEGORY_CONFIG: MasterOptionConfig = {
  masterName: "ConnectionCategoryMaster",
  extractLabel: extractConnectionCategoryLabel,
};

export const TAP_SIZE_CONFIG: MasterOptionConfig = {
  masterName: "TapSizeMaster",
  extractLabel: extractTapSizeLabel,
};

/**
 * Fetches a master endpoint via apiClient, validates response status and unwraps the payload into options.
 */
export async function fetchMasterLookupOptions(
  endpoint: string,
  config: MasterOptionConfig
): Promise<MasterLookupOption[]> {
  try {
    const res = await apiClient.get<Record<string, unknown>>(endpoint);
    if (!res || !res.success) {
      logger.error(`Master API call failed for ${config.masterName}`, {
        endpoint,
        statusCode: res?.statusCode,
        error: res?.error,
      });
      return [];
    }

    if (!res.data) {
      logger.warn(`Master API response for ${config.masterName} succeeded but contained null data`, {
        endpoint,
      });
      return [];
    }

    return normalizeMasterToOptions(res.data, config);
  } catch (err) {
    logger.error(`Exception while fetching master options for ${config.masterName}`, { endpoint }, err);
    return [];
  }
}
