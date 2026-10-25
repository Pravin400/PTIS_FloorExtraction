export interface MissingOwnerNameZone {
  zoneId: number;
  zoneNo: string;
  zoneName: string;
  missingCount: number;
}

export interface MissingOwnerNameItem {
  totalMissing: number;
  zones: MissingOwnerNameZone[];
}

export interface MissingOwnerNameResponse {
  success?: boolean;
  message?: string;
  items: MissingOwnerNameItem[];
  errors?: unknown | null;
  correlationId?: string | null;
}
