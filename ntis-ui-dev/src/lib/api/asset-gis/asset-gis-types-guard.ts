/**
 * Runtime Type Guards and Normalizers for GIS Module
 * Following NTIS-UI Consultant Review Guidelines
 */

import type {
  GisZoneItem,
  GisBlockItem,
  PropertyGroup,
  PropertyTypeMasterItem,
  GisKpiSummary,
  Ward,
} from '@/types/asset-gis.types';

export function isGisShape(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isGisZoneShape(value: unknown): value is Record<string, unknown> {
  if (!isGisShape(value)) return false;
  const zoneNo = value.zoneNo ?? value.zoneId ?? value.ZoneNo ?? value.ZoneId ?? value.id;
  return zoneNo !== undefined && zoneNo !== null && String(zoneNo).trim().length > 0;
}

export function normalizeGisZone(data: Record<string, unknown>): GisZoneItem {
  const zoneNo = data.zoneNo ?? data.zoneId ?? data.ZoneNo ?? data.ZoneId ?? data.id ?? '';
  const zoneName = data.zoneName ?? data.ZoneName ?? data.name ?? `Zone ${zoneNo}`;
  const zoneId = Number(data.zoneId ?? data.ZoneId ?? (Number.isFinite(Number(zoneNo)) ? Number(zoneNo) : 0));

  return {
    zoneNo: String(zoneNo),
    zoneName: String(zoneName),
    zoneId: zoneId > 0 ? zoneId : undefined,
  };
}

export function isGisWardShape(value: unknown): value is Record<string, unknown> {
  if (!isGisShape(value)) return false;
  const wardNo = value.wardNo ?? value.WardNo ?? value.wardId ?? value.WardId ?? value.id;
  return wardNo !== undefined && wardNo !== null;
}

export function normalizeGisWard(data: Record<string, unknown>): Ward {
  const wardNo = String(data.wardNo ?? data.WardNo ?? data.wardId ?? data.WardId ?? '');
  const wardName = String(data.wardName ?? data.WardName ?? `Ward ${wardNo}`);
  const zoneNo = String(data.zoneNo ?? data.ZoneNo ?? data.zoneId ?? data.ZoneId ?? '');

  return {
    wardNo,
    wardName,
    zoneNo,
  };
}

export function isGisBlockShape(value: unknown): value is Record<string, unknown> {
  if (!isGisShape(value)) return false;
  const blockId = value.blockId ?? value.BlockId ?? value.id ?? value.blockNo;
  return blockId !== undefined && blockId !== null;
}

export function normalizeGisBlock(data: Record<string, unknown>): GisBlockItem {
  const blockId = String(data.blockId ?? data.BlockId ?? data.id ?? data.blockNo ?? '');
  const blockName = String(data.blockName ?? data.BlockName ?? `Block ${blockId}`);

  return {
    blockId,
    blockName,
  };
}

export function isPropertyGroupShape(value: unknown): value is Record<string, unknown> {
  if (!isGisShape(value)) return false;
  return 'id' in value || 'value' in value || 'label' in value;
}

export function normalizePropertyGroup(data: Record<string, unknown>): PropertyGroup {
  const id = data.id ?? data.value ?? data.propertyGroup ?? '0';
  const label = String(data.label ?? data.labelMarathi ?? data.groupName ?? data.name ?? id);
  const total = Number(data.total ?? data.count ?? data.totalCount ?? 0);

  return {
    id: String(id),
    value: String(id),
    label,
    labelMarathi: data.labelMarathi ? String(data.labelMarathi) : undefined,
    total: Number.isFinite(total) ? total : 0,
    color: data.color ? String(data.color) : undefined,
  };
}

export function isPropertyTypeMasterShape(value: unknown): value is Record<string, unknown> {
  if (!isGisShape(value)) return false;
  const id = value.propertyTypeID ?? value.PropertyTypeID ?? value.id ?? value.assetTypeId;
  return id !== undefined && id !== null;
}

export function normalizePropertyTypeMaster(data: Record<string, unknown>): PropertyTypeMasterItem {
  const id = Number(data.propertyTypeID ?? data.PropertyTypeID ?? data.id ?? data.assetTypeId ?? 0);
  const desc = String(data.propertyDescription ?? data.PropertyDescription ?? data.description ?? data.name ?? '');
  const isActive = Boolean(data.isActive ?? data.IsActive ?? true);
  const type = String(data.type ?? data.Type ?? 'all');

  return {
    propertyTypeID: id,
    PropertyTypeID: id,
    propertyDescription: desc,
    PropertyDescription: desc,
    isActive,
    type,
  };
}

export function normalizeGisKpiSummary(data: Record<string, unknown>): GisKpiSummary {
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    totalCount: num(data.totalCount ?? data.TotalCount ?? data.totalProperties ?? data.TotalProperties),
    assessedCount: num(data.assessedCount ?? data.AssessedCount),
    unassessedCount: num(data.unassessedCount ?? data.UnassessedCount),
    internalSurveyCount: num(data.internalSurveyCount ?? data.InternalSurveyCount),
    geoSequencingCount: num(data.geoSequencingCount ?? data.GeoSequencingCount),
    underConstructionCount: num(data.underConstructionCount ?? data.UnderConstructionCount),
    totalApartmentCount: num(data.totalApartmentCount ?? data.TotalApartmentCount),
    residentialCount: num(data.residentialCount ?? data.ResidentialCount),
    commercialCount: num(data.commercialCount ?? data.CommercialCount),
    mixCount: num(data.mixCount ?? data.MixCount),
    plotCount: num(data.plotCount ?? data.PlotCount),
    industryCount: num(data.industryCount ?? data.IndustryCount),
    governmentPropertyCount: num(data.governmentPropertyCount ?? data.GovernmentPropertyCount),
    newUnassessedCount: num(data.newUnassessedCount ?? data.NewUnassessedCount),
    oldUnassessedCount: num(data.oldUnassessedCount ?? data.OldUnassessedCount),
    geoSequencingStructured: num(data.geoSequencingStructured ?? data.GeoSequencingStructured),
    geoSequencingUnit: num(data.geoSequencingUnit ?? data.GeoSequencingUnit),
    assessedStructured: num(data.assessedStructured ?? data.AssessedStructured),
    assessedUnit: num(data.assessedUnit ?? data.AssessedUnit),
    unassessedStructured: num(data.unassessedStructured ?? data.UnassessedStructured),
    unassessedUnit: num(data.unassessedUnit ?? data.UnassessedUnit),
    internalSurveyStructured: num(data.internalSurveyStructured ?? data.InternalSurveyStructured),
    internalSurveyUnit: num(data.internalSurveyUnit ?? data.InternalSurveyUnit),
    underConstructionStructured: num(data.underConstructionStructured ?? data.UnderConstructionStructured),
    underConstructionUnit: num(data.underConstructionUnit ?? data.UnderConstructionUnit),
    isDocumentSubmittedYesCount: num(data.isDocumentSubmittedYesCount ?? data.IsDocumentSubmittedYesCount),
    isDocumentSubmittedNoCount: num(data.isDocumentSubmittedNoCount ?? data.IsDocumentSubmittedNoCount),
    newlyAssessedStructureCount: num(data.newlyAssessedStructureCount ?? data.NewlyAssessedStructureCount),
    newlyAssessedUnitCount: num(data.newlyAssessedUnitCount ?? data.NewlyAssessedUnitCount),
    additionalConstructionCount: num(data.additionalConstructionCount ?? data.AdditionalConstructionCount),
  };
}
