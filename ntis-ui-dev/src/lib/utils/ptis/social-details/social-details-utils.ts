import type {
  CreatePropertySocialDetailDto,
  UpdatePropertySocialDetailDto,
  DeletePropertySocialDetailsByHierarchyParams,
  PropertySocialDetailsDto,
} from '@/types/property-social-details.types';
import type { PropertySocialDetailItem } from '@/types/ptis-core.types';
import type { SocialAttribute } from '@/types/social-attribute.types';

export interface ScopeIdentifier {
  propertyId?: number | null;
  societyDetailId?: number | null;
  societyDetailsId?: number | null;
  wingDetailId?: number | null;
  entityType?: string | null;
}

export const filterActiveAttributes = <T extends { isActive?: boolean }>(items: T[]): T[] =>
  items.filter((item) => item.isActive !== false);

export const buildScopeKey = (
  item: ScopeIdentifier & { socialAttributeId: number }
): string => {
  const entityType = item.entityType || 'P';
  const socId = item.societyDetailId ?? item.societyDetailsId ?? 0;
  const wingId = item.wingDetailId ?? 0;
  const propId = item.propertyId ?? 0;
  return `${entityType}:${socId}:${wingId}:${propId}:${item.socialAttributeId}`;
};

export function dedupeByAttributeAndScope<
  T extends { socialAttributeId?: number; id?: number | null } & ScopeIdentifier
>(items: T[], scopeFilter?: ScopeIdentifier): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const attrId = item.socialAttributeId ?? (item.id as number);
    if (!attrId) continue;
    if (scopeFilter) {
      if (scopeFilter.entityType && item.entityType && item.entityType !== scopeFilter.entityType) continue;
      if (scopeFilter.societyDetailId && item.societyDetailId && item.societyDetailId !== scopeFilter.societyDetailId) continue;
      if (scopeFilter.wingDetailId && item.wingDetailId && item.wingDetailId !== scopeFilter.wingDetailId) continue;
      if (scopeFilter.propertyId && item.propertyId && item.propertyId !== scopeFilter.propertyId) continue;
    }
    const key = buildScopeKey({ ...item, socialAttributeId: attrId });
    const existing = map.get(key);
    if (!existing || (item.id && (!existing.id || item.id > existing.id))) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

export function normalizeUploadResponse(
  uploadResponse: unknown,
  fallbackFile: File
): {
  documentBindingId: number | null;
  documentGuid: string;
  fileName: string;
} {
  const raw =
    uploadResponse && typeof uploadResponse === 'object'
      ? (uploadResponse as Record<string, unknown>)
      : {};

  let documentBindingId: number | null = null;
  if (typeof raw.documentBindingId === 'number' && raw.documentBindingId > 0) {
    documentBindingId = raw.documentBindingId;
  } else if (typeof raw.DocumentBindingId === 'number' && raw.DocumentBindingId > 0) {
    documentBindingId = raw.DocumentBindingId;
  } else if (typeof raw.bindingId === 'number' && raw.bindingId > 0) {
    documentBindingId = raw.bindingId;
  } else if (typeof raw.BindingId === 'number' && raw.BindingId > 0) {
    documentBindingId = raw.BindingId;
  }

  const rawGuid =
    raw.documentGuid ??
    raw.DocumentGuid ??
    raw.guid ??
    raw.Guid ??
    raw.photoGuid ??
    raw.PhotoGuid;
  const documentGuid =
    typeof rawGuid === 'string' && rawGuid.trim() !== '' ? rawGuid.trim() : '';

  const rawFileName = raw.fileName ?? raw.FileName ?? raw.name ?? raw.Name;
  const fileName =
    typeof rawFileName === 'string' && rawFileName.trim() !== ''
      ? rawFileName.trim()
      : fallbackFile.name;

  return { documentBindingId, documentGuid, fileName };
}

export function resolveDocumentGuid(
  item?: { documentGuid?: string | null; photoGuid?: string | null } | null
): string | null {
  if (!item) return null;
  const guid = item.documentGuid || item.photoGuid;
  return typeof guid === 'string' && guid.trim() !== '' ? guid.trim() : null;
}

export function resolveBindingId(
  item?: { documentBindingId?: number | null; photoBindingId?: number | null } | null
): number | null {
  if (!item) return null;
  const id = item.documentBindingId ?? item.photoBindingId;
  return typeof id === 'number' && Number.isFinite(id) && id > 0 ? id : null;
}

