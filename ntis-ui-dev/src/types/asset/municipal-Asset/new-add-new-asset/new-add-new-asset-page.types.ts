import type { InventoryLookups } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/action";
import type { InventoryBatchListResponse } from "@/types/asset/municipal-Asset/new-add-new-asset/inventory-batch.types";
import type React from "react";
import type { LucideIcon } from "lucide-react";
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto, AdditionalImage } from "@/types/asset/media.types";
import type {
  Zone,
  Ward,
  Department,
  Mouja,
  OwnershipType,
  SubZone,
  Designation,
  AssetConditionOption,
} from "./master-data.types";
import type { FloorSummary } from "./form-orchestrator.types";
import type { MovableParentAssetItem } from "./buildBasicInfo-sections.types";
import type { AssetFloorDetailItem } from "./detail-tabs.types";
import type { ParentSubunitLookupItem } from "./basic-info-actions.types";
import type { AssetFormData } from "./asset-wizard.types";
import type { ProcessedField } from "./asset-field-renderer.types";
import type { UseNAFormOrchestratorReturn } from "./form-orchestrator.types";
import type { ValuationResponse } from "./review-submit.types";

export interface NewAddNewAssetPageProps {
  wards?: Ward[];
  zones?: Zone[];
  departments?: Department[];
  moujas?: Mouja[];
  designations?: Designation[];
  ownershipTypes?: OwnershipType[];
  subzones?: SubZone[];
  assetConditions?: AssetConditionOption[];
  parentAssetId?: number | null;
  initialParentAsset?: MovableParentAssetItem | null;
  initialParentFloors?: AssetFloorDetailItem[];
  initialParentSubunits?: ParentSubunitLookupItem[];
  initialWizardData?: Partial<AssetFormData> | null;
  prefetchedFields?: ProcessedField[];
  activeStepKey?: string;
  initialLookups?: InventoryLookups;
  initialBatches?: InventoryBatchListResponse | null;
  initialPhotoTypes?: PropertyPhotoTypeWithStatusDto[];
  initialDbPhotos?: PropertyPhotoDto[];
  initialValuationData?: ValuationResponse | null;
}

export interface NAAssetMediaProps {
  currentStep?: number;
  initialPhotoTypes?: PropertyPhotoTypeWithStatusDto[];
  initialDbPhotos?: PropertyPhotoDto[];
  initialPhotoSlots?: PropertyPhotoTypeWithStatusDto[];
  initialPhotos?: PropertyPhotoDto[];
  isFetchingDb?: boolean;
  onFileStaged?: (photoTypeCode: string, file: File) => void;
  onFileUnstaged?: (photoTypeCode: string, fileOrIndex: number | File) => void;
  onFileReplaced?: (photoTypeCode: string, newFile: File, oldFile?: File, targetImg?: AdditionalImage, index?: number) => void;
  onDbPhotoRemoved?: (photoId: number) => void;
}

export interface FloorCvRollup {
  totalFloors?: number | string | null;
  floorCount?: number | string | null;
  totalUnits?: number | string | null;
  totalCarpetAreaSqMeter?: number | string | null;
  totalBuiltUpAreaSqMeter?: number | string | null;
  totalCapitalValue?: number | string | null;
}

export interface NASummaryCardsProps {
  summary: FloorSummary;
  cvRollup?: FloorCvRollup | number | null;
}

export interface NAProgressStepsProps {
  currentStep?: number;
  completedSteps?: number[];
  onStepClick?: (step: number) => void;
  steps: { id: number; key: string; title: string; subtitle: string; icon: LucideIcon }[];
}

export interface NAFooterProps {
  onPrevious?: () => void;
  previousLabel?: string;
  onSaveAsDraft?: () => void;
  onSaveAndNext?: () => void;
  showPrevious?: boolean;
  saveAndNextLabel?: string;
  saveAndNextDisabled?: boolean;
  isSubmitting?: boolean;
  isSaving?: boolean;
  isFinalSubmitting?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export interface NABasicInfoStepContentProps {
  orchestrator: UseNAFormOrchestratorReturn;
  currentStep: number;
  zones?: Zone[];
  wards?: Ward[];
  moujas?: Mouja[];
  subzones?: SubZone[];
  departments?: Department[];
  ownershipTypes?: OwnershipType[];
  designations?: Designation[];
  assetConditions?: AssetConditionOption[];
  initialParentAsset?: MovableParentAssetItem | null;
  initialParentFloors?: AssetFloorDetailItem[];
  initialParentSubunits?: ParentSubunitLookupItem[];
  initialPhotoTypes?: PropertyPhotoTypeWithStatusDto[];
  initialDbPhotos?: PropertyPhotoDto[];
  cvRollup?: FloorCvRollup | number | null;
}

export interface NAPlaceholderStepContentProps {
  activeStepKey: string;
}

export interface BaseAssetPageProps {
  params: Promise<{ locale: string; assetId?: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface AssetStepPageProps {
  params: Promise<{ locale: string; assetId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface AssetLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; assetId: string }>;
}

export interface AssetStepErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export type NewAddNewAssetErrorProps = AssetStepErrorProps;
export type BasicInfoErrorProps = AssetStepErrorProps;
export type PageProps = BaseAssetPageProps;
export type LayoutProps = AssetLayoutProps;


// Shifted from NewAddNewAsset/types.ts


export interface FloorComponent {
  id: number;
  taxable: boolean;
  unitNumber: string;
  type: string;
  floor: string;
  subFloor: string;
  conYr: string;
  asstYr: string;
  conType: string;
  typeOfUse: string;
  subTypeOfUse: string;
  renter: boolean;
  rooms: number;
  carpet: string;
  builtup: string;
  sdrr: string;
  baseValue: string;
  floorFactor: string;
  ageFactor: string;
  ntbFactor: string;
  useFactor: string;
  capitalValue: string;
}

export interface DocumentInfo {
  id: string;
  name: string;
  size: string;
}

export interface AssetData {
  assetName: string;
  assetCode: string;
  assetCategory: string;
  assetSubCategory: string;
  operationalStatus: string;
  operatingDepartment: string;
  assetUsage: string;
  ownershipType: string;
  inChargeOfficer: string;
  assetTagBarcode: string;
  
  propertyId: string;
  surveyNo: string;
  plotNo: string;
  ctsNo: string;
  ward: string;
  pinCode: string;
  address: string;
  landUseType: string;
  propertyStatus: string;
}
