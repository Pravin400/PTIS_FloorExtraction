export interface MissingRegisteredPropertyZone {
  zoneId: number;
  zoneNo: string;
  zoneName: string;
  totalOldPropertyCount: number;
  mergeOldPropertyCount: number;
  totalMergedProperties: number;
  missingOldPropertyCount: number;
  totalMissingOldPropertyCount: number;
}

export interface MissingRegisteredPropertyItem {
  totalOldPropertyCount: number;
  totalMergedProperties: number;
  mergeOldPropertyCount: number;
  totalMissingOldPropertyCount: number;
  missingOldPropertyCount: number;
  zones: MissingRegisteredPropertyZone[];
}

export interface MissingRegisteredPropertyResponse {
  success?: boolean;
  message?: string;
  items: MissingRegisteredPropertyItem[];
  errors?: unknown | null;
  correlationId?: string | null;
}