export const ENTITY_TYPE = {
  SOCIETY: 'S',
  WING: 'W',
  PROPERTY: 'P',
} as const;

export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

export const LEVEL_NAMES = {
  APARTMENT: 'Apartment',
  WING: 'Wing',
  UNIT: 'Unit',
} as const;

export type ScopeLevel = (typeof LEVEL_NAMES)[keyof typeof LEVEL_NAMES];

/**
 * Resolves entityType and hierarchy IDs based on level, selection, wingId, unitIds, etc.
 * Strictly adheres to backend entity types: 'S' (Society), 'W' (Wing), 'P' (Property/Unit).
 */
export function resolveScope({
  level,
  isAllUnitsSelected = false,
  wingDetailId = null,
  unitIds = [],
  societyDetailId = null,
  propertyId = null,
}: {
  level?: string | null;
  isAllUnitsSelected?: boolean;
  wingDetailId?: number | null;
  unitIds?: number[];
  societyDetailId?: number | null;
  propertyId?: number | null;
}): {
  entityType: EntityType;
  propertyId: number | null;
  wingDetailId: number | null;
  societyDetailId: number | null;
} {
  const normLevel = String(level || 'Apartment').trim().toLowerCase();

  if (normLevel === 'wing') {
    return {
      entityType: ENTITY_TYPE.WING,
      propertyId: null,
      wingDetailId: wingDetailId ? Number(wingDetailId) : null,
      societyDetailId: societyDetailId ? Number(societyDetailId) : null,
    };
  }

  if (normLevel === 'unit') {
    if (isAllUnitsSelected) {
      // When all units in a wing are selected, promote to wing-level record
      return {
        entityType: ENTITY_TYPE.WING,
        propertyId: null,
        wingDetailId: wingDetailId ? Number(wingDetailId) : null,
        societyDetailId: societyDetailId ? Number(societyDetailId) : null,
      };
    }
    const singleUnitPropId =
      unitIds && unitIds.length === 1
        ? unitIds[0]
        : propertyId
          ? Number(propertyId)
          : null;
    return {
      entityType: ENTITY_TYPE.PROPERTY,
      propertyId: singleUnitPropId,
      wingDetailId: wingDetailId ? Number(wingDetailId) : null,
      societyDetailId: societyDetailId ? Number(societyDetailId) : null,
    };
  }

  return {
    entityType: ENTITY_TYPE.SOCIETY,
    propertyId: null,
    wingDetailId: null,
    societyDetailId: societyDetailId ? Number(societyDetailId) : null,
  };
}

/**
 * Determines the scope level ('Apartment' | 'Wing' | 'Unit') of a record dynamically.
 * Rule order:
 * 1. entityType: 'S' -> 'Apartment', 'W' -> 'Wing', 'P' -> 'Unit'
 * 2. level property ('apartment' | 'society' -> 'Apartment', 'wing' -> 'Wing', 'unit' -> 'Unit')
 * 3. structural IDs (unitNo -> 'Unit', wingDetailId > 0 -> 'Wing', propertyId > 0 && propertyId !== societyDetailId -> 'Unit')
 * 4. Default -> 'Apartment'
 */
export function getItemLevel(item?: {
  entityType?: string | null;
  level?: string | null;
  unitNo?: string | number | null;
  wingDetailId?: number | null;
  propertyId?: number | null;
  societyDetailId?: number | null;
} | null): ScopeLevel {
  if (!item) return LEVEL_NAMES.APARTMENT;

  const entityType = String(item.entityType || '').trim().toUpperCase();
  if (entityType === ENTITY_TYPE.PROPERTY || entityType === 'P') return LEVEL_NAMES.UNIT;
  if (entityType === ENTITY_TYPE.WING || entityType === 'W') return LEVEL_NAMES.WING;
  if (entityType === ENTITY_TYPE.SOCIETY || entityType === 'S') return LEVEL_NAMES.APARTMENT;

  const lvl = String(item.level || '').trim().toLowerCase();
  if (lvl === 'unit') return LEVEL_NAMES.UNIT;
  if (lvl === 'wing') return LEVEL_NAMES.WING;
  if (lvl === 'apartment' || lvl === 'society') return LEVEL_NAMES.APARTMENT;

  if (item.unitNo && String(item.unitNo).trim() !== '') return LEVEL_NAMES.UNIT;

  // Specificity order: Unit (has propertyId distinct from societyDetailId and > 0) -> Wing (has wingDetailId) -> Apartment
  if (
    item.propertyId &&
    Number(item.propertyId) > 0 &&
    (!item.societyDetailId || Number(item.propertyId) !== Number(item.societyDetailId))
  ) {
    return LEVEL_NAMES.UNIT;
  }

  if (item.wingDetailId && Number(item.wingDetailId) > 0) return LEVEL_NAMES.WING;

  return LEVEL_NAMES.APARTMENT;
}

