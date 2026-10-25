import {
  PropertyBasicDetailsApiItem,
  PropertyCategoryApiItem,
  PropertyTypeApiItem,
  MoujaItem,
  TaxZoneItem,
  WingItem,
} from '@/types/property-basic-details.types';

/**
 * Type guard for PropertyBasicDetails raw payload
 */
export function isPropertyBasicDetailsShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const id = Number(obj.propertyId ?? obj.id ?? obj.PropertyId);
  return Number.isFinite(id) && id > 0;
}

/**
 * Normalizes raw property basic details payload to strongly-typed domain model
 */
export function normalizePropertyBasicDetails(data: Record<string, unknown>): PropertyBasicDetailsApiItem {
  const parseNum = (val: unknown, fallback: number | null = null): number | null => {
    if (val === null || val === undefined || val === '') return fallback;
    const num = Number(val);
    return Number.isFinite(num) ? num : fallback;
  };

  const parseNonNullableNum = (val: unknown, fallback: number = 0): number => {
    const num = parseNum(val, fallback);
    return num ?? fallback;
  };

  const parseStr = (val: unknown, fallback: string = ''): string => {
    if (val === null || val === undefined) return fallback;
    return String(val).trim();
  };

  const parseNullableStr = (val: unknown): string | null => {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    return s.length > 0 ? s : null;
  };

  const propertyId = parseNonNullableNum(data.propertyId ?? data.id ?? data.PropertyId);
  const wardId = parseNonNullableNum(data.wardId ?? data.WardId);
  const zoneId = parseNonNullableNum(data.zoneId ?? data.ZoneId);
  const taxZoneId = parseNonNullableNum(data.taxZoneId ?? data.TaxZoneId);
  const categoryId = parseNonNullableNum(data.categoryId ?? data.CategoryId);
  const propertyTypeId = parseNonNullableNum(data.propertyTypeId ?? data.PropertyTypeId);

  return {
    propertyId,
    wardId,
    wardNo: parseStr(data.wardNo ?? data.WardNo),
    zoneId,
    division: parseStr(data.division ?? data.Division),
    propertyNo: parseStr(data.propertyNo ?? data.PropertyNo),
    partitionNo: parseStr(data.partitionNo ?? data.PartitionNo),
    flatOrShopNo: parseStr(data.flatOrShopNo ?? data.FlatOrShopNo),
    plotNo: parseStr(data.plotNo ?? data.PlotNo),
    surveyNo: parseStr(data.surveyNo ?? data.SurveyNo),
    taxZoneId,
    taxZoneNo: parseStr(data.taxZoneNo ?? data.TaxZoneNo ?? data.taxZone),
    categoryId,
    categoryName: parseStr(data.categoryName ?? data.CategoryName ?? data.propertyCategory ?? data.category),
    propertyTypeId,
    propertyDescription: parseStr(data.propertyDescription ?? data.PropertyDescription),
    upicId: parseNullableStr(data.upicId ?? data.UpicId),
    subZoneNo: parseStr(data.subZoneNo ?? data.SubZoneNo ?? data.subZone),
    moujaId: parseNum(data.moujaId ?? data.MoujaId),
    moujaName: parseNullableStr(data.moujaName ?? data.MoujaName),
    wingNo: parseNullableStr(data.wingNo ?? data.WingNo),
    noOfResidentialToilets: parseNum(data.noOfResidentialToilets ?? data.NoOfResidentialToilets),
    noOfCommercialToilets: parseNum(data.noOfCommercialToilets ?? data.NoOfCommercialToilets),
    totalCarpetAreaSqMeter: parseNonNullableNum(data.totalCarpetAreaSqMeter ?? data.carpetAreasqMtr ?? data.carpetAreaMtr),
    totalBuiltupAreaSqMeter: parseNonNullableNum(data.totalBuiltupAreaSqMeter ?? data.builtUpAreasqMtr ?? data.builtUpAreaMtr),
    totalCarpetAreaSqFeet: parseNonNullableNum(data.totalCarpetAreaSqFeet ?? data.carpetAreasqFt ?? data.carpetAreaFt),
    totalBuiltupAreaSqFeet: parseNonNullableNum(data.totalBuiltupAreaSqFeet ?? data.builtUpAreasqFt ?? data.builtUpAreaFt),
    plotArea: parseNum(data.plotArea ?? data.plotAreaFt ?? data.plotAreaMtr),
    plotAreaSqFeet: parseNum(data.plotAreaSqFeet ?? data.plotAreaFt),
    plotAreaSqMeter: parseNum(data.plotAreaSqMeter ?? data.plotAreaMtr),
    plotAreaFtLength: parseNonNullableNum(data.plotAreaFtLength),
    plotAreaFtWidth: parseNonNullableNum(data.plotAreaFtWidth),
    plotAreaMtrLength: parseNonNullableNum(data.plotAreaMtrLength),
    plotAreaMtrWidth: parseNonNullableNum(data.plotAreaMtrWidth),
    wingId: parseNum(data.wingId ?? data.WingId),
    wingName: parseNullableStr(data.wingName ?? data.WingName),
    rateSectionDescription: parseNullableStr(data.rateSectionDescription ?? data.rateSectionName ?? data.RateSectionDescription),
    latitude: parseNullableStr(data.latitude ?? data.Latitude),
    longitude: parseNullableStr(data.longitude ?? data.Longitude),
    constructionYear: parseNullableStr(data.constructionYear ?? data.ConstructionYear),
    oldCarpetAreaSqFeet: parseNum(data.oldCarpetAreaSqFeet ?? data.OldCarpetAreaSqFeet),
    oldCarpetAreaSqMeter: parseNum(data.oldCarpetAreaSqMeter ?? data.OldCarpetAreaSqMeter),
    oldBuiltupAreaSqFeet: parseNum(data.oldBuiltupAreaSqFeet ?? data.OldBuiltupAreaSqFeet),
    oldBuiltupAreaSqMeter: parseNum(data.oldBuiltupAreaSqMeter ?? data.OldBuiltupAreaSqMeter),
  };
}

