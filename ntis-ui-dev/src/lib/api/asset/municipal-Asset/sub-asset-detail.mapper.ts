 
import type { SubAssetDetailData, FloorWiseRow } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';
import type { SubAssetApiResponse } from '@/types/asset/municipal-Asset/sub-asset-detail-api.types';
import { formatIndianNumber } from '@/lib/utils/format';

/**
 * Parses a value into a safe number.
 * Removes non-numeric characters before parsing.
 */
function parseNumberSafe(val: unknown): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Truncates a number to strictly 2 decimal places without rounding up.
 */
function truncateArea(value: number | string | null | undefined): number {
  const num = Number(value);
  if (isNaN(num) || num === 0) return 0;
  return Math.floor(num * 100) / 100;
}

export const mapSubAssetToUI = (apiData: SubAssetApiResponse): SubAssetDetailData => {
  // Extract details
  const leaseRentList = Array.isArray(apiData?.renterDetails) && apiData.renterDetails.length > 0 ? apiData.renterDetails : (Array.isArray(apiData?.leaseRentDetails) ? apiData.leaseRentDetails : []);
  const leaseData = leaseRentList.length > 0 ? leaseRentList[0] : null;

  const rentFrequency = leaseData?.paymentFrequency ?? apiData?.paymentFrequency ?? apiData?.details?.paymentFrequency ?? 'Monthly';
  const monthlyRentRaw = parseNumberSafe(leaseData?.monthlyRent ?? leaseData?.rentAmount ?? apiData?.monthlyRent ?? apiData?.rentAmount);
  const arrearsRaw = parseNumberSafe(apiData?.totalArrears ?? apiData?.details?.totalArrears ?? leaseData?.arrears);
  
  // Prioritize totalDemand as it reflects the correct lease period demand, fallback to annualRevenue
  const backendTotalDemand = parseNumberSafe(apiData?.totalDemand ?? apiData?.details?.totalDemand);
  const backendAnnualRevenue = parseNumberSafe(apiData?.annualRevenue ?? apiData?.details?.annualRevenue);
  const annualDemandRaw = backendTotalDemand > 0 ? backendTotalDemand : backendAnnualRevenue;
  
  const totalCollectionRaw = parseNumberSafe(apiData?.totalCollection ?? apiData?.details?.totalCollection);
  const collectionEfficiencyRaw = parseNumberSafe(apiData?.collectionEfficiency ?? apiData?.details?.collectionEfficiency);
  const isRented = apiData?.isRented === true || monthlyRentRaw > 0;
  const occupancyStatus = apiData?.occupancyStatus || (isRented ? 'Occupied' : 'Vacant');
  const floorDetails = Array.isArray(apiData?.floorDetails) ? apiData.floorDetails : [];
  const roomDetails = Array.isArray(apiData?.roomWiseSubmissions) ? apiData.roomWiseSubmissions : [];

  const agreementDateRaw = leaseData?.agreementDate ?? leaseData?.leaseStartDate;
  const agreementEndRaw = leaseData?.toDate ?? leaseData?.leaseEndDate;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDurationString = (startStr: string, endStr: string): string => {
    if (!startStr || !endStr) return '';
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts = [
      `${Math.max(0, years)} Year${years !== 1 ? 's' : ''}`,
      `${Math.max(0, months)} Month${months !== 1 ? 's' : ''}`,
      `${Math.max(0, days)} Day${days !== 1 ? 's' : ''}`
    ];
    
    return parts.join(', ');
  };

  const calculateYearlyRentProjections = (lease: Record<string, unknown> | null): { year: string; amount: number }[] => {
    const startDateRaw = lease?.leaseStartDate ?? lease?.agreementDate;
    if (!lease || !startDateRaw || !lease.duration || Number(lease.duration) <= 0) return [];
    
    const startDate = new Date(String(startDateRaw));
    if (isNaN(startDate.getTime())) return [];
    const startYear = startDate.getFullYear();
    const durationYears = Math.ceil(Number(lease.duration) / 12); 
    const baseMonthlyRent = parseNumberSafe(lease.monthlyRent ?? lease.rentAmount);
    if (baseMonthlyRent <= 0) return [];
    
    const projectionYears = Math.min(10, durationYears);
    
    const incrementValue = parseNumberSafe(lease.incrementValue);
    const isPercentage = String(lease.incrementType || '').toLowerCase().includes('percentage') || String(lease.incrementType || '').toLowerCase() === 'percent' || String(lease.incrementType || '').toLowerCase() === 'per';
    const isFixed = String(lease.incrementType || '').toLowerCase().includes('fixed') || String(lease.incrementType || '').toLowerCase() === 'amount';
    const assumedPercentage = isPercentage || (!isPercentage && !isFixed && incrementValue > 0 && incrementValue <= 100);

    const projections = [];
    let currentAnnualRent = baseMonthlyRent * 12;

    for (let i = 0; i < projectionYears; i++) {
      const yearStr = String(startYear + i);
      
      if (i > 0 && incrementValue > 0) {
        if (assumedPercentage) {
          currentAnnualRent += currentAnnualRent * (incrementValue / 100);
        } else {
          currentAnnualRent += (incrementValue * 12); 
        }
      }
      
      projections.push({
        year: yearStr,
        amount: Math.round(currentAnnualRent)
      });
    }

    return projections;
  };

  const carpetAreaSqM = parseNumberSafe(apiData?.carpetAreaSqMeter ?? apiData?.details?.carpetAreaSqMeter ?? apiData?.totalCarpetArea ?? roomDetails[0]?.areaSqMtr ?? roomDetails[0]?.totalAreaSqMtr);
  const builtupAreaSqM = parseNumberSafe(apiData?.builtUpAreaSqMeter ?? apiData?.builtupAreaSqMeter ?? apiData?.details?.builtUpAreaSqMeter ?? apiData?.totalBuiltUpArea ?? roomDetails[0]?.areaSqMtr ?? roomDetails[0]?.totalAreaSqMtr);
  const capitalValue = parseNumberSafe(apiData?.calculatedCapitalValue ?? apiData?.capitalValue ?? apiData?.details?.capitalValue ?? apiData?.totalCapitalValue);
  const avgWeightedValue = parseNumberSafe(apiData?.avgWeightedValue ?? apiData?.details?.avgWeightedValue ?? apiData?.weightedValue ?? apiData?.details?.weightedValue ?? apiData?.totalWeightedValue);

  let finalPenaltyStr = leaseData?.penaltyRuleName ?? '-';
  if (finalPenaltyStr !== '-' && finalPenaltyStr !== 'NA' && parseNumberSafe(leaseData?.penaltyAmount) > 0) {
    finalPenaltyStr += ` (₹ ${formatIndianNumber(parseNumberSafe(leaseData?.penaltyAmount))})`;
  }

  const floorWiseRows: FloorWiseRow[] = floorDetails.map((floor, index: number) => ({
    sNo: index + 1,
    floor: floor?.floorName ?? floor?.names?.floorName ?? `FLOOR ${index + 1}`,
    yearOfConstruction: parseNumberSafe(floor?.constructionYear),
    constructionType: floor?.constructionTypeName ?? floor?.names?.constructionTypeName ?? '-',
    ageYears: parseNumberSafe(floor?.ageInYears ?? 0),
    usage: floor?.typeOfUseName ?? floor?.names?.typeOfUseName ?? floor?.roomType ?? '-',
    carpetArea: `${formatIndianNumber(parseNumberSafe(floor?.carpetAreaSqFeet ?? 0), 2, 2)} / ${formatIndianNumber(parseNumberSafe(floor?.carpetAreaSqMeter ?? floor?.areaSqMtr ?? floor?.totalAreaSqMtr ?? 0), 2, 2)}`,
    builtupArea: `${formatIndianNumber(parseNumberSafe(floor?.builtUpAreaSqFeet ?? 0), 2, 2)} / ${formatIndianNumber(parseNumberSafe(floor?.builtUpAreaSqMeter ?? floor?.areaSqMtr ?? floor?.totalAreaSqMtr ?? 0), 2, 2)}`,
    rrRate: parseNumberSafe(floor?.cvBaseRate),
    baseValue: parseNumberSafe(floor?.baseValue),
    floorFactor: parseNumberSafe(floor?.cvFloorFactor ?? 1),
    ageFactor: parseNumberSafe(floor?.cvAgeFactor ?? 1),
    ntbFactor: parseNumberSafe(floor?.cvNatureFactor ?? 1),
    useFactor: parseNumberSafe(floor?.cvUseFactor ?? 1),
    capitalValue: parseNumberSafe(floor?.capitalValue)
  }));

  return {
    parentAssetName: apiData?.parentAssetName ?? '-',
    parentAssetId: String(apiData?.parentAssetNo ?? apiData?.parentAssetId ?? ''),
    parentAddress: apiData?.parentAddress ?? '-',
    assetCategoryName: apiData?.assetCategoryName ?? apiData?.details?.assetCategoryName ?? '-',
    assetTypeName: apiData?.assetTypeName ?? apiData?.details?.assetTypeName ?? '-',
    subAssetId: String(apiData?.assetNo ?? apiData?.assetId ?? apiData?.id ?? ''),
    wardNo: String(apiData?.details?.wardNo ?? apiData?.wardNo ?? apiData?.details?.wardName ?? apiData?.wardName ?? '-'),
    propertyNo: apiData?.details?.propertyNo ?? apiData?.propertyNo ?? '-',
    mpmsNo: apiData?.details?.mpmsNo ?? apiData?.mpmsNo ?? '-',
    subAssetShopNo: apiData?.details?.unitNo ?? apiData?.unitNo ?? '-',
    subAssetFloor: floorDetails.length > 0 ? (floorDetails[0].floorName ?? floorDetails[0].names?.floorName ?? '-') : '-',
    subAssetUsage: apiData?.typeOfUseName ?? (floorDetails.length > 0 ? (floorDetails[0].names?.typeOfUseName ?? floorDetails[0].typeOfUseName ?? floorDetails[0].roomType) : null) ?? '-',
    subAssetStatus: String(occupancyStatus).toLowerCase() === 'vacant' ? 'Vacant' : 'Occupied',
    badges: [],
    healthScore: apiData?.healthScore ?? 0,
    healthLabel: apiData?.healthScoreRating ?? '-',
    valuation: `₹ ${formatIndianNumber(capitalValue)}`,

    assetId: String(apiData?.assetId ?? apiData?.assetNo ?? apiData?.id ?? ''),
    latitude: parseNumberSafe(apiData?.latitude) || undefined,
    longitude: parseNumberSafe(apiData?.longitude) || undefined,
    upicId: apiData?.upicId ?? '-',

    monthlyRent: monthlyRentRaw,
    rentFrequency: rentFrequency,
    annualDemand: annualDemandRaw,
    totalCollection: totalCollectionRaw,
    collectionEfficiency: collectionEfficiencyRaw,
    arrearsBalance: arrearsRaw,

    shopNo: apiData?.unitNo ?? apiData?.details?.unitNo ?? '-',
    floor: floorDetails.length > 0 ? (floorDetails[0].floorName ?? floorDetails[0].names?.floorName ?? '-') : '-',
    usage: apiData?.typeOfUseName ?? (floorDetails.length > 0 ? (floorDetails[0].names?.typeOfUseName ?? floorDetails[0].typeOfUseName ?? floorDetails[0].roomType) : null) ?? '-',
    shopName: apiData?.shopUnitName ?? apiData?.assetName ?? '-',
    occupancyStatus: occupancyStatus,
    currentOccupier: leaseData?.tenantName ?? '-',
    authorisedLesseeName: leaseData?.tenantName ?? '-',

    agreementNo: leaseData?.agreementNo ?? leaseData?.agreementId ?? '-',
    agreementDate: formatDate(agreementDateRaw || ''),
    leasePeriod: getDurationString(agreementDateRaw || '', agreementEndRaw || '') || (leaseData?.duration ? `${leaseData.duration} Months` : '-'),
    leaseDurationMonths: leaseData?.duration ? parseNumberSafe(leaseData.duration) : undefined,
    allotmentMethod: leaseData?.allotmentMethod ?? leaseData?.applicationTypeName ?? '-',
    allotmentDate: '-',
    rentBasis: leaseData?.paymentFrequency ?? leaseData?.rentFrequency ?? '-',
    revisionMethod: leaseData?.incrementMethod ?? leaseData?.revisionMethod ?? '-',
    escalation: leaseData?.incrementValue 
      ? (String(leaseData.incrementType || '').toLowerCase().includes('fixed') || String(leaseData.incrementType || '').toLowerCase() === 'amount')
        ? `₹ ${leaseData.incrementValue}`
        : `${leaseData.incrementValue}%`
      : (leaseData?.escalation ?? '-'),
    nextRevisionDate: '-',

    rentAmountMonthly: monthlyRentRaw,
    securityDeposit: parseNumberSafe(leaseData?.securityDeposit),
    sdMethod: leaseData?.depositType ?? '-',
    refundable: typeof leaseData?.depositType === 'string' 
      ? leaseData.depositType.toLowerCase().includes('non-refundable') || leaseData.depositType.toLowerCase().includes('non refundable')
        ? 'No' 
        : leaseData.depositType.toLowerCase().includes('refundable') 
        ? 'Yes' 
        : '-' 
      : '-',
    gstApplicable: leaseData?.isGstApplicable ? 'Yes' : 'No',
    gstRate: parseNumberSafe(leaseData?.gstRate) > 0 ? `${parseNumberSafe(leaseData?.gstRate)}% (₹ ${formatIndianNumber(parseNumberSafe(leaseData?.gstAmount))})` : '-',
    otherCharges: (finalPenaltyStr && finalPenaltyStr !== '-') ? finalPenaltyStr : 'NA',
    billingCycle: leaseData?.paymentFrequency ?? '-',

    yearlyRent: calculateYearlyRentProjections(leaseData),

    totalCarpetArea: `${formatIndianNumber(truncateArea(carpetAreaSqM), 2, 2)} sq.m.`,
    totalBuiltupArea: `${formatIndianNumber(truncateArea(builtupAreaSqM), 2, 2)} sq.m.`,
    readyReckonerRate: `₹ ${formatIndianNumber(parseNumberSafe(floorDetails[0]?.cvBaseRate))}`,
    baseValueAbv: `₹ ${formatIndianNumber(parseNumberSafe(apiData?.baseValue))}`,
    riskFactorAdjustment: '-',
    weightedValueAbv: `${formatIndianNumber(avgWeightedValue, 2, 2)}`,
    finalCapitalValue: `₹ ${formatIndianNumber(capitalValue)}`,

    floorWiseRows,

    subAssetPhotos: [],

    lastInspection: '-',
    nextDueDate: '-',
    inspectionStatus: '-',
    encroachment: apiData?.encroachmentStatus ?? '-',
    legalStatus: apiData?.legalStatus ?? '-',
    lastReview: '-',

    documents: []
  };
};
