/**
 * buildBasicInfo.types.ts
 *
 * Core form model types scoped to the Building Asset → Basic Info registration step.
 */

import type React from "react";
import type { ProcessedField } from "@/lib/utils/asset-utils/new-add-new-asset/FieldRendererUtils";

export type FormFieldChangeEvent =
  | React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  | { target: { name: string; value: string } };

// ─── Section A: Property Number Details ──────────────────────────────────────

export interface BuildingPropertyDetailsFormData {
  category: string;
  assetType: string;
  zone: string;
  subzone: string;
  ward: string;
  mouja: string;
  propertyNumber: string;
  surveyNumber: string;
  partitionNo?: string;
  upicId?: string;
  condition?: string;
  assetConditionId?: string | number;
  encroachmentStatus?: string;
  isRevenueGenerating?: string;
  landArea?: string;
  valuationType?: string;
  length?: string;
  width?: string;
  isMovableCategory?: boolean;
  parentBuildingId?: number | null;
  hasFloorDetails?: boolean;
  hasInventory?: boolean;
  isInventoryMandatory?: boolean;
  hasLegalCompliance?: boolean;
  categoryCode?: string;
  plotNumber?: string;
  mpmsNo?: string;
  pTaxId?: string;
  mpmsId?: string;
  mpms?: string;
  csn?: string;
  typeOfUseId?: string;
  subTypeOfUseId?: string;
  offset?: string;
  offsetOp?: string;
  constructionYear?: string;
}

// ─── Section B: Ownership & Address Details ───────────────────────────────────

export interface BuildingOwnershipDetailsFormData {
  assetName: string;
  assetNameRegional: string;
  department: string;
  fullAddress: string;
  fullAddressRegional?: string;
  locality: string;
  pinCode: string;
  ownershipType: string;
  operationalControl: string;
  inChargeName: string;
  inChargeNameRegional?: string;
  inChargeRegionalName?: string;
  inChargeDesignation: string;
  inChargeMobile: string;
  contactNumber?: string;
  inChargeEmail: string;
  assetRegionalName?: string;
  latitude?: string;
  longitude?: string;
  isMovableCategory?: boolean;
  parentBuildingId?: number | null;
  hasFloorDetails?: boolean;
  isRented?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  leaseAmount?: string;
  securityDeposit?: string;
  paymentFrequency?: string;
  lessorName?: string;
  lessorMobile?: string;
  lessorEmail?: string;
  lessorAddress?: string;
}

// ─── Combined form model ──────────────────────────────────────────────────────

export interface BuildingBasicInfoFormData
  extends BuildingPropertyDetailsFormData,
  BuildingOwnershipDetailsFormData {
  id?: number;
  assetId?: number;
  attributes: Record<string, string | number | boolean>;
  categoryId: number;
  typeId: number;
  zoneId?: string;
  wardId?: string;
  departmentId?: string;
  subZoneId?: string;
  moujaId?: string;
  status?: string;
  condition?: string;
  assetCode?: string;
  assetNo?: string;
  categoryStr?: string;
  capitalValue?: number | string | null;
  hydrated?: boolean;
  totalLength?: string | number;
  averageWidth?: string | number;
  landRate?: string | number;
  occupancyStatus?: string;
  parentAssetId?: number | null;
  assetWardNo?: string;
  assetCondition?: string | number;
}

// ─── Validation error map ─────────────────────────────────────────────────────

export type BuildingBasicInfoFormErrors = Partial<
  Record<keyof BuildingBasicInfoFormData, string>
>;

// ─── Dynamic Attributes & Step Props ──────────────────────────────────────────

export interface BuildingDynamicAttributesSectionProps {
  prefetchedFields: ProcessedField[];
  attributes: Record<string, string | number | boolean>;
  onAttributeChange: (name: string, value: string | number | boolean) => void;
}

export interface BuildingBasicInfoStepProps {
  prefetchedFields: ProcessedField[];
}

export const INITIAL_BUILDING_BASIC_INFO: BuildingBasicInfoFormData = {
  id: 0,
  assetId: 0,
  category: "",
  assetType: "",
  zone: "",
  subzone: "",
  ward: "",
  mouja: "",
  propertyNumber: "",
  surveyNumber: "",
  partitionNo: "",
  upicId: "",
  condition: "",
  encroachmentStatus: "",
  length: "",
  width: "",
  plotNumber: "",
  pTaxId: "",
  mpmsNo: "",
  typeOfUseId: "",
  subTypeOfUseId: "",
  offset: "",
  offsetOp: "",
  assetName: "",
  assetNameRegional: "",
  department: "",
  fullAddress: "",
  locality: "",
  pinCode: "",
  ownershipType: "",
  operationalControl: "",
  inChargeName: "",
  inChargeDesignation: "",
  inChargeMobile: "",
  inChargeEmail: "",
  latitude: "",
  longitude: "",
  isRented: "No",
  leaseStartDate: "",
  leaseEndDate: "",
  leaseAmount: "",
  securityDeposit: "",
  paymentFrequency: "",
  lessorName: "",
  lessorMobile: "",
  lessorEmail: "",
  lessorAddress: "",
  attributes: {},
  categoryId: 0,
  typeId: 0,
};

export interface ExtendedBuildingBasicInfoFormData extends BuildingBasicInfoFormData {
  movableAssetType?: string;
  leasePeriodYears?: string | number;
  monthlyRent?: string | number;
  depositAmount?: string | number;
  lesseeName?: string;
  owningDepartmentId?: string | number;
  email?: string;
  regionalAddress?: string;
}

export * from "./buildBasicInfo-sections.types";
