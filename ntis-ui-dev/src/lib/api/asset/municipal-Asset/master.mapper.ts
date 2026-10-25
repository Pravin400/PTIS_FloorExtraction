 
import { ApiAssetMasterResponse } from '@/types/asset/municipal-Asset/asset-detail-api.types';
import { AssetDetailData } from '@/types/asset/municipal-Asset/asset-detail.types';
import { formatIndianNumber } from '@/lib/utils/format';

/**
 * Truncates a number to strictly 2 decimal places without rounding up.
 * For example: 120.9998 becomes 120.99
 */
function truncateArea(value: number | string | null | undefined): number {
  const num = Number(value);
  if (isNaN(num) || num === 0) return 0;
  return Math.floor(num * 100) / 100;
}
/**
 * Maps raw API Asset Master to the AssetDetailData model used by the UI.
 */
export const mapAssetMasterToUI = (
  apiMaster: ApiAssetMasterResponse
): Partial<AssetDetailData> => {
  if (!apiMaster) return {};

  const backendConfiguredFields = Array.isArray(apiMaster.fieldValues)
    ? apiMaster.fieldValues.map((fv) => ({
        label: String(fv.fieldName || '-'),
        value: String((fv.fieldValue ?? fv.value ?? fv.textValue) || '-'),
      }))
    : [];

  const badges: string[] = [];

  const assetTypeName = apiMaster.assetTypeName || apiMaster.categoryName;
  const isSubUnit = apiMaster.isSubUnit === true || apiMaster.IsSubUnit === true;

  if (assetTypeName) badges.push(assetTypeName);
  if (apiMaster.assetCondition) badges.push(apiMaster.assetCondition);

  const valSource =
    apiMaster.totalValuation ?? apiMaster.capitalValue ?? apiMaster.purchaseValue ?? 0;

  // KPIs
  const kpiValuation = `₹ ${formatIndianNumber(valSource)}`;
  const kpiConstructionValue = apiMaster.constructionValue != null ? `₹ ${formatIndianNumber(apiMaster.constructionValue)}` : undefined;
  const kpiInventoryValue = apiMaster.inventoryValue != null ? `₹ ${formatIndianNumber(apiMaster.inventoryValue)}` : undefined;
  const kpiAnnualRevenue = apiMaster.annualRevenue != null ? `₹ ${formatIndianNumber(apiMaster.annualRevenue)}` : '-';
  const kpiOccupancy = String(apiMaster.occupancyStatus || '-');
  const kpiOccupancyDetails = apiMaster.totalUnits != null ? `${apiMaster.totalSubUnits || 0} / ${apiMaster.totalUnits} Units` : '-';
  const kpiArrears = apiMaster.totalArrears != null ? `₹ ${formatIndianNumber(apiMaster.totalArrears)}` : '-';

  const kpiMetrics = {
    valuation: kpiValuation,
    valuationChange: '-',
    constructionValue: kpiConstructionValue,
    inventoryValue: kpiInventoryValue,
    annualRevenue: kpiAnnualRevenue,
    occupancy: kpiOccupancy,
    occupancyDetails: kpiOccupancyDetails,
    arrears: kpiArrears,
  };

  // Ownership Details
  const moujaName = apiMaster.moujaName || apiMaster.details?.moujaName;
  const subZoneName = apiMaster.subZoneNo || apiMaster.details?.subZoneNo;
  const moujaSubzone = String([moujaName, subZoneName].filter(Boolean).join(' / ') || '-');
  const inChargeName = String(apiMaster.details?.inChargeName ? apiMaster.details.inChargeName : apiMaster.operationalControl || '-');

  // Area Strings
  const landAreaRaw = apiMaster.details?.landAreaSqMeter ?? apiMaster.landAreaSqMeter;
  const plotAreaStr = landAreaRaw != null ? `${formatIndianNumber(truncateArea(landAreaRaw), 2, 2)}` : '-';

  const builtUpAreaRaw = apiMaster.details?.builtUpAreaSqMeter ?? apiMaster.builtUpAreaSqMeter;
  const builtUpAreaStr = builtUpAreaRaw != null ? `${formatIndianNumber(truncateArea(builtUpAreaRaw), 2, 2)}` : '-';

  const carpetAreaRaw = apiMaster.details?.carpetAreaSqMeter ?? apiMaster.carpetAreaSqMeter;
  const carpetAreaStr = carpetAreaRaw != null ? `${formatIndianNumber(truncateArea(carpetAreaRaw), 2, 2)}` : '-';

  // Rent / Financials
  const annualRentTotal = apiMaster.annualRevenue != null ? `₹ ${formatIndianNumber(apiMaster.annualRevenue)}` : '-';
  const monthlyRentTotal = apiMaster.annualRevenue != null ? `₹ ${formatIndianNumber(apiMaster.annualRevenue / 12)}` : '-';
  const avgRentPerShop = apiMaster.annualRevenue != null && apiMaster.totalUnits ? `₹ ${formatIndianNumber(apiMaster.annualRevenue / apiMaster.totalUnits)}` : '-';
  const rentCollectionStr = apiMaster.totalCollection != null ? `₹ ${formatIndianNumber(apiMaster.totalCollection)}` : '-';
  const arrearsStr = apiMaster.totalArrears != null ? `₹ ${formatIndianNumber(apiMaster.totalArrears)}` : '-';

  // Revenue Summary
  const totalDemandStr = apiMaster.totalDemand != null ? `₹ ${formatIndianNumber(apiMaster.totalDemand)}` : '-';
  const collectionStr = apiMaster.totalCollection != null ? `₹ ${formatIndianNumber(apiMaster.totalCollection)}` : '-';
  const balanceArrearsStr = apiMaster.totalArrears != null ? `₹ ${formatIndianNumber(apiMaster.totalArrears)}` : '-';
  const collectionEfficiencyStr = apiMaster.totalDemand != null && apiMaster.totalDemand > 0 && apiMaster.totalCollection != null
    ? `${((apiMaster.totalCollection / apiMaster.totalDemand) * 100).toFixed(0)}%`
    : '-';

  const result: Partial<AssetDetailData> = {
    raw: apiMaster,
    numericId: apiMaster.id,
    category: String(apiMaster.categoryName || apiMaster.assetCategoryName || '-'),
    categoryId: apiMaster.assetCategoryId?.toString() || '0',
    typeId: apiMaster.assetTypeId?.toString() || '0',
    isSubUnit,
    assetType: String(apiMaster.assetTypeName || '-'),
    assetName: String(apiMaster.assetName || apiMaster.name || '-'),
    badges: badges,
    kpiMetrics,
    assetId: String(apiMaster.assetNo || '-'),
    address: String(apiMaster.address || '-'),
    wardNo: String(apiMaster.details?.wardNo || apiMaster.wardName || apiMaster.assetWardNo || '-'),
    assetHealth: apiMaster.healthScore ?? apiMaster.HealthScore ?? 0, // from API
    assetHealthMax: 100,
    assetHealthRating: apiMaster.healthScoreRating,
    encroachmentStatus: apiMaster.encroachmentStatus || undefined,
    latitude: apiMaster.latitude != null ? Number(apiMaster.latitude) : undefined,
    longitude: apiMaster.longitude != null ? Number(apiMaster.longitude) : undefined,
    
    // Basic & Ownership
    propertyNo: String(apiMaster.details?.propertyNo || '-'),
    mpmsNo: String(apiMaster.details?.mpmsNo || '-'),
    moujaSubzone: moujaSubzone,
    upicId: String(apiMaster.details?.upicId || '-'),
    ctsNo: String(apiMaster.csn || apiMaster.details?.csn || '-'),
    ownership: String(apiMaster.organizationName || '-'),
    department: String(apiMaster.departmentName || '-'),
    inCharge: inChargeName,
    inChargeDesignation: String(apiMaster.details?.inChargeDesignationName || '-'),
    inChargeContactNo: String(apiMaster.details?.inChargeMobile || '-'),
    inChargeEmail: String(apiMaster.details?.inChargeEmail || '-'),

    plotNo: String(apiMaster.details?.plotNo || '-'),
    plotArea: plotAreaStr,
    builtUpArea: builtUpAreaStr,
    carpetArea: carpetAreaStr,
    totalFloors: String(apiMaster.totalFloors || '-'),
    yearOfConstruction: String(apiMaster.yearOfConstruction ?? '-'),
    constructionType: String(apiMaster.constructionType ?? '-'),

    // Use Details
    assetUsageType: String(assetTypeName || '-'),
    usage: String(apiMaster.typeOfUseName || apiMaster.subTypeOfUseName || '-'),
    noOfUnits: apiMaster.totalUnits != null ? `${apiMaster.totalUnits} Units` : '-',
    usageStatus: String(apiMaster.occupancyStatus || '-'),

    // Additional Details
    zone: String(apiMaster.zoneName || '-'),
    surveyNo: String(apiMaster.csn || '-'),
    backendConfiguredFields,

    // Legal / Encroachment overrides
    encroachmentArea: '-',
    legalStatus: '-',
    legalSiteReviewDate: '-',

    // Lease / Rent overrides
    annualRentTotal: annualRentTotal,
    monthlyRentTotal: monthlyRentTotal,
    avgRentPerShop: avgRentPerShop,
    rentCollection: rentCollectionStr,
    arrears: arrearsStr,
    totalAgreements: String(apiMaster.totalAgreements ?? '-'),

    // Revenue Summary overrides
    totalDemand: totalDemandStr,
    collection: collectionStr,
    balanceArrears: balanceArrearsStr,
    collectionEfficiency: collectionEfficiencyStr,

    revenueBars: apiMaster.revenueBars?.length
      ? apiMaster.revenueBars.map((bar) => ({
          month: bar.month,
          value: bar.collection,
          maxValue: Math.max(...apiMaster.revenueBars!.map((b) => b.collection), 100),
        }))
      : [],

    // Maintenance overrides
    lastMaintenance: '-',
    nextDue: '-',
    workOrderStatus: '-',
    maintenanceStatus: '-',

    photos: [],
    documents: [],
  };


  return result;
};