/**
 * Checks if a property social detail item is configured / has a non-empty value.
 */
export function isConfigured(item?: {
  id?: number | null;
  isActive?: boolean | null;
  bitValue?: boolean | number | string | null;
  intValue?: number | string | null;
  decimalValue?: number | string | null;
  textValue?: string | null;
  dateValue?: string | null;
  documentBindingId?: number | null;
  documentGuid?: string | null;
  percentage?: number | null;
  amount?: number | null;
  remark?: string | null;
} | null): boolean {
  if (!item) return false;
  if (item.isActive === false) return false;

  const isBitTrue =
    item.bitValue === true ||
    (item.bitValue as unknown) === 1 ||
    String(item.bitValue).trim().toLowerCase() === 'true' ||
    String(item.bitValue).trim() === '1';

  const hasInt =
    item.intValue !== null &&
    item.intValue !== undefined &&
    item.intValue !== '' &&
    Number(item.intValue) > 0;

  const hasDec =
    item.decimalValue !== null &&
    item.decimalValue !== undefined &&
    item.decimalValue !== '' &&
    Number(item.decimalValue) > 0;

  const hasText =
    item.textValue !== null &&
    item.textValue !== undefined &&
    item.textValue.trim() !== '' &&
    item.textValue.trim().toLowerCase() !== 'string' &&
    item.textValue.trim() !== '-' &&
    item.textValue.trim().toLowerCase() !== 'no' &&
    item.textValue.trim().toLowerCase() !== 'false';

  const hasDate = Boolean(item.dateValue && item.dateValue.trim() !== '');
  const hasDoc = Boolean(
    (item.documentBindingId != null && Number(item.documentBindingId) > 0) ||
    (item.documentGuid && item.documentGuid.trim() !== '')
  );
  const hasPercent =
    item.percentage !== null &&
    item.percentage !== undefined &&
    Number(item.percentage) > 0;
  const hasAmount =
    item.amount !== null && item.amount !== undefined && Number(item.amount) > 0;

  const hasUserRemark =
    Boolean(item.remark?.trim()) &&
    item.remark?.trim().toLowerCase() !== 'null' &&
    item.remark?.trim().toLowerCase() !== 'undefined' &&
    item.remark?.trim().toLowerCase() !== 'string' &&
    item.remark?.trim() !== '-';

  return (
    isBitTrue ||
    hasInt ||
    hasDec ||
    hasText ||
    hasDate ||
    hasDoc ||
    hasPercent ||
    hasAmount ||
    hasUserRemark
  );
}

/**
 * Maps a raw social details record to a strongly-typed PropertySocialDetailItem.
 */
