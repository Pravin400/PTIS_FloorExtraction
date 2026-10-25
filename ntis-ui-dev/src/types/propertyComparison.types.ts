export interface AreaComparison {
  old: number;
  new: number;
  change: number;
  unit: string;
}

export interface ChangeOfUseComparison {
  hasChanged: boolean;
  oldUse: string;
  newUse: string;
}

export interface ValueComparison {
  old: number;
  new: number;
  change: number;
  changePercent?: number;
}

export interface PropertyComparisonResponse {
  oldPropertyIds?: string;
  newPropertyId: number;
  area?: AreaComparison;
  changeOfUse?: ChangeOfUseComparison;
  rv?: ValueComparison;
  cv?: ValueComparison;
  alv?: ValueComparison;
  tax?: ValueComparison;
}
