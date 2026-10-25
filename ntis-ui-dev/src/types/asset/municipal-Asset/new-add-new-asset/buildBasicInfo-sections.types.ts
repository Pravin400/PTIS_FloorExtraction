import React from "react";
import type { ProcessedField } from "@/lib/utils/asset-utils/new-add-new-asset/FieldRendererUtils";
import type { Ward, Zone, Department, Mouja, OwnershipType, Designation, SubZone, AssetConditionOption } from "./master-data.types";
import type { BuildingBasicInfoFormData, BuildingBasicInfoFormErrors, BuildingPropertyDetailsFormData, BuildingOwnershipDetailsFormData, FormFieldChangeEvent } from "./buildBasicInfo.types";
import type { AssetFloorDetailItem, AssetDocumentListItem } from "./detail-tabs.types";
import type { AssetFormData } from "./asset-wizard.types";
import type { AssetPhotoType } from "@/types/asset-masters/asset-photo-type.types";
import type { UseSubType } from "@/types/typeOfUse.types";
import type { ParentSubunitLookupItem } from "./basic-info-actions.types";

export interface BuildingPropertyDetailsSectionProps {
  formData: BuildingPropertyDetailsFormData;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  wards?: Ward[];
  zones?: Zone[];
  moujas?: Mouja[];
  subzones?: SubZone[];
  isLoadingSubzones?: boolean;
  onMoujaChange?: (moujaId: string) => void;
  useTypes?: { id: number; name: string }[];
  subUseTypes?: { id: number; name: string }[];
  isLoadingSubTypes?: boolean;
  assetConditions?: AssetConditionOption[];
}

export interface BuildingOwnershipDetailsSectionProps {
  formData: BuildingOwnershipDetailsFormData;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  departments?: Department[];
  ownershipTypes?: OwnershipType[];
  designations?: Designation[];
  updateFormData?: (patch: Partial<BuildingBasicInfoFormData>) => void;
}

export interface AreaDimensionsSectionProps {
  isBuilding: boolean;
  formData: BuildingBasicInfoFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export interface LandUseTypeSectionProps {
  isLand: boolean;
  formData: BuildingBasicInfoFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  t: (key: string) => string;
  useTypes: { id: number; name: string }[];
  subUseTypes: { id: number; name: string }[];
  isLoadingSubTypes: boolean;
}

export interface PropertyIdentificationFieldsProps {
  formData: BuildingBasicInfoFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  t: (key: string) => string;
  isLand: boolean;
}

export interface PropertyIdentifiersFieldsProps {
  formData: BuildingBasicInfoFormData;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  moujas?: Mouja[];
  subzones?: SubZone[];
  isLoadingSubzones?: boolean;
  onMoujaChange?: (value: string) => void;
  isLand: boolean;
  t: (key: string) => string;
}

export interface PropertyLocationFieldsProps {
  formData: BuildingBasicInfoFormData;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  wards?: Ward[];
  zones?: Zone[];
  isLoadingSubzones?: boolean;
  t: (key: string) => string;
}

export interface LeaseAndOwnerDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  formData: BuildingBasicInfoFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  onSubmit?: () => void;
}

export interface DynamicFieldInputProps {
  field: ProcessedField;
  formData: BuildingBasicInfoFormData | AssetFormData | Record<string, unknown>;
  onAttributeChange: (name: string, value: string | number | boolean) => void;
}

export interface MovableParentAssetItem {
  id?: number | string | null;
  assetId?: number | string | null;
  assetName?: string | null;
  assetNo?: string | null;
  assetCode?: string | null;
  category?: string | null;
  categoryName?: string | null;
  assetCategoryName?: string | null;
  assetType?: string | null;
  assetTypeName?: string | null;
  typeName?: string | null;
  address?: string | null;
}