export function normalizeToItem(
  raw: Record<string, unknown> | PropertySocialDetailsDto,
  master?: SocialAttribute | null,
  resolvedContext?: {
    resolvedPropertyId?: number;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
  }
): PropertySocialDetailItem {
  const rawObj = raw as Record<string, unknown>;
  const rawId =
    raw.id ??
    rawObj.Id ??
    rawObj.propertySocialDetailId ??
    rawObj.PropertySocialDetailId;
  const id = rawId != null && String(rawId).trim() !== '' ? Number(rawId) : 0;
  const socialAttributeId = Number(
    raw.socialAttributeId ??
    rawObj.SocialAttributeId ??
    rawObj.socialAtrributeId ??
    rawObj.SocialAtrributeId ??
    rawObj.societyAttributeId ??
    rawObj.SocietyAttributeId ??
    rawObj.attributeId ??
    rawObj.AttributeId ??
    master?.id ??
    0
  );
  const rawPropId = raw.propertyId ?? rawObj.PropertyId;
  const propertyId = rawPropId != null && rawPropId !== '' ? Number(rawPropId) : (rawObj.entityType === 'P' || rawObj.EntityType === 'P' ? Number(resolvedContext?.resolvedPropertyId || 0) : 0);
  const societyDetailId =
    raw.societyDetailId != null
      ? Number(raw.societyDetailId)
      : rawObj.SocietyDetailId != null
        ? Number(rawObj.SocietyDetailId)
        : (resolvedContext?.societyDetailId ?? null);
  const wingDetailId =
    raw.wingDetailId != null
      ? Number(raw.wingDetailId)
      : rawObj.WingDetailId != null
        ? Number(rawObj.WingDetailId)
        : (resolvedContext?.wingDetailId ?? null);

  const rawEntityType = (raw.entityType as string) ?? (rawObj.EntityType as string) ?? null;

  const level = getItemLevel({
    entityType: rawEntityType,
    level: (rawObj.level as string) ?? (rawObj.Level as string) ?? null,
    unitNo: (raw.unitNo as string | number) ?? (rawObj.UnitNo as string | number) ?? (rawObj.flatNo as string | number) ?? (rawObj.FlatNo as string | number) ?? null,
    wingDetailId,
    propertyId,
    societyDetailId,
  });

  const rawBit = raw.bitValue ?? rawObj.BitValue;
  const bitValue =
    typeof rawBit === 'boolean'
      ? rawBit
      : rawBit != null
        ? String(rawBit).trim().toLowerCase() === 'true' ||
          String(rawBit).trim() === '1'
        : null;

  const rawDisc = raw.isDiscountApplicable ?? rawObj.IsDiscountApplicable;
  const isDiscountApplicable =
    typeof rawDisc === 'boolean'
      ? rawDisc
      : rawDisc != null
        ? String(rawDisc).trim().toLowerCase() === 'true' || String(rawDisc).trim() === '1'
        : master?.isDiscountApplicable;

  const socialAttributeCode = String(
    raw.socialAttributeCode ||
    rawObj.SocialAttributeCode ||
    master?.socialAttributeCode ||
    ''
  );
  const socialAttributeName = String(
    raw.socialAttributeName ||
    rawObj.SocialAttributeName ||
    master?.socialAttributeName ||
    (socialAttributeCode ? socialAttributeCode : `Attribute #${socialAttributeId}`)
  );

  return {
    id,
    propertyId,
    socialAttributeId,
    socialAttributeCode,
    socialAttributeName,
    bitValue,
    intValue:
      raw.intValue != null && raw.intValue !== ''
        ? Number(raw.intValue)
        : rawObj.IntValue != null && rawObj.IntValue !== ''
          ? Number(rawObj.IntValue)
          : null,
    decimalValue:
      raw.decimalValue != null && raw.decimalValue !== ''
        ? Number(raw.decimalValue)
        : rawObj.DecimalValue != null && rawObj.DecimalValue !== ''
          ? Number(rawObj.DecimalValue)
          : null,
    textValue: (raw.textValue ?? rawObj.TextValue) != null ? String(raw.textValue ?? rawObj.TextValue) : null,
    dateValue: (raw.dateValue ?? rawObj.DateValue) != null ? String(raw.dateValue ?? rawObj.DateValue) : null,
    documentBindingId:
      raw.documentBindingId != null
        ? Number(raw.documentBindingId)
        : rawObj.DocumentBindingId != null
          ? Number(rawObj.DocumentBindingId)
          : null,
    documentGuid: (raw.documentGuid ?? rawObj.DocumentGuid) ? String(raw.documentGuid ?? rawObj.DocumentGuid) : null,
    remark: (raw.remark ?? rawObj.Remark) != null ? String(raw.remark ?? rawObj.Remark) : null,
    isActive: Boolean(raw.isActive ?? rawObj.IsActive ?? true),
    createdDate: String(rawObj.createdDate || rawObj.CreatedDate || ''),
    updatedDate: rawObj.updatedDate ? String(rawObj.updatedDate) : rawObj.UpdatedDate ? String(rawObj.UpdatedDate) : null,
    level,
    wingDetailId,
    societyDetailId,
    wingName: (raw.wingName ?? rawObj.WingName) != null ? String(raw.wingName ?? rawObj.WingName) : null,
    unitNo: (raw.unitNo ?? rawObj.UnitNo ?? rawObj.flatNo ?? rawObj.FlatNo) != null ? String(raw.unitNo ?? rawObj.UnitNo ?? rawObj.flatNo ?? rawObj.FlatNo) : null,
    partitionNo:
      raw.partitionNo != null
        ? String(raw.partitionNo)
        : rawObj.PartitionNo != null
          ? String(rawObj.PartitionNo)
          : null,
    entityType:
      (raw.entityType as string) ??
      (rawObj.EntityType as string) ??
      (level === 'Apartment' ? 'S' : level === 'Wing' ? 'W' : 'P'),
    inheritedFrom: (raw.inheritedFrom as string) ?? (rawObj.InheritedFrom as string) ?? null,
    percentage:
      raw.percentage != null
        ? Number(raw.percentage)
        : rawObj.Percentage != null
          ? Number(rawObj.Percentage)
          : null,
    amount:
      raw.amount != null
        ? Number(raw.amount)
        : rawObj.Amount != null
          ? Number(rawObj.Amount)
          : null,
    isDiscountApplicable,
  };
}

