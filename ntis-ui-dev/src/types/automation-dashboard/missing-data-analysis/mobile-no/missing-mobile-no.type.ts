export interface MissingMobileNoZone {
  zoneId: number;
  zoneNo: string;
  zoneName: string;
  missingCount: number;
}

export interface MissingMobileNoItem {
  totalMissing: number;
  zones: MissingMobileNoZone[];
}

export interface MissingMobileNoResponse {
  success?: boolean;
  message?: string;
  items: MissingMobileNoItem[];
  errors?: unknown | null;
  correlationId?: string | null;
}