/**
 * Maps raw API document data to the DocumentItem models used by the UI.
 */
export const mapDocumentsToUI = (documentsArray: unknown[]) => {
  if (!Array.isArray(documentsArray) || documentsArray.length === 0) return [];

  return documentsArray.map((dRaw: unknown, idx: number) => {
    const d = dRaw as Record<string, unknown>;
    const mimeType = (
      typeof d.mimeType === 'string' ? d.mimeType : typeof d.type === 'string' ? d.type : ''
    ).toLowerCase();
    let iconType: 'image' | 'pdf' | 'doc' = 'doc';
    if (mimeType.includes('pdf')) iconType = 'pdf';
    else if (mimeType.includes('image')) iconType = 'image';

    return {
      id: String(d.documentGuid || d.documentId || d.id || idx),
      name:
        typeof d.documentName === 'string'
          ? d.documentName
          : typeof d.fileName === 'string'
            ? d.fileName
            : typeof d.name === 'string'
              ? d.name
              : `Document ${idx + 1}`,
      type: mimeType || 'document',
      size: typeof d.size === 'string' ? d.size : '0 KB',
      thumbColor: 'bg-slate-100',
      icon: iconType,
      url:
        typeof d.documentGuid === 'string'
          ? `/api/documents/${d.documentGuid}/view`
          : typeof d.url === 'string'
            ? d.url
            : typeof d.filePath === 'string'
              ? d.filePath
              : '',
    };
  });
};

