export interface MissingAddressZone {
  zoneId: number;
  zoneNo: string;
  zoneName: string;
  missingCount: number;
}

export interface MissingAddressItem {
  totalMissing: number;
  zones: MissingAddressZone[];
}

export interface MissingAddressResponse {
  success?: boolean;
  message?: string;
  items: MissingAddressItem[];
  errors?: unknown | null;
  correlationId?: string | null;
}
