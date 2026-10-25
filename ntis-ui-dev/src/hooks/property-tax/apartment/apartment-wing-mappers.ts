import { WingData, WingWiseDetailsItems, WingWiseWingDetails } from '@/types/property-tax/apartment';

export const WING_THEME_COLORS = [
  'bg-emerald-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-blue-500',
] as const;

function mapSingleWing(
  wing: WingWiseWingDetails,
  index: number,
  areaUnit?: string,
  defaultSocietyId?: number | null,
  isCommonAmenity = false
): WingData {
  const revDetails = wing?.revenueImpactDetails?.[0];

  const prevRv = revDetails?.previousRV ?? wing?.oldDemand ?? 0;
  const revisedRv = revDetails?.revisedRV ?? wing?.currentDemand ?? 0;
  const revDiff = revDetails?.differenceRV ?? wing?.revenueImpact ?? 0;
  const revImpactAmount = wing?.revenueImpact ?? revDiff ?? 0;
  const revImpactPct = wing?.revenueImpactPercentage ?? 0;
  const revAffectedUnits = revDetails?.affectedUnits ?? wing?.propertyCount ?? 0;

  const wingName = wing?.wingName || wing?.wingNo || (isCommonAmenity ? 'Common Amenities' : '');
  const wingNo = wing?.wingNo || (isCommonAmenity ? 'Common Amenities' : '');

  const letter = isCommonAmenity || wingNo.toLowerCase().includes('common') || wingName.toLowerCase().includes('common')
    ? 'CA'
    : (wingName || wingNo || 'W').charAt(0).toUpperCase();

  const id = wing?.wingDetailId != null 
    ? String(wing.wingDetailId) 
    : (wingNo || wingName || (isCommonAmenity ? `common-amenity-${index}` : index.toString()));

  return {
    id,
    wingId: wing?.wingId ?? null,
    wingMasterId: wing?.wingMasterId ?? null,
    wingDetailId: wing?.wingDetailId ?? null,
    societyId: wing?.societyId ?? defaultSocietyId ?? null,
    wingNo: wingNo,
    letter,
    name: wingName,
    rating: wing?.collectionPercentage || 0,
    blockName: wingNo ? `${wingNo}` : wingName,
    stats: {
      floors: wing?.floorRange || '0',
      props: wing?.propertyCount || 0,
      area: wing?.totalArea || 0,
      collectedPct: wing?.collectionPercentage || 0,
    },
    areaUnit: areaUnit || undefined,
    types:
      wing?.propertyTypes?.map((pt) => ({
        type: (pt?.propertyTypeName as 'Residential' | 'Commercial' | 'Amenity') || 'Residential',
        units: pt?.propertyCount || 0,
        area: pt?.totalArea || 0,
        old: pt?.oldDemand ?? 0,
        cur: pt?.currentDemand ?? 0,
        retro: pt?.retroDemand ?? 0,
        total: pt?.totalDemand ?? 0,
        rev: pt?.totalRevenue ?? 0,
      })) || [],
    exemption: {
      amount: wing?.exemptionAppliedAmount ?? 0,
      count: wing?.exemptedPropertyCount || 0,
    },
    overallTax: {
      from: '',
      to: wing?.totalPropertyTypeDemand ?? wing?.totalDemand ?? wing?.currentDemand ?? 0,
      amount: wing?.totalPropertyTypeDemand ?? wing?.totalDemand ?? wing?.currentDemand ?? 0,
    },
    revenueImpact: {
      amount: revImpactAmount,
      pct: revImpactPct,
      isPositive: String(revImpactAmount).indexOf('-') === -1,
      previousRv: prevRv,
      revisedRv: revisedRv,
      differenceRv: revDiff,
      affectedUnits: revAffectedUnits,
      oldDemand: wing?.oldDemand ?? 0,
      currentDemand: wing?.currentDemand ?? 0,
      retroDemand: wing?.retroDemand ?? 0,
      totalDemand: wing?.totalDemand ?? wing?.totalPropertyTypeDemand ?? 0,
    },
    colorClass: WING_THEME_COLORS[index % WING_THEME_COLORS.length],
    isCommonAmenity,
  };
}

export function mapWingData(
  data: WingWiseDetailsItems | null | undefined,
): WingData[] {
  if (!data) return [];
  const wings = data.wings || [];
  const commonAmenities = data.commonAmenities || [];

  const mappedWings = wings.map((wing, index) =>
    mapSingleWing(wing, index, data.rateMasterAreaUnit ?? undefined, data.societyId, false)
  );

  const mappedAmenities = commonAmenities.map((amenity, index) =>
    mapSingleWing(amenity, wings.length + index, data.rateMasterAreaUnit ?? undefined, data.societyId, true)
  );

  return [...mappedWings, ...mappedAmenities];
}
