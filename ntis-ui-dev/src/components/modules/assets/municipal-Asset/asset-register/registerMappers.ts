import type { AssetRegisterRow } from '@/types/asset/asset-register/municipal-asset-register.types';
import type { AssetRegisterApiRecord } from '@/types/asset/asset-register/municipal-asset-service.types';
import type { AssetRegisterSubUnitItem } from '@/lib/api/asset/asset-register/municipal-asset-register.service';
import { formatBoolean, formatFieldValue } from './registerMappers.helpers';

export * from './registerMappers.helpers';

export function mapAssetToRow(item: AssetRegisterApiRecord, fallbackCategoryName: string): AssetRegisterRow {
  const record = item;
  const parsedId = Number(record.id);
  const safeId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
  const latitude = record.latitude ?? record.details?.latitude;
  const longitude = record.longitude ?? record.details?.longitude;

  return {
    id: safeId,
    assetId: record.assetNo || '-',
    authorityName: record.authorityName || '-',
    organizationName: record.organizationName || '-',
    departmentName: record.departmentName || '-',
    assetCode: record.assetNo || '-',
    assetName: record.assetName || '-',
    categoryName: record.assetCategoryName || fallbackCategoryName || '-',
    assetTypeName: record.assetTypeName || '-',
    parentAssetName: record.parentAssetName || '-',
    address: record.address || (record.details?.address as string) || '-',
    wardName: record.wardName || '-',
    zoneName: record.zoneName || '-',
    latitude: latitude != null ? String(latitude) : '-',
    longitude: longitude != null ? String(longitude) : '-',
    csn: record.csn || (record.details?.csn as string) || '-',
    hasLift: formatBoolean(record.hasLift),
    purchaseDate: record.purchaseDate || '',
    marketValueDate: record.marketValueDate || '',
    capitalValue: record.capitalValue == null ? '-' : String(record.capitalValue),
    lastCVCalculationDate: record.lastCVCalculationDate || '',
    currentBookValue: record.currentBookValue == null ? '-' : String(record.currentBookValue),
    depreciationRate: record.depreciationRate == null ? '-' : String(record.depreciationRate),
    isRevenueGenerating: formatBoolean(record.isRevenueGenerating),
    operationalControl: record.operationalControl || '-',
    fieldValues: formatFieldValue(record.fieldValues),
    occupancyStatus: record.occupancyStatus || '-',
    ownershipType: record.ownershipType || '-',
    assetCondition: record.assetCondition || '-',
    lifeYears: record.assetLife != null ? String(record.assetLife) : '-',
    purchaseValue: record.purchaseValue == null ? '-' : String(record.purchaseValue),
    marketValue: record.marketValue == null ? '-' : String(record.marketValue),
    depreciation: record.depreciation == null ? '-' : String(record.depreciation),
    netBookValue: record.currentBookValue != null
      ? String(record.currentBookValue)
      : record.capitalValue != null
        ? String(record.capitalValue)
        : record.marketValue != null
          ? String(record.marketValue)
          : '-',
    builtUpAreaSqMeter: record.builtUpAreaSqMeter != null || record.details?.builtUpAreaSqMeter != null
      ? String(record.builtUpAreaSqMeter ?? record.details?.builtUpAreaSqMeter)
      : '-',
    carpetAreaSqMeter: record.carpetAreaSqMeter != null || record.details?.carpetAreaSqMeter != null
      ? String(record.carpetAreaSqMeter ?? record.details?.carpetAreaSqMeter)
      : '-',
    landAreaSqMeter: record.plotAreaSqMeter != null || record.landAreaSqMeter != null || record.details?.landAreaSqMeter != null
      ? String(record.plotAreaSqMeter ?? record.landAreaSqMeter ?? record.details?.landAreaSqMeter)
      : '-',
    createdDate: record.createdDate || record.updatedDate || '',
    assetCategoryId: record.assetCategoryId || null,
    assetTypeId: record.assetTypeId || null,
    assetDocumentId: record.assetDocumentId || null,
    totalSubUnits: record.totalSubUnits != null ? Number(record.totalSubUnits) : 0,
    annualRevenue: record.annualRevenue == null ? '-' : String(record.annualRevenue),
    outstandingAmount: record.outstandingAmount == null ? '-' : String(record.outstandingAmount),
    encroachmentStatus: record.encroachmentStatus || '-',
    photoCount: record.photoCount == null ? '0' : String(record.photoCount),
    documentCount: record.documentCount == null ? '0' : String(record.documentCount),
    activeLeaseCount: record.activeLeaseCount ?? 0,
    mpmsNo: record.mpmsNo || '-',
    constructionYear: record.constructionYear == null ? '-' : String(record.constructionYear),
    constructionTypeName: record.constructionTypeName || '-',
    typeOfUseName: record.typeOfUseName || '-',
    totalFloors: record.totalFloors == null ? '-' : String(record.totalFloors),
    hasPlanDocument: Boolean(record.hasPlanDocument),
    hasTitleDocument: Boolean(record.hasTitleDocument),
    hasSurveyDocument: Boolean(record.hasSurveyDocument),
    expandControl: '',
  };
}

