import React from 'react';
import type { MasterKey } from './master-data.types';

export * from './master-data.types';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route: string;
}

export interface SidebarSection {
  id: string;
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
  colorClass: string;
}

export interface UlbMaster {
  id: number;
  ulbCode: string;
  ulbName: string;
  ulbNameLocal?: string;
  ulbTypeId: number;
  ulbLogo?: string;
  email?: string;
  phoneNo?: string;
  websiteUrl?: string;
  ulbAddress?: string;
  isActive: boolean;
}

export interface MasterConfig {
  id: MasterKey | 'inventoryMaster';
  label: string;
  icon: React.ElementType;
  color: string;
  fields: readonly FieldConfig[];
  dependsOn?: MasterKey;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  masterKey?: MasterKey;
  dependsOnFieldId?: string;
}

/* =============================================================================
   FLOW & DOCUMENT DEFINITIONS
   ============================================================================= */

export type AssetDocumentCategory = 'building' | 'land' | 'infrastructure' | 'movable';
export type AssetDocumentSectionKey = 'basicInfo' | 'legalSafety' | 'inventory' | 'valuation';
export type AssetDocumentIconKey = 'building' | 'shield' | 'inventory' | 'valuation';
export type AssetInventoryIconKey = 'package' | 'fileText' | 'camera' | 'truck';

export interface AssetDocumentFileDefinition {
  id: string;
  fieldName: string;
  documentName: string;
  stage: string;
  categories: AssetDocumentCategory[];
  fileNameFallback: string;
  iconKind: 'photo' | 'document';
  isArray?: boolean;
}

export interface AssetInventoryCollectionDefinition {
  id: string;
  collectionKey: 'furnitureItems' | 'itEquipmentItems' | 'electronicFixturesItems' | 'vehicleItems';
  itemType: string;
  itemIconKey: AssetInventoryIconKey;
  stage: string;
  categories: AssetDocumentCategory[];
  itemNameField: string;
  detailFieldName: string;
  quantityFieldName: string;
  detailMode: 'quantity' | 'registration';
  photoFieldName: string;
  invoiceIdFieldName: string;
  invoiceNumberFieldName: string;
  invoiceDateFieldName: string;
}

export interface AssetDocumentSectionDefinition {
  id: string;
  sectionKey: AssetDocumentSectionKey;
  label: string;
  description: string;
  iconKey: AssetDocumentIconKey;
  categories: AssetDocumentCategory[];
  emptyMessage: string;
  emptyDescription: string;
  fileDocuments: AssetDocumentFileDefinition[];
  inventoryDocuments?: AssetInventoryCollectionDefinition[];
}

export interface AddAssetFlowStepDefinition {
  id: number;
  name: string;
  iconKey: AssetDocumentIconKey | 'inventory';
}

export interface AddAssetFlowDefinition {
  category: AssetDocumentCategory;
  steps: AddAssetFlowStepDefinition[];
}
