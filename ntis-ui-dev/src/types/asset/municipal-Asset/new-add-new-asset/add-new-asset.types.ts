export type { AssetCategory, AssetType, Zone, Ward } from "./master-data.types";
import type { AssetCategory, AssetType, Zone, Ward } from "./master-data.types";
import type { ReactNode } from "react";

export interface AssetDocumentDto {
  id: number;
  assetId: number;
  documentDefinitionId: number;
  floorDetailId: number | null;
  fileName: string;
  storedFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  documentTitle: string | null;
  documentDate: string | null;
  documentNumber: string | null;
  remarks: string | null;
  isVerified: boolean;
  verifiedBy: number | null;
  verifiedDate: string | null;
  verificationRemarks: string | null;
  createdDate: string;
  documentCode: string | null;
  documentName: string | null;
  documentGuid: string | null;
  coreDocumentId: number | null;
  documentBindingId: number | null;
}

export type DocumentStatus = "pending" | "uploading" | "uploaded" | "error";

export interface DocumentUploadState {
  definitionId: number;
  status: DocumentStatus;
  file?: File;
  uploadedDoc?: AssetDocumentDto;
  error?: string;
}

export interface FloorItem {
  floor?: string;
  constructionYear?: string;
  assessmentYear?: string;
  constructionType?: string;
  natureTypeBuilding?: string;
  subtype?: string;
  noOfRooms?: string | number;
  carpetAreaSqFt?: string | number;
  carpetAreaSqM?: string | number;
  builtUpAreaSqFt?: string | number;
  builtUpAreaSqM?: string | number;
  sdrr?: string | number;
  baseValue?: string | number;
  floorFactorValue?: string | number;
  ageFactorValue?: string | number;
  ntbFactorValue?: string | number;
  useFactorValue?: string | number;
  finalCapitalValue?: string | number;
}

export interface ExistingAssetEntry {
  id: number;
  assetNo: string;
  assetName: string;
  categoryName: string;
  typeName: string;
  address: string;
  zoneName: string | null;
  wardName: string | null;
  assetCategoryId: number | null;
  assetTypeId: number | null;
}

export type DrawerMode = "new" | "existing";

export interface NewAssetRegisterData {
  category: string;
  assetType: string;
  categoryId: number | null;
  typeId: number | null;
}

import type {
  AssetCategory as MunicipalAssetCategory,
  AssetType as MunicipalAssetType,
} from "@/types/asset/municipal-Asset/municipal-asset.types";

export type AddAssetDrawerCategory = AssetCategory | MunicipalAssetCategory;
export type AddAssetDrawerType = AssetType | MunicipalAssetType;

export interface NewRegisterSectionProps {
  categories: AddAssetDrawerCategory[];
  types: AddAssetDrawerType[];
  newData: NewAssetRegisterData;
  setNewData: (val: NewAssetRegisterData | ((prev: NewAssetRegisterData) => NewAssetRegisterData)) => void;
  isCatLoading: boolean;
  canSubmitNew: boolean;
  onCategoryChange?: (categoryId: number | null) => void;
}

export interface ExistingAssetSectionProps {
  zones: Zone[];
  wards: Ward[];
  selectedZoneId: number | null;
  setSelectedZoneId: (val: number | null) => void;
  selectedWardId: number | null;
  setSelectedWardId: (val: number | null) => void;
  assetSearch: string;
  setAssetSearch: (val: string) => void;
  handleAssetSearchChange: (val: string) => void;
  assetResults: ExistingAssetEntry[];
  setAssetResults: (val: ExistingAssetEntry[]) => void;
  totalCount: number;
  setTotalCount: (val: number) => void;
  selectedAsset: ExistingAssetEntry | null;
  setSelectedAsset: (val: ExistingAssetEntry | null | ((prev: ExistingAssetEntry | null) => ExistingAssetEntry | null)) => void;
  isAssetLoading: boolean;
  canSearch: boolean;
}

export interface SuccessModalProps {
  assetName: string;
  assetCode: string;
  onGoToDashboard: () => void;
}

export interface AssetFormHeaderProps {
  children: ReactNode;
}

export interface AddAssetDrawerClientProps {
  initialCategories: AddAssetDrawerCategory[];
  initialZones: Zone[];
  initialWards: Ward[];
  initialTypes?: AddAssetDrawerType[];
  initialFloorOptions?: FloorItem[];
}

export interface AddAssetDrawerProps {
  open: boolean;
  onClose: () => void;
  initialCategories?: AddAssetDrawerCategory[];
  initialZones?: Zone[];
  initialWards?: Ward[];
  initialTypes?: AddAssetDrawerType[];
  initialFloorOptions?: FloorItem[];
}