export function mapExpandedSubUnitItems(
  items: AssetRegisterSubUnitItem[],
  parentId: number
): Array<AssetRegisterSubUnitItem & { isSubUnit: true; parentId: number }> {
  return items.map((item) => ({
    ...item,
    isSubUnit: true,
    parentId,
  }));
}

export function mapSubUnitToAssetRegisterRow(subUnit: AssetRegisterSubUnitItem, asset: AssetRegisterRow): AssetRegisterRow {
  return {
    id: subUnit.id,
    assetId: subUnit.assetNo || '-',
    authorityName: asset.authorityName,
    organizationName: asset.organizationName,
    departmentName: asset.departmentName,
    assetCode: subUnit.assetNo || '-',
    assetName: subUnit.assetName || '-',
    categoryName: subUnit.assetCategoryName || asset.categoryName || '-',
    assetTypeName: subUnit.assetTypeName || '-',
    parentAssetName: asset.assetName,
    address: asset.address,
    wardName: asset.wardName || '-',
    zoneName: asset.zoneName || '-',
    latitude: asset.latitude,
    longitude: asset.longitude,
    csn: asset.csn,
    hasLift: asset.hasLift,
    purchaseDate: asset.purchaseDate,
    marketValueDate: asset.marketValueDate,
    capitalValue: subUnit.capitalValue == null ? '-' : String(subUnit.capitalValue),
    lastCVCalculationDate: subUnit.lastCVDate || '',
    currentBookValue: '-',
    depreciation: '-',
    netBookValue: '-',
    lifeYears: subUnit.assetLife != null ? String(subUnit.assetLife) : '-',
    depreciationRate: '-',
    isRevenueGenerating: asset.isRevenueGenerating,
    operationalControl: asset.operationalControl,
    fieldValues: '-',
    occupancyStatus: subUnit.occupancyStatus || subUnit.occupancy || subUnit.typeOfUseName || '-',
    ownershipType: asset.ownershipType,
    assetCondition: subUnit.status || '-',
    purchaseValue: '-',
    marketValue: '-',
    builtUpAreaSqMeter: subUnit.builtUpAreaSqMeter == null ? '-' : String(subUnit.builtUpAreaSqMeter),
    carpetAreaSqMeter: subUnit.carpetAreaSqMeter == null ? '-' : String(subUnit.carpetAreaSqMeter),
    landAreaSqMeter: '-',
    createdDate: '',
    assetCategoryId: asset.assetCategoryId,
    assetTypeId: asset.assetTypeId,
    assetDocumentId: null,
    isSubUnit: true,
    parentId: asset.id ?? undefined,
    annualRevenue: '-',
    outstandingAmount: '-',
    encroachmentStatus: '-',
    photoCount: String(subUnit.photoCount ?? (Array.isArray(subUnit.photos) ? subUnit.photos.length : 0)),
    documentCount: String(subUnit.documentCount ?? (Array.isArray(subUnit.documents) ? subUnit.documents.length : 0)),
    activeLeaseCount: undefined,
    mpmsNo: '-',
    constructionYear: subUnit.constructionYear != null ? String(subUnit.constructionYear) : '-',
    constructionTypeName: subUnit.constructionTypeName || '-',
    typeOfUseName: subUnit.typeOfUseName || '-',
    totalFloors: subUnit.floorDetails?.length ? String(subUnit.floorDetails.length) : '-',
    hasPlanDocument: false,
    hasTitleDocument: false,
    hasSurveyDocument: false,
    expandControl: '',
  };
}
