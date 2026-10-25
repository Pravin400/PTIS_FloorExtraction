export interface BasicInfoFilesPayload {
  frontPhoto?: File;
  buildingPlan?: File;
}

export interface AssetCreationResponseRecord {
  id?: number | string | null;
  Id?: number | string | null;
  assetId?: number | string | null;
  AssetId?: number | string | null;
  assetMasterId?: number | string | null;
  AssetMasterId?: number | string | null;
  items?: AssetCreationResponseRecord | AssetCreationResponseRecord[];
  Items?: AssetCreationResponseRecord | AssetCreationResponseRecord[];
  data?: AssetCreationResponseRecord | AssetCreationResponseRecord[];
  Data?: AssetCreationResponseRecord | AssetCreationResponseRecord[];
  record?: AssetCreationResponseRecord;
  Record?: AssetCreationResponseRecord;
  result?: AssetCreationResponseRecord;
  Result?: AssetCreationResponseRecord;
}

export interface SubmitPhotoMetadataItem {
  photoTypeId: number;
  displayOrder: number;
  remarks: string;
}

export type JsonPrimitive = string | number | boolean | null | undefined;

export type DeepComparableObject = {
  [key: string]: JsonPrimitive | DeepComparableObject | DeepComparableObject[] | File;
};
