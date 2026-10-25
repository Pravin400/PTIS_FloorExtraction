export interface UnitCVRequestPayload {
  id: number;
  Id: number;
  assetId: number;
  AssetId: number;
  subUnitsDetailsId: number;
  SubUnitsDetailsId: number;
  includeChildAssets: boolean;
  IncludeChildAssets: boolean;
  createdBy: number;
  CreatedBy: number;
}

export interface BuildingCVRequestPayload {
  buildingAssetId: number;
  forceRecalculate?: boolean;
  createdBy?: number;
}

export interface MovableCVRequestPayload {
  assetId: number;
  valuationMethod?: number;
  conditionFactor?: number;
  depreciationRate?: number;
  depreciation?: number;
  createdBy?: number;
}
