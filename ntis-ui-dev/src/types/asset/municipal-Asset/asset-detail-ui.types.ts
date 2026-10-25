export interface AssetKpiCard {
  id?: string;
  label: string;
  value: string;
  subValue?: string;
  constructionValue?: string;
  inventoryValue?: string;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  valueColor?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  thumbColor: string;
  icon: 'image' | 'pdf' | 'doc';
  url?: string;
}

export interface AssetPhoto {
  id: string;
  url: string;
  alt: string;
  bgColor: string;
  photoTypeId?: number;
  photoTypeName?: string;
}

export interface InventoryItem {
  id: string;
  label: string;
  count: number | string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface DetailedInventoryItem {
  [key: string]: unknown;
  srNo: number;
  category: string;
  assetName: string;
  makeModel: string;
  specifications: string;
  purchaseDate: string;
  owningDepartment: string;
  condition: string;
  quantity: number;
  unitValue: number;
  total: number;
  cv: string | number;
  photoDocumentGuid?: string;
  invoiceDocumentGuid?: string;
  documents?: Record<string, unknown>[];
}

export interface RevenueBar {
  month: string;
  value: number;
  maxValue: number;
}

export interface ShopUnit {
  [key: string]: unknown;
  subAssetId?: number | string;
  sNo: number;
  shopNo: string;
  floor: string;
  floorArea: number;
  usage: string;
  tenantName: string;
  contactNo: string;
  monthlyRent: number;
  arrears: number;
  occupancyStatus: 'Occupied' | 'Vacant' | string;
  agreementEnd: string;
  isAgreementExpired?: boolean;
  assetPhotoGuid?: string;
}

export type FloorSubmission = {
  srNo: number;
  areaType: string;
  floor: string;
  subFloor: string;
  conYr: string;
  asstYr: string;
  conType: string;
  typeOfUse: string;
  subTypeOfUse: string;
  renter: string;
  rooms: number;
  carpetArea: string;
  builtupArea: string;
  sdrr: string;
  baseValue: string;
  floorFactor: string;
  ageFactor: string;
  ntbFactor: string;
  useFactor: string;
  capitalValue: string;
};

export interface AssetDetailData {
  // Header info
  assetType: string;
  assetName: string;
  badges: string[];
  assetId: string;
  address: string;
  assetHealth: number;
  assetHealthMax: number;
  assetHealthRating?: string;

  latitude?: number;
  longitude?: number;

  numericId?: number;
  category?: string;
  categoryId?: string;
  typeId?: string;
  isSubUnit?: boolean;
  raw?: unknown;

  // KPI cards
  kpiMetrics: {
    valuation: string;
    valuationChange?: string;
    constructionValue?: string;
    inventoryValue?: string;
    annualRevenue: string;
    occupancy: string;
    occupancyDetails?: string;
    arrears: string;
  };

  // Basic & Ownership
  wardNo: string;
  propertyNo: string;
  mpmsNo?: string;
  moujaSubzone: string;
  upicId: string;
  ctsNo: string;
  ownership: string;
  department: string;
  inCharge: string;
  inChargeDesignation?: string;
  inChargeContactNo?: string;
  inChargeEmail?: string;

  // Area & Structure
  plotNo: string;
  plotArea: string;
  builtUpArea: string;
  carpetArea: string;
  totalFloors: string;
  yearOfConstruction: string;
  constructionType: string;

  // Use Details
  assetUsageType: string;
  usage: string;
  noOfUnits: string;
  usageStatus: string;
  waterSupply: string;
  electricity: string;
  fireNoc: string;

  // Lease / Rent
  annualRentTotal: string;
  monthlyRentTotal: string;
  avgRentPerShop: string;
  rentCollection: string;
  arrears: string;
  totalAgreements: string;

  // Revenue Summary
  totalDemand: string;
  collection: string;
  collectionEfficiency: string;
  balanceArrears: string;
  revenueBars: RevenueBar[];

  // Inventory Summary
  inventoryItems: InventoryItem[];
  detailedInventoryItems: DetailedInventoryItem[];

  // Additional Details
  addlWardNo: string;
  zone: string;
  surveyNo: string;
  pincode: string;
  addlDepartment: string;
  propertyType: string;
  assetClass: string;
  marketCategory: string;
  backendConfiguredFields?: { label: string; value: string }[];

  // Photos
  photos: AssetPhoto[];

  // Documents
  documents: DocumentItem[];

  // Maintenance
  lastMaintenance: string;
  nextDue: string;
  workOrderStatus: string;
  maintenanceStatus: string;

  // Encroachment
  encroachmentStatus: string;
  encroachmentArea: string;
  legalStatus: string;
  legalSiteReviewDate: string;

  // Units/Shops table
  shopUnits: ShopUnit[];

  // Floor Submissions (for individual properties)
  floorSubmissions: FloorSubmission[];
  totalShops: number;
}

export interface AssetDetailNewCopy {
  pageTitle: string;
  commercialAsset: string;
  assetIdLabel: string;
  addressLabel: string;
  assetHealth: string;
  editLabel: string;
  viewAll: string;
  viewDetails: string;
  viewInventory: string;
  viewFullPlan: string;
  openInGis: string;