/**
 * Builds CreatePropertySocialDetailDto with proper sanitization and type safety.
 */
export function buildCreateDto({
  attr,
  scope,
  userId,
}: {
  attr: {
    id?: number | null;
    socialAttributeId: number;
    bitValue?: boolean | null;
    intValue?: number | string | null;
    decimalValue?: number | string | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    remark?: string | null;
    isActive?: boolean;
    percentage?: number | null;
    amount?: number | null;
  };
  scope: {
    entityType: EntityType;
    propertyId: number | null;
    wingDetailId: number | null;
    societyDetailId: number | null;
  };
  userId: number;
}): CreatePropertySocialDetailDto {
  const sanitizedInt =
    attr.intValue != null &&
    String(attr.intValue).trim() !== '' &&
    !isNaN(Number(attr.intValue))
      ? Number(attr.intValue)
      : null;

  const sanitizedDec =
    attr.decimalValue != null &&
    String(attr.decimalValue).trim() !== '' &&
    !isNaN(Number(attr.decimalValue))
      ? Number(attr.decimalValue)
      : null;

  const rawText = attr.textValue != null ? String(attr.textValue).trim() : null;
  const sanitizedText =
    rawText && rawText.toLowerCase() !== 'string' && rawText !== '-'
      ? rawText
      : null;

  const rawDate = attr.dateValue != null ? String(attr.dateValue).trim() : null;
  const sanitizedDate =
    rawDate && rawDate.toLowerCase() !== 'string' ? rawDate : null;

  const rawRemark = attr.remark != null ? String(attr.remark).trim() : null;
  const sanitizedRemark =
    rawRemark &&
    rawRemark.toLowerCase() !== 'string' &&
    rawRemark.toLowerCase() !== 'null'
      ? rawRemark
      : null;

  return {
    socialAttributeId: attr.socialAttributeId,
    bitValue: attr.bitValue ?? null,
    intValue: sanitizedInt,
    decimalValue: sanitizedDec,
    textValue: sanitizedText,
    dateValue: sanitizedDate,
    documentBindingId: attr.documentBindingId ? Number(attr.documentBindingId) : null,
    remark: sanitizedRemark,
    isActive: attr.isActive ?? true,
    createdBy: userId,
    propertyId: scope.propertyId,
    wingDetailId: scope.wingDetailId,
    societyDetailId: scope.societyDetailId,
    entityType: scope.entityType,
  };
}

/**
 * Builds UpdatePropertySocialDetailDto with proper sanitization and type safety.
 */
