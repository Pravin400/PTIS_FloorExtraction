/* eslint-disable @typescript-eslint/no-explicit-any */
﻿import { AssetDocumentDto } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-document.service";
import { AssetCategory, AssetType } from "@/lib/api/asset/category-type.service";
import { Zone } from "@/lib/api/asset/zone.service";
import { Ward } from "@/lib/api/asset/ward.service";
import React from "react";

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

export interface NewRegisterSectionProps {
  categories: any[];
  types: any[];
  newData: any;
  setNewData: (val: any) => void;
  isCatLoading: boolean;
  canSubmitNew: boolean;
  onCategoryChange?: (categoryId: number | null) => void;
}

export interface ExistingAssetSectionProps {
  zones: any[];
  wards: any[];
  selectedZoneId: number | null;
  setSelectedZoneId: (val: number | null) => void;
  selectedWardId: number | null;
  setSelectedWardId: (val: number | null) => void;
  assetSearch: string;
  setAssetSearch: (val: string) => void;
  handleAssetSearchChange: (val: string) => void;
  assetResults: any[];
  setAssetResults: (val: any[]) => void;
  totalCount: number;
  setTotalCount: (val: number) => void;
  selectedAsset: any | null;
  setSelectedAsset: (val: any | null) => void;
  isAssetLoading: boolean;
  canSearch: boolean;
}

export interface SuccessModalProps {
  assetName: string;
  assetCode: string;
  onGoToDashboard: () => void;
}

export interface AssetFormHeaderProps {
  children: React.ReactNode;
}

export interface AddAssetDrawerClientProps {
  initialCategories: AssetCategory[];
  initialZones: Zone[];
  initialWards: Ward[];
  initialTypes?: AssetType[];
  initialFloorOptions?: any;
}

export interface AddAssetDrawerProps {
  open: boolean;
  onClose: () => void;
  initialCategories?: AssetCategory[];
  initialZones?: Zone[];
  initialWards?: Ward[];
  initialTypes?: AssetType[];
  initialFloorOptions?: any;
}