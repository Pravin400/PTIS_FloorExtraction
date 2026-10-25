export type PtisTab = 'rateable' | 'capital' | 'dual' | 'reassessment' | 'apartment';

export interface PtisPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    wardNo?: string;
    propertyNo?: string;
    partitionNo?: string;
    propertyId?: string;
    wardId?: string;
    tab?: string;
    valuationTab?: string;
    rateableExpand?: string;
    capitalExpand?: string;
    drawer?: string;
    pageNumber?: string;
    pageSize?: string;
    searchTerm?: string;
    appartmentTab?: string;
  }>;
}

export interface OldDetailsApiResponse {
  propertyId: number;
  oldWardNo: string | null;
  oldPropertyNo: string | null;
  oldPartitionNo: string | null;
  oldEgovNo: string | null;
  oldPlotArea: number | null;
  oldPlotNo: string | null;
  oldRV: number | null;
  oldCV: number | null;
  oldALV: number | null;
  oldTotalTax: number | null;
  oldZoneNo: string | null;
  oldConstructionYear: string | null;
  oldCarpetAreaSqFeet: number | null;
  oldCarpetAreaSqMeter: number | null;
  oldRegistration: boolean | null;
  oldConstructionTypeId: string | null;
  oldTypeOfUseId: string | null;
  oldConstructionArea?: number | null;
  oldGeneralTax?: number | null;
}

export interface OldFloorDetailsApiResponse {
  floor: string | null;
  year: string | null;
  constructionType: string | null;
  typeOfUse: string | null;
  carpetAreaSqft: number | null;
  carpetAreaSqmtr: number | null;
  registration: boolean | null;
}
