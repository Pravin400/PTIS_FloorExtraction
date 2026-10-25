import type { LucideIcon } from 'lucide-react';
import type { BuildingBasicInfoFormData } from './buildBasicInfo.types';

export interface OwnershipTypeOption {
  id?: number | string;
  Id?: number | string;
  value?: string | number;
  ownershipTypeName?: string;
  name?: string;
  code?: string;
  label?: string;
}

export interface UnitRecord {
  floor?: string;
  floorName?: string;
  FloorName?: string;
  floorId?: number | string;
  subFloor?: string;
  noOfRooms?: number | string;
  carpetAreaSqFeet?: number | string;
  carpetAreaSqFt?: number | string;
  capitalValue?: number | string;
}

export interface InventoryRecord {
  quantity?: number | string;
  names?: { inventoryType?: string };
  category?: string;
  totalBatchCV?: number | string;
  capitalValue?: number | string;
}

export interface CvRollupData {
  totalFloors?: number | string;
  floorCount?: number | string;
  totalUnits?: number | string;
  subUnitsCount?: number | string;
  totalCarpetAreaSqMeter?: number | string;
  totalCapitalValue?: number | string;
  inventoryCapitalValue?: number | string;
}

export interface AssetDetails {
  assetName?: string;
  assetNo?: string;
  assetTypeName?: string;
  assetCategoryName?: string;
  address?: string;
  capitalValue?: number | string;
  currentBookValue?: number | string;
  details?: { landAreaSqMeter?: string | number };
  ownershipType?: string | number;
  [key: string]: unknown;
}

export interface AssetSummaryCardProps {
  floors?: UnitRecord[];
  inventories?: InventoryRecord[];
  cvRollup?: CvRollupData | null;
  asset?: AssetDetails | null;
}

export interface ConfirmationCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface ReviewCardsProps {
  onEdit: (step: number) => void;
  formData?: {
    assetName?: string;
    assetCode?: string;
    assetTypeStr?: string;
    categoryStr?: string;
    address?: string;
    landArea?: string | number;
    ownershipType?: string | number;
    isMovableCategory?: boolean;
    isMovable?: boolean;
    hasInventory?: boolean;
    [key: string]: unknown;
  };
  asset?: AssetDetails;
  inventories?: InventoryRecord[];
  cvRollup?: CvRollupData | null;
  ownershipTypes?: OwnershipTypeOption[];
}

export interface ReviewCardItem {
  id: number;
  step: number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  rows: { label: string; value: string }[];
}

export interface ReviewSubmitContentProps {
  onEditStep: (step: number) => void;
  isConfirmed: boolean;
  setIsConfirmed: (val: boolean) => void;
  assetId: number;
  isBuilding: boolean;
  formData?: Partial<BuildingBasicInfoFormData> & {
    assetTypeStr?: string;
    categoryStr?: string;
    landArea?: string | number;
    isMovableCategory?: boolean;
    isMovable?: boolean;
    hasInventory?: boolean;
    floors?: UnitRecord[];
  };
  ownershipTypes?: OwnershipTypeOption[];
  initialValuationData?: ValuationResponse | null;
}

export interface ValuationResponse {
  success?: boolean;
  error?: string;
  asset?: AssetDetails;
  floors?: UnitRecord[];
  inventories?: InventoryRecord[];
  cvRollup?: CvRollupData;
}

export interface ApprovalStepItem {
  id: number;
  label: string;
  sublabel: string;
  icon?: LucideIcon;
  active?: boolean;
  isCompleted?: boolean;
  isUpcoming?: boolean;
  color?: string;
}

export interface ApprovalWorkflowProps {
  currentStage?: string | number;
  workflowStages?: ApprovalStepItem[];
  assetStatus?: string;
}

export interface ActivateAssetResult {
  success: boolean;
  error?: string;
  message?: string;
  validationErrors?: string[];
}