export function buildUpdateDto({
  id,
  attr,
  scope,
  userId,
}: {
  id: number;
  attr: {
    id?: number | null;
    socialAttributeId: number;
    bitValue?: boolean | null;
    intValue?: number | string | null;
    decimalValue?: number | string | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    remark?: string | null;
    isActive?: boolean;
    percentage?: number | null;
    amount?: number | null;
  };
  scope: {
    entityType: EntityType;
    propertyId: number | null;
    wingDetailId: number | null;
    societyDetailId: number | null;
  };
  userId: number;
}): UpdatePropertySocialDetailDto {
  const sanitizedInt =
    attr.intValue != null &&
    String(attr.intValue).trim() !== '' &&
    !isNaN(Number(attr.intValue))
      ? Number(attr.intValue)
      : null;

  const sanitizedDec =
    attr.decimalValue != null &&
    String(attr.decimalValue).trim() !== '' &&
    !isNaN(Number(attr.decimalValue))
      ? Number(attr.decimalValue)
      : null;

  const rawText = attr.textValue != null ? String(attr.textValue).trim() : null;
  const sanitizedText =
    rawText && rawText.toLowerCase() !== 'string' && rawText !== '-'
      ? rawText
      : null;

  const rawDate = attr.dateValue != null ? String(attr.dateValue).trim() : null;
  const sanitizedDate =
    rawDate && rawDate.toLowerCase() !== 'string' ? rawDate : null;

  const rawRemark = attr.remark != null ? String(attr.remark).trim() : null;
  const sanitizedRemark =
    rawRemark &&
    rawRemark.toLowerCase() !== 'string' &&
    rawRemark.toLowerCase() !== 'null'
      ? rawRemark
      : null;

  return {
    id,
    socialAttributeId: attr.socialAttributeId,
    bitValue: attr.bitValue ?? null,
    intValue: sanitizedInt,
    decimalValue: sanitizedDec,
    textValue: sanitizedText,
    dateValue: sanitizedDate,
    documentBindingId: attr.documentBindingId ? Number(attr.documentBindingId) : null,
    remark: sanitizedRemark,
    isActive: attr.isActive ?? true,
    updatedBy: userId,
    propertyId: scope.propertyId,
    wingDetailId: scope.wingDetailId,
    societyDetailId: scope.societyDetailId,
    entityType: scope.entityType,
  };
}

/**
 * Builds DeletePropertySocialDetailsByHierarchyParams with proper scope.
 */
export function buildDeleteParams({
  level,
  socialAttributeId,
  societyDetailId,
  wingDetailId,
  propertyIds,
}: {
  level: string;
  socialAttributeId: number;
  societyDetailId?: number | null;
  wingDetailId?: number | null;
  propertyIds?: number[] | string;
}): DeletePropertySocialDetailsByHierarchyParams {
  const normLevel = String(level).trim().toLowerCase();
  let entityType: EntityType = ENTITY_TYPE.SOCIETY;

  if (normLevel === 'wing') {
    entityType = ENTITY_TYPE.WING;
  } else if (normLevel === 'unit') {
    entityType = ENTITY_TYPE.PROPERTY;
  }

  return {
    entityType,
    socialAttributeId,
    societyDetailsId: societyDetailId ? Number(societyDetailId) : undefined,
    wingDetailId: wingDetailId ? Number(wingDetailId) : undefined,
    propertyIds,
  };
}

/**
 * Expands a list of social attribute IDs to include all connected parent and child attributes
 * across the hierarchy tree so that parents and children always stay in sync for active/delete states.
 */
export function expandConnectedSocialAttributeIds(
  targetIds: number[],
  attributesList: Array<{ id?: number | null; socialAttributeId?: number | null; parentAttributeId?: number | null }>
): number[] {
  if (!targetIds || targetIds.length === 0) return [];
  const result = new Set<number>();

  const parentMap = new Map<number, number | null>();
  const childrenMap = new Map<number, Set<number>>();

  attributesList.forEach((attr) => {
    const id = attr.socialAttributeId != null ? Number(attr.socialAttributeId) : (attr.id != null ? Number(attr.id) : null);
    if (!id || isNaN(id)) return;
    const parentId = attr.parentAttributeId != null ? Number(attr.parentAttributeId) : null;
    parentMap.set(id, parentId && !isNaN(parentId) ? parentId : null);

    if (parentId && !isNaN(parentId)) {
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, new Set());
      }
      childrenMap.get(parentId)!.add(id);
    }
  });

  const getFamily = (startId: number) => {
    // 1. Traverse up to root parent
    let rootId = startId;
    const visitedParents = new Set<number>();
    while (parentMap.has(rootId) && parentMap.get(rootId) != null && !visitedParents.has(rootId)) {
      visitedParents.add(rootId);
      rootId = parentMap.get(rootId)!;
    }

    // 2. Collect root and all descendants
    result.add(rootId);
    const collectDescendants = (pId: number) => {
      const children = childrenMap.get(pId);
      if (children) {
        children.forEach((childId) => {
          if (!result.has(childId)) {
            result.add(childId);
            collectDescendants(childId);
          }
        });
      }
    };
    collectDescendants(rootId);
  };

  targetIds.forEach((id) => getFamily(id));
  return Array.from(result);
}