/**
 * Maps raw API photo data to the AssetPhoto models used by the UI.
 */
export const mapPhotosToUI = (photosArray: unknown[]) => {
  if (!Array.isArray(photosArray) || photosArray.length === 0) return [];

  const getScore = (name: string) => {
    if (name === 'asset photo' || name === 'main photo' || name === 'profile photo') return 10;
    if (name.includes('front') || name.includes('profile')) return 5;
    if (name.includes('asset') && !name.includes('plan')) return 3;
    if (name.includes('asset')) return 1;
    return 0;
  };

  return photosArray
    .map((pRaw, idx) => {
      const p = pRaw as Record<string, unknown>;
      const altName = String(
        p.documentName || p.photoTypeName || p.name || p.title || `Photo ${idx + 1}`
      );
      const photoTypeName = String(p.photoTypeName || 'Asset Photos');
      const nameForScore = String(photoTypeName || altName || '').toLowerCase();

      return {
        id: String(p.photoId || p.id || idx),
        url: String(
          p.documentPath ||
            p.url ||
            p.filePath ||
            p.photoUrl ||
            p.documentUrl ||
            (p.documentGuid ? `/api/documents/${p.documentGuid}/view` : '')
        ),
        alt: altName,
        bgColor: 'bg-slate-100',
        photoTypeId: Number(p.photoTypeId) || 1,
        photoTypeName: photoTypeName,
        _sortScore: getScore(nameForScore),
      };
    })
    .sort((a, b) => b._sortScore - a._sortScore)
    .map((p) => {
      const { _sortScore, ...rest } = p;
      return rest;
    });
};
