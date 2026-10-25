import type { AssetPhoto, DocumentItem } from './asset-detail.types';
import type { HistoryItem } from './sub-asset-detail-api.types';


export interface FloorWiseRow {
  [key: string]: unknown;
  sNo: number;
  floor: string;
  yearOfConstruction: number;
  constructionType: string;
  ageYears: number;
  usage: string;
  carpetArea: string;
  builtupArea: string;
  rrRate: number;
  baseValue: number;
  floorFactor: number;
  ageFactor: number;
  ntbFactor: number;
  useFactor: number;
  capitalValue: number;
}

export interface SubAssetDetailData {
  // Header
  parentAssetName: string;
  parentAssetId: string;
  parentAddress: string;
  assetCategoryName?: string;
  assetTypeName?: string;
  subAssetId: string;
  mpmsNo?: string;
  wardNo?: string;
  propertyNo?: string;
  assetId?: string | number;
  latitude?: number;
  longitude?: number;
  upicId?: string;
  subAssetShopNo: string;
  subAssetFloor: string;
  subAssetUsage: string;
  subAssetStatus: 'Occupied' | 'Vacant';
  badges: string[];
  healthScore: number;
  healthLabel: string;
  valuation: string;
  valuationChange?: string;

  // GIS & Location

  // Revenue & Collection
  monthlyRent: number;
  rentFrequency: string;
  annualDemand: number;
  totalCollection: number;
  collectionEfficiency: number; // 0-100
  arrearsBalance: number;

  // Sub Asset Basic Details
  shopNo: string;
  floor: string;
  usage: string;
  shopName: string;
  occupancyStatus: string;
  currentOccupier: string;
  authorisedLesseeName: string;

  // Lease / Rent Details
  agreementNo: string;
  agreementDate: string;
  leasePeriod: string;
  leaseDurationMonths?: number;
  allotmentMethod: string;
  allotmentDate: string;
  rentBasis: string;
  revisionMethod: string;
  escalation: string;
  nextRevisionDate: string;

  // Financial Details
  rentAmountMonthly: number;
  securityDeposit: number;
  sdMethod: string;
  refundable: string;
  gstApplicable: string;
  gstRate: string;
  otherCharges: string;
  billingCycle: string;

  // Year-wise Incremental Rent
  yearlyRent: { year: string; amount: number }[];

  // Valuation Metrics
  totalCarpetArea: string;
  totalBuiltupArea: string;
  readyReckonerRate: string;
  baseValueAbv: string;
  riskFactorAdjustment: string;
  weightedValueAbv: string;
  finalCapitalValue: string;

  // Floor-wise valuation table
  floorWiseRows: FloorWiseRow[];

  // Photos
  subAssetPhotos: AssetPhoto[];

  // Maintenance
  lastInspection: string;
  nextDueDate: string;
  inspectionStatus: string;

  // Encroachment
  encroachment: string;
  legalStatus: string;
  lastReview: string;

  // Documents
  documents: DocumentItem[];
}



// ---------------------------------------------------------
// Component Props Interfaces
// ---------------------------------------------------------

export interface SubAssetHeaderSectionProps { data: SubAssetDetailData; }
export interface RevenueCollectionSectionProps { data: SubAssetDetailData; }
export interface SubAssetInfoPanelsProps { data: SubAssetDetailData; }
export interface LeaseAndFinancialSectionsProps { data: SubAssetDetailData; }
export interface YearWiseRentChartSectionProps { data: SubAssetDetailData; }
export interface ValuationMetricsStripProps { data: SubAssetDetailData; }
export interface FloorWiseValuationSectionProps { data: SubAssetDetailData; }
export interface SubAssetDocumentsSectionProps { data: SubAssetDetailData; }
export interface SubAssetStatusSectionsProps { data: SubAssetDetailData; }
export interface SubAssetRightColumnSectionsProps { data: SubAssetDetailData; }

export interface QuickActionsSectionProps { subAssetId: number; rentFrequency?: string; }
export interface SubAssetDetailPageProps { apiData?: SubAssetDetailData; subAssetIdNum?: number; }

export interface CollectionHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  data: HistoryItem[];
  totals?: Record<string, number> | null;
  loading: boolean;
  rentFrequency?: string;
}