  // Section titles
  basicOwnership: string;
  areaStructure: string;
  useDetails: string;
  leaseRent: string;
  revenueSummary: string;
  inventorySummary: string;
  additionalDetails: string;
  assetPhotos: string;
  assetPhotoPlan: string;
  gisLocation: string;
  documentsEvidence: string;
  maintenance: string;
  encroachmentLegal: string;
  unitSubAssetSummary: string;
  valuationLabel?: string;
  annualRevenueLabel?: string;
  currentFY?: string;
  occupancyLabel?: string;

  // Basic & Ownership labels
  wardNo: string;
  propertyNo: string;
  mpmsNo: string;
  moujaSubzone: string;
  upicId: string;
  ctsNo: string;
  ownership: string;
  ownershipDept: string;
  inCharge: string;

  // Area labels
  plotNo: string;
  plotArea: string;
  builtUpArea: string;
  carpetArea: string;
  totalFloors: string;
  yearOfConstruction: string;
  constructionType: string;

  // Use details labels
  assetType: string;
  assetUsage: string;
  noOfUnits: string;
  usageStatus: string;
  waterSupply: string;
  electricity: string;
  fireNoc: string;
  inChargeDesignation?: string;
  inChargeContactNo?: string;
  inChargeEmail?: string;

  // Lease/Rent labels
  annualRentTotal: string;
  monthlyRentTotal: string;
  avgRentPerShop: string;
  rentCollection: string;
  arrearsLabel: string;
  totalAgreements: string;

  // Revenue labels
  totalDemand: string;
  collection: string;
  collectionEfficiency: string;
  balanceArrears: string;

  // Additional Details labels
  zoneLabel: string;
  surveyNo: string;
  pincode: string;
  departmentLabel: string;
  propertyType: string;
  assetClass: string;
  marketCategory: string;

  // Maintenance labels
  lastMaintenance: string;
  nextDue: string;
  workOrderStatus: string;
  maintenanceStatus: string;

  // Encroachment labels
  encroachmentLabel: string;
  encroachmentArea: string;
  legalStatus: string;
  legalSiteReviewDate: string;

  // Table labels
  showLabel: string;
  perPage: string;
  sNo: string;
  shopNo: string;
  floor: string;
  floorArea: string;
  usageCol: string;
  tenantName: string;
  contactNo: string;
  monthlyRent: string;
  arrearsCol: string;
  occupancyStatus: string;
  agreementEnd: string;
  shopPhoto: string;
  actions: string;
  showing: string;
  shops: string;

  // Status labels
  occupied: string;
  vacant: string;
  open: string;
  upToDate: string;
  partiallyEncroached: string;
  fullyEncroached?: string;
  cleanStatus?: string;
  noMajorDispute: string;
  active: string;
  goodCondition: string;

  // Buttons
  qaStatus: string;
  assetBoundary: string;
  wardBoundary: string;
}
import React from 'react';

export interface AdditionalDetailsSectionProps {
  data: AssetDetailData;
}

export interface AreaStructureSectionProps {
  data: AssetDetailData;
  locale: string;
}

export interface AssetDetailPageProps {
  locale: string;
  apiData?: {
    basicDetails?: Partial<AssetDetailData>;
    floorSubmissions: FloorSubmission[];
    shopUnits: ShopUnit[];
    inventory?: { inventoryItems: InventoryItem[]; detailedInventoryItems: DetailedInventoryItem[] };
  };
}

export interface AssetFloorSubmissionSectionProps {
  data: AssetDetailData;
  apiFloorSubmissions?: FloorSubmission[];
}

export interface GisLocationSectionProps {
  data: AssetDetailData;
}

export interface AssetGisLocationMapProps {
  lat: number;
  lng: number;
  zoom: number;
  label?: string;
}

export interface AssetHeaderSectionProps {
  data: AssetDetailData;
}

export interface AssetPhotoPlanSectionProps {
  data?: AssetDetailData;
  copy?: Record<string, string>;
}

export interface AssetPhotosSectionProps {
  data: AssetDetailData;
  copy?: Record<string, string>;
}

export interface UnitSummarySectionProps {
  data: AssetDetailData;
}

export interface BasicOwnershipSectionProps {
  data: AssetDetailData;
  locale: string;
}

export interface BottomActionBarProps {
  data?: AssetDetailData;
}

export interface DocumentsSectionProps {
  data: AssetDetailData;
}

export interface EncroachmentLegalSectionProps {
  data: AssetDetailData;
  locale: string;
}

export interface InventoryDrawerProps {
  open: boolean;
  onClose: () => void;
  items: DetailedInventoryItem[];
  kpiData?: InventoryItem[];
  initialCategoryFilter?: string;
}

export interface InventorySummarySectionProps {
  data: AssetDetailData;
}

export interface LeaseRentSectionProps {
  data: AssetDetailData;
  locale: string;
}

export interface MaintenanceSectionProps {
  data: AssetDetailData;
  locale: string;
}

export interface RevenueSummarySectionProps {
  data: AssetDetailData;
  locale: string;
}

export interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

export interface SectionCardProps {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleIcon?: React.ReactNode;
  iconBgClass?: string;
}

export interface InchargeAndUsageSectionProps {
  data: AssetDetailData;
  locale: string;
}


