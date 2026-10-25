import type { AssetFormData } from "./asset-wizard.types";

export interface RawFieldValue {
  fieldName?: string;
  fieldCode?: string;
  label?: string;
  fieldValue?: string | number | boolean | null;
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  fieldDefinitionId?: number | null;
  FieldName?: string;
  FieldCode?: string;
  FieldValue?: string | number | boolean | null;
  TextValue?: string | null;
  NumberValue?: number | null;
  BooleanValue?: boolean | null;
  DateValue?: string | null;
  FieldDefinitionId?: number | null;
}

export interface RawDbAssetDetails {
  zoneId?: number | string | null;
  zone?: string | null;
  wardId?: number | string | null;
  ward?: string | null;
  departmentId?: number | string | null;
  department?: string | null;
  inChargeRegionalName?: string | null;
  inChargeNameRegional?: string | null;
  address?: string | null;
  regionalAddress?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  csn?: string | null;
  assetConditionId?: number | string | null;
  ownershipType?: string | null;
  encroachmentStatus?: string | null;
  subzone?: string | null;
  subZoneId?: number | string | null;
  subzoneId?: number | string | null;
  mouja?: string | null;
  moujaId?: number | string | null;
  propertyNo?: string | null;
  partitionNo?: string | null;
  upicId?: string | null;
  plotNo?: string | null;
  length?: string | null;
  width?: string | null;
  landArea?: string | null;
  lengthMtr?: number | string | null;
  widthMtr?: number | string | null;
  landAreaSqMeter?: number | string | null;
  nearestLandmark?: string | null;
  pinCode?: string | null;
  inChargeName?: string | null;
  inChargeDesignationId?: number | string | null;
  inChargeMobile?: string | null;
  inChargeEmail?: string | null;
  mpmsNo?: string | null;
  mpmsId?: string | null;
  mpmsNumber?: string | null;
  mpms?: string | null;
}

export interface RawDbAsset extends RawDbAssetDetails {
  id?: number | null;
  assetId?: number | null;
  assetName?: string | null;
  assetNo?: string | null;
  assetCode?: string | null;
  assetRegionalName?: string | null;
  assetCategoryName?: string | null;
  categoryName?: string | null;
  assetTypeName?: string | null;
  typeName?: string | null;
  status?: string | null;
  assetCondition?: string | null;
  condition?: string | null;
  details?: RawDbAssetDetails;
  Details?: RawDbAssetDetails;
  assetDetails?: RawDbAssetDetails;
  AssetDetails?: RawDbAssetDetails;
  fieldValues?: RawFieldValue[];
  FieldValues?: RawFieldValue[];
}

export type PropertySource =
  | RawDbAssetDetails
  | RawDbAsset
  | Partial<AssetFormData>
  | Record<string, string | number | boolean | null | undefined>;

export interface FloorSummaryInputItem {
  noOfRooms?: number | string | null;
  rooms?: Array<{ id?: number | string }>;
  floor?: string | null;
  floorName?: string | null;
  FloorName?: string | null;
  floorId?: number | string | null;
  subFloor?: string | null;
  carpetAreaSqFeet?: number | string | null;
  carpetAreaSqFt?: number | string | null;
  builtUpAreaSqFeet?: number | string | null;
  builtUpAreaSqFt?: number | string | null;
  capitalValue?: number | string | null;
  CapitalValue?: number | string | null;
}