/**
 * Type guard for PropertyCategory
 */
export function isPropertyCategoryShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const id = Number(obj.id ?? obj.Id ?? obj.propertyCategoryId);
  return Number.isFinite(id) && id > 0;
}

export function normalizePropertyCategory(data: Record<string, unknown>): PropertyCategoryApiItem {
  return {
    id: Number(data.id ?? data.Id ?? data.propertyCategoryId),
    propertyCategoryName: String(data.propertyCategoryName ?? data.PropertyCategoryName ?? data.categoryName ?? '').trim(),
    isActive: Boolean(data.isActive ?? data.IsActive ?? true),
    createdDate: String(data.createdDate ?? data.CreatedDate ?? new Date().toISOString()),
    updatedDate: data.updatedDate ? String(data.updatedDate) : null,
  };
}

/**
 * Type guard for PropertyType
 */
export function isPropertyTypeShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const id = Number(obj.id ?? obj.Id ?? obj.propertyTypeId);
  return Number.isFinite(id) && id > 0;
}

export function normalizePropertyType(data: Record<string, unknown>): PropertyTypeApiItem {
  return {
    id: Number(data.id ?? data.Id ?? data.propertyTypeId),
    propertyDescription: String(data.propertyDescription ?? data.PropertyDescription ?? '').trim(),
    type: String(data.type ?? data.Type ?? '').trim(),
    propertyTypeGroup: String(data.propertyTypeGroup ?? data.PropertyTypeGroup ?? '').trim(),
    searchKey: String(data.searchKey ?? data.SearchKey ?? '').trim(),
    searchSequence: Number(data.searchSequence ?? data.SearchSequence ?? 0),
    propertyTypeCategoryId: data.propertyTypeCategoryId != null ? Number(data.propertyTypeCategoryId) : null,
    isActive: Boolean(data.isActive ?? data.IsActive ?? true),
    createdDate: String(data.createdDate ?? data.CreatedDate ?? new Date().toISOString()),
    updatedDate: data.updatedDate ? String(data.updatedDate) : null,
  };
}

/**
 * Type guard for Mouja
 */
export function isMoujaShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const id = Number(obj.id ?? obj.Id ?? obj.moujaId);
  return Number.isFinite(id) && id > 0;
}

export function normalizeMouja(data: Record<string, unknown>): MoujaItem {
  return {
    id: Number(data.id ?? data.Id ?? data.moujaId),
    moujaNo: String(data.moujaNo ?? data.MoujaNo ?? '').trim(),
    moujaName: String(data.moujaName ?? data.MoujaName ?? '').trim(),
    isActive: Boolean(data.isActive ?? data.IsActive ?? true),
    createdDate: String(data.createdDate ?? data.CreatedDate ?? new Date().toISOString()),
    updatedDate: data.updatedDate ? String(data.updatedDate) : null,
  };
}

/**
 * Type guard for TaxZone
 */
export function isTaxZoneShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const id = Number(obj.id ?? obj.Id ?? obj.taxZoneId);
  return Number.isFinite(id) && id > 0;
}

export function normalizeTaxZone(data: Record<string, unknown>): TaxZoneItem {
  return {
    id: Number(data.id ?? data.Id ?? data.taxZoneId),
    taxZoneNo: String(data.taxZoneNo ?? data.TaxZoneNo ?? '').trim(),
    taxZoneType: String(data.taxZoneType ?? data.TaxZoneType ?? '').trim(),
    remark: String(data.remark ?? data.Remark ?? '').trim(),
    isActive: Boolean(data.isActive ?? data.IsActive ?? true),
    createdDate: String(data.createdDate ?? data.CreatedDate ?? new Date().toISOString()),
    updatedDate: data.updatedDate ? String(data.updatedDate) : null,
  };
}

/**
 * Type guard for Wing
 */
export function isWingShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const id = Number(obj.id ?? obj.Id ?? obj.wingId);
  return Number.isFinite(id) && id > 0;
}

export function normalizeWing(data: Record<string, unknown>): WingItem {
  return {
    id: Number(data.id ?? data.Id ?? data.wingId),
    wingNo: String(data.wingNo ?? data.WingNo ?? '').trim(),
    sequenceNo: Number(data.sequenceNo ?? data.SequenceNo ?? 0),
    isActive: Boolean(data.isActive ?? data.IsActive ?? true),
    createdDate: String(data.createdDate ?? data.CreatedDate ?? new Date().toISOString()),
    updatedDate: data.updatedDate ? String(data.updatedDate) : null,
  };
}
