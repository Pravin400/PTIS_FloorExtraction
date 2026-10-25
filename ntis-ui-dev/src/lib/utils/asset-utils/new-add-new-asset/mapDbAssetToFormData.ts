 
import type { AssetFormData } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";

import type {
  RawFieldValue,
  RawDbAssetDetails,
  RawDbAsset,
  PropertySource,
} from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { RawFieldValue, RawDbAssetDetails, RawDbAsset, PropertySource };

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/** Searches candidates across multiple sources and returns the first non-empty value. */
function pick<T = string>(
  sources: Array<PropertySource | undefined | null>,
  ...keys: string[]
): T | undefined {
  for (const src of sources) {
    if (!src) continue;
    const record = src as Record<string, string | number | boolean | null | undefined>;
    for (const key of keys) {
      const pascal = key.charAt(0).toUpperCase() + key.slice(1);
      const val = record[key] ?? record[pascal] ?? record[key.toLowerCase()] ?? record[key.toUpperCase()];
      if (val !== undefined && val !== null && val !== "") return val as T;
    }
  }
  return undefined;
}

const toStringId = (...vals: Array<number | string | undefined | null>): string =>
  String(vals.find((v) => v !== null && v !== undefined && v !== "" && v !== 0 && v !== "0") ?? "");

const toStringNum = (...vals: Array<number | string | undefined | null>): string =>
  String(vals.find((v) => v !== null && v !== undefined && v !== "") ?? "");

const resolveEavValue = (fv: RawFieldValue): string | number | boolean | null | undefined => {
  const raw = fv as Record<string, unknown>;
  return fv.fieldValue ?? fv.FieldValue ??
    (raw.value as string) ?? (raw.Value as string) ??
    fv.textValue ?? fv.TextValue ??
    fv.numberValue ?? fv.NumberValue ??
    fv.booleanValue ?? fv.BooleanValue ??
    fv.dateValue ?? fv.DateValue;
};

