import type { Zone, Ward, Department, AssetType } from "@/types/asset/asset-register/municipal-asset-service.types";
import type { AssetCategory } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-category.types";

export type { Zone, Ward, Department, AssetCategory, AssetType };

export interface OwnershipType {
  id: number;
  code?: string;
  name?: string;
  ownershipTypeName?: string;
  description?: string;
  isActive: boolean;
}

export interface Mouja {
  id: number;
  moujaName: string;
  moujaCode?: string;
  isActive?: boolean;
}

export interface SubZone {
  id?: number;
  subZoneNo?: string;
  subZoneName?: string;
  subzoneName?: string;
  SubZoneNo?: string;
  name?: string;
  moujaId?: number;
  isActive?: boolean;
}

export interface Designation {
  id: number;
  designationName?: string;
  designationCode?: string;
  name?: string;
  owningDepartmentId?: number;
  isActive?: boolean;
}

export interface AssetConditionOption {
  id: number;
  conditionCategory: string;
  categoryId: number;
  conditionName: string;
  description?: string | null;
  displayOrder?: number | null;
}

export interface InventoryConditionOption {
  id: number;
  inventoryItemCategoryId: number;
  conditionName: string;
  description?: string | null;
  conditionFactor: number;
  displayOrder?: number | null;
  isActive: boolean;
}

export type { AssetFieldDefinition } from "./asset-field-renderer.types";

export interface AssetFieldValueSaveRequest {
  assetId: number;
  fieldDefinitionId: number;
  fieldName: string;
  fieldValue?: string | null;
  isActive?: boolean;
  createdBy?: number;
}

export interface MasterDataRecord {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate?: string;
  parentId?: string;
  parentCategory?: string;
  templateKey?: string;
  hiddenSectionKeys?: string;
  screenFieldSelectionsJson?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface MasterDataConfig {
  assetCategory: MasterDataRecord[];
  assetType: MasterDataRecord[];
  zone: MasterDataRecord[];
  ward: MasterDataRecord[];
  propertyCategory: MasterDataRecord[];
  propertySubCategory: MasterDataRecord[];
  owningDepartment: MasterDataRecord[];
  ownershipType: MasterDataRecord[];
  maintainingDepartment: MasterDataRecord[];
  yesNo: MasterDataRecord[];
  landAreaUnit: MasterDataRecord[];
  landShape: MasterDataRecord[];
  encumbranceStatus: MasterDataRecord[];
  terrainType: MasterDataRecord[];
  approachRoadType: MasterDataRecord[];
  surroundingDevelopment: MasterDataRecord[];
  currentLandUsage: MasterDataRecord[];
  buildableStatus: MasterDataRecord[];
  floodProneArea: MasterDataRecord[];
  inventoryType: MasterDataRecord[];
  inventorySubType: MasterDataRecord[];
  furnitureItemName: MasterDataRecord[];
  furnitureTypeModel: MasterDataRecord[];
  equipmentName: MasterDataRecord[];
  equipmentBrandModel: MasterDataRecord[];
  inventoryCondition: MasterDataRecord[];
  equipmentStatus: MasterDataRecord[];
  rentFrequency: MasterDataRecord[];
  depositType: MasterDataRecord[];
  landClassification: MasterDataRecord[];
  plotBoundaryType: MasterDataRecord[];
  condition: MasterDataRecord[];
  roadCategory: MasterDataRecord[];
  roadClass: MasterDataRecord[];
  numberOfLanes: MasterDataRecord[];
  surfaceType: MasterDataRecord[];
  trafficFlow: MasterDataRecord[];
  medianType: MasterDataRecord[];
  footpathAvailability: MasterDataRecord[];
  drainageSystem: MasterDataRecord[];
  streetLighting: MasterDataRecord[];
  roadMarking: MasterDataRecord[];
  trafficSignals: MasterDataRecord[];
  parkingFacility: MasterDataRecord[];
  electronicFixturesName: MasterDataRecord[];
  electronicFixturesModel: MasterDataRecord[];
  vehicleType: MasterDataRecord[];
  vehicleMakeModel: MasterDataRecord[];
}

export type MasterKey = keyof MasterDataConfig;

export interface LinkedFieldMasterBucket {
  id: string;
  fieldId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  screenName: string;
  sectionId: string;
  sectionLabel: string;
  masterKey?: string;
  dependsOnFieldId?: string;
  parentBucketId?: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate?: string;
  records: MasterDataRecord[];
}

export interface LinkedFieldMasterMeta {
  fieldId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  screenName: string;
  sectionId: string;
  sectionLabel: string;
  masterKey?: string;
  dependsOnFieldId?: string;
  seedOptions?: Array<{ value: string; label: string }>;
}

export interface ConfigurationMasterContextType {
  masterData: MasterDataConfig;
  linkedFieldMasters: LinkedFieldMasterBucket[];
  isLoading: boolean;
  isMutating: boolean;
  getMasterDataByKey: (key: MasterKey) => MasterDataRecord[];
  getActiveDataByKey: (key: MasterKey) => MasterDataRecord[];
  getDependentData: (key: MasterKey, parentId: string) => MasterDataRecord[];
  addMasterData: (key: MasterKey, record: Omit<MasterDataRecord, 'id' | 'createdDate'>) => void;
  updateMasterData: (key: MasterKey, id: number, record: Partial<MasterDataRecord>) => void;
  deleteMasterData: (key: MasterKey, id: number) => void;
  toggleActiveStatus: (key: MasterKey, id: number) => void;
  refreshMasterData: () => void;
  ensureLinkedFieldMaster: (meta: LinkedFieldMasterMeta) => LinkedFieldMasterBucket;
  ensureLinkedFieldMasters: (metas: LinkedFieldMasterMeta[]) => LinkedFieldMasterBucket[];
  getLinkedFieldMasterByFieldId: (fieldId: string) => LinkedFieldMasterBucket | null;
  getLinkedFieldMasterById: (bucketId: string) => LinkedFieldMasterBucket | null;
  getLinkedFieldMasterRecords: (bucketId: string) => MasterDataRecord[];
  addLinkedFieldMasterRecord: (bucketId: string, record: Omit<MasterDataRecord, 'id' | 'createdDate'>) => void;
  updateLinkedFieldMasterRecord: (bucketId: string, id: number, record: Partial<MasterDataRecord>) => void;
  deleteLinkedFieldMasterRecord: (bucketId: string, id: number) => void;
  toggleLinkedFieldMasterRecordStatus: (bucketId: string, id: number) => void;
  toggleLinkedFieldMasterStatus: (bucketId: string) => void;
  deleteLinkedFieldMaster: (bucketId: string) => void;
  getOrphanMasterIds: () => string[];
}

export interface UseTypeItem {
  id: number;
  name: string;
  isActive?: boolean | number | null;
  IsActive?: boolean | number | null;
  status?: string | null;
}

export interface SubUseTypeItem {
  id: number;
  name: string;
  isActive?: boolean | number | null;
  IsActive?: boolean | number | null;
  status?: string | null;
}