export interface MovableParentAssetSectionProps {
  formData: BuildingBasicInfoFormData;
  updateFormData: (patch: Partial<BuildingBasicInfoFormData>) => void;
  initialParentAsset?: MovableParentAssetItem | null;
  initialParentFloors?: AssetFloorDetailItem[];
  initialParentSubunits?: ParentSubunitLookupItem[];
}

export interface MovableParentAssetSearchProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  isSearching: boolean;
  searchResults: MovableParentAssetItem[];
  handleSelectAsset: (asset: MovableParentAssetItem) => void;
  t: (key: string) => string;
}

export interface BuildingBasicInfoMediaSectionProps {
  initialFrontPhoto?: string | null;
  initialBuildingPlan?: string | null;
  initialAvailableTypes?: AssetPhotoType[];
  initialExistingDbPhotos?: AssetDocumentListItem[];
}

export interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: string, lng: string) => void;
  initialLat?: string;
  initialLng?: string;
}

export interface LeafletMapContentProps {
  mapType: "street" | "satellite" | "hybrid";
  markerPos: { lat: number; lng: number };
  mapCenter: [number, number];
  onMarkerChange: (lat: number, lng: number) => void;
  onMapRef?: (map: { setView: (center: [number, number], zoom?: number) => void } | null) => void;
}

export interface BasicInfoPageProps {
  wards?: Ward[];
  zones?: Zone[];
  departments?: Department[];
  moujas?: Mouja[];
  ownershipTypes?: OwnershipType[];
  prefetchedFields?: ProcessedField[];
  subzones?: SubZone[];
  assetConditions?: AssetConditionOption[];
  initialFrontPhoto?: string | null;
  initialBuildingPlan?: string | null;
  initialAvailableTypes?: AssetPhotoType[];
  initialExistingDbPhotos?: AssetDocumentListItem[];
  useTypes?: UseSubType[];
  designations?: Designation[];
}

export interface DynamicAttributesFormData {
  categoryId?: number;
  typeId?: number;
  category?: string;
  assetType?: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface DynamicAttributesProps {
  formData: DynamicAttributesFormData;
  onAttributeChange: (name: string, value: string | number | boolean) => void;
  useApi?: boolean;
  prefetchedFields?: ProcessedField[];
}

export interface NAPropertyInfoProps {
  formData: BuildingBasicInfoFormData;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  updateFormData: (patch: Partial<BuildingBasicInfoFormData>) => void;
  departments?: Department[];
  ownershipTypes?: OwnershipType[];
  designations?: Designation[];
  isLoadingDesignations?: boolean;
}

export interface NAPropertyOwnershipSectionProps extends NAPropertyInfoProps {
  deptOptions: { label: string; value: string }[];
  ownershipOptions: { label: string; value: string }[];
  handleChangeWithTranslit: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export interface NAPropertyInChargeSectionProps extends NAPropertyInfoProps {
  designationOptions: { label: string; value: string }[];
  handleChangeWithTranslit: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleInChargeRegionalBlur: (e: React.FocusEvent<HTMLInputElement>) => void | Promise<void>;
  handleAddressRegionalBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void | Promise<void>;
}

export interface NAAssetProfileProps {
  formData: BuildingBasicInfoFormData;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  handleChange: (e: FormFieldChangeEvent) => void;
  updateFormData: (patch: Partial<BuildingBasicInfoFormData>) => void;
  zones?: Zone[];
  wards?: Ward[];
  moujas?: Mouja[];
  subzones?: SubZone[];
  assetConditions?: AssetConditionOption[];
  isLoadingWards?: boolean;
  isLoadingSubzones?: boolean;
}

export interface NAAssetProfileAdministrativeProps extends NAAssetProfileProps {
  zoneOptions: { label: string; value: string }[];
  wardOptions: { label: string; value: string }[];
  moujaOptions: { label: string; value: string }[];
  subzoneOptions: { label: string; value: string }[];
}

export interface NAAssetProfileDimensionsProps extends NAAssetProfileProps {
  conditionOptions: { label: string; value: string }[];
  encroachmentStatusOptions: { label: string; value: string }[];
}