function buildDynamicAttrs(rawFieldValues: RawFieldValue[]): Record<string, string | number | boolean> {
  const attrs: Record<string, string | number | boolean> = {};
  for (const fv of rawFieldValues) {
    const raw = fv as Record<string, unknown>;
    const key = (fv.fieldName || fv.FieldName || fv.fieldCode || fv.FieldCode || raw.fieldLabel || raw.FieldLabel) as string | undefined;
    const val = resolveEavValue(fv);
    if (val !== null && val !== undefined) {
      if (key) {
        attrs[key] = val;
        attrs[key.toLowerCase()] = val;
      }
      const defId = (fv.fieldDefinitionId ?? fv.FieldDefinitionId ?? raw.id ?? raw.Id) as number | undefined;
      if (defId) {
        attrs[`field_${defId}`] = val;
        attrs[String(defId)] = val;
      }
    }
  }
  return attrs;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Maps a raw `dbAsset` API response to a `Partial<AssetFormData>` patch.
 * Single source of truth for dbAsset → form state conversion.
 */
export function mapDbAssetToFormData(
  dbAsset: RawDbAsset,
  prev: Partial<AssetFormData>,
  assetId?: number
): Partial<AssetFormData> {
  const rawFieldValues = (Array.isArray(dbAsset.fieldValues)
    ? dbAsset.fieldValues
    : Array.isArray(dbAsset.FieldValues)
    ? dbAsset.FieldValues
    : []) as RawFieldValue[];

  const dynamicAttrs = buildDynamicAttrs(rawFieldValues);
  const details = (dbAsset.details ?? dbAsset.Details ?? dbAsset.assetDetails ?? dbAsset.AssetDetails ?? {}) as RawDbAssetDetails;
  const sources: PropertySource[] = [details, dbAsset];

  const resolvedId = pick<number | string>([dbAsset], "id", "assetId") ?? assetId ?? prev.id ?? 0;
  const resolvedZone = toStringId(pick(sources, "zoneId", "zone"), prev.zoneId, prev.zone);
  const resolvedWard = toStringId(pick(sources, "wardId", "ward"), prev.wardId, prev.ward);
  const resolvedDept = toStringId(pick(sources, "departmentId", "department"), prev.departmentId, prev.department);
  const resolvedMouja = toStringId(pick(sources, "moujaId", "mouja"), prev.moujaId, prev.mouja);
  const resolvedSubzone = toStringId(pick(sources, "subZoneId", "subzoneId", "subzone"), prev.subZoneId, prev.subzone);
  const mpmsNo = pick<string>(sources, "mpmsNo", "MpmsNo") ?? prev.mpmsNo ?? "";
  const pTaxId = pick<string>(sources, "pTaxId", "PTaxId") ?? prev.pTaxId ?? "";

  const resolvedInChargeRegional =
    pick<string>(sources, "inChargeRegionalName", "inChargeNameRegional") ??
    prev.inChargeNameRegional ??
    prev.inChargeRegionalName ??
    "";
  const resolvedDesignation = toStringId(
    pick(sources, "inChargeDesignationId", "inChargeDesignation"),
    prev.inChargeDesignation
  );

  // Resolve categoryId and typeId from the DB asset as the authoritative source.
  // The DB stores them as assetCategoryId / assetTypeId — map to the form field names.
  const dbCategoryId = pick<number>([dbAsset], "assetCategoryId", "categoryId");
  const dbTypeId = pick<number>([dbAsset], "assetTypeId", "typeId");
  const resolvedCategoryId =
    dbCategoryId && !isNaN(Number(dbCategoryId)) && Number(dbCategoryId) > 0
      ? Number(dbCategoryId)
      : typeof prev.categoryId === "number" && prev.categoryId > 0
      ? prev.categoryId
      : undefined;
  const resolvedTypeId =
    dbTypeId && !isNaN(Number(dbTypeId)) && Number(dbTypeId) > 0
      ? Number(dbTypeId)
      : typeof prev.typeId === "number" && prev.typeId > 0
      ? prev.typeId
      : undefined;

  return {
    id: Number(resolvedId),
    assetId: Number(resolvedId),
    ...(resolvedCategoryId !== undefined ? { categoryId: resolvedCategoryId } : {}),
    ...(resolvedTypeId !== undefined ? { typeId: resolvedTypeId } : {}),
    assetName: (() => {
      const raw = (pick<string>([dbAsset, prev], "assetName") ?? "").trim();
      if (!raw) return "";

      const lower = raw.toLowerCase();
      if (lower === "draft asset" || lower === "draft" || lower.startsWith("draft asset")) {
        return "";
      }

      // Collect all category candidates
      const rawCats = [
        dbAsset.assetCategoryName,
        dbAsset.categoryName,
        prev.category,
      ].filter((c): c is string => typeof c === "string" && c.trim().length > 0);

      const catSet = new Set<string>();
      for (const c of rawCats) {
        const trimmed = c.trim().toLowerCase();
        catSet.add(trimmed);
        const withoutAssets = trimmed.replace(/\s*assets?$/i, "").trim();
        if (withoutAssets) catSet.add(withoutAssets);
      }

      // Collect all asset type candidates
      const rawTyps = [
        dbAsset.assetTypeName,
        dbAsset.typeName,
        prev.assetType,
      ].filter((t): t is string => typeof t === "string" && t.trim().length > 0);

      const typSet = new Set<string>();
      for (const t of rawTyps) {
        const trimmed = t.trim().toLowerCase();
        typSet.add(trimmed);
      }

      // If the asset name matches the asset type name directly, return blank
      for (const typ of typSet) {
        if (lower === typ) return "";
      }

      // If the asset name matches the category directly, return blank
      for (const cat of catSet) {
        if (lower === cat) return "";
      }

      // Check category + asset type combinations
      const normLower = lower.replace(/[\s\-_/]+/g, " ").trim();
      for (const cat of catSet) {
        for (const typ of typSet) {
          const phSpace = `${cat} ${typ}`;
          const phHyphen = `${cat} - ${typ}`;
          const phReverseSpace = `${typ} ${cat}`;
          const phReverseHyphen = `${typ} - ${cat}`;

          if (
            lower === phSpace ||
            lower === phHyphen ||
            lower === phReverseSpace ||
            lower === phReverseHyphen
          ) {
            return "";
          }

          const normPh = phSpace.replace(/[\s\-_/]+/g, " ").trim();
          if (normLower === normPh) {
            return "";
          }
        }
      }

      return raw;
    })(),
    assetCode: pick<string>([dbAsset, prev], "assetNo", "assetCode") ?? "",
    assetNameRegional: pick<string>([dbAsset, prev], "assetRegionalName") ?? "",
    fullAddress: pick<string>([...sources, prev], "address") ?? "",
    fullAddressRegional: pick<string>([...sources, prev], "regionalAddress") ?? "",
    latitude: toStringNum(pick(sources, "latitude"), prev.latitude),
    longitude: toStringNum(pick(sources, "longitude"), prev.longitude),
    surveyNumber: pick<string>([...sources, prev], "csn") ?? "",
    zoneId: resolvedZone,
    wardId: resolvedWard,
    departmentId: resolvedDept,
    department: resolvedDept,
    zone: resolvedZone,
    ward: resolvedWard,
    mouja: resolvedMouja,
    moujaId: resolvedMouja,
    subzone: resolvedSubzone,
    subZoneId: resolvedSubzone,
    status: pick<string>([dbAsset, prev], "status") ?? "",
    condition: toStringId(pick(sources, "assetConditionId")) || pick<string>([dbAsset, prev], "assetCondition", "condition") || "",
    ownershipType: pick<string>([...sources, prev], "ownershipType") ?? "",
    encroachmentStatus: pick<string>([...sources, prev], "encroachmentStatus") ?? "",
    attributes: {
      ...(prev.attributes ?? {}),
      ...dynamicAttrs,
      ...(mpmsNo ? { mpmsNo } : {}),
      ...(pTaxId ? { pTaxId } : {}),
    },
    mpmsNo,
    pTaxId,
    propertyNumber: pick<string>([...sources, prev], "propertyNo") ?? "",
    partitionNo: pick<string>([...sources, prev], "partitionNo") ?? "",
    upicId: pick<string>([...sources, prev], "upicId") ?? "",
    plotNumber: pick<string>([...sources, prev], "plotNo") ?? "",
    length: toStringNum(pick(sources, "lengthMtr"), prev.length),
    width: toStringNum(pick(sources, "widthMtr"), prev.width),
    landArea: toStringNum(pick(sources, "landAreaSqMeter"), prev.landArea),
    locality: pick<string>(sources, "nearestLandmark") ?? (dynamicAttrs.locality as string) ?? prev.locality ?? "",
    pinCode: pick<string>([dbAsset, details, prev], "pinCode") ?? "",
    inChargeName: pick<string>([...sources, prev], "inChargeName") ?? "",
    inChargeDesignation: resolvedDesignation,
    inChargeMobile: pick<string>([...sources, prev], "inChargeMobile") ?? "",
    inChargeEmail: pick<string>([...sources, prev], "inChargeEmail") ?? "",
    inChargeNameRegional: resolvedInChargeRegional,
    inChargeRegionalName: resolvedInChargeRegional,
    landmark: pick<string>([...sources, prev], "nearestLandmark") ?? "",
  };
}

