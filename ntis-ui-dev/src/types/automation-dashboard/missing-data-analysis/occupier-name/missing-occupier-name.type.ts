export interface MissingOccupierNameZone {
  zoneId: number;
  zoneNo: string;
  zoneName: string;
  missingCount: number;
}

export interface MissingOccupierNameItem {
  totalMissing: number;
  zones: MissingOccupierNameZone[];
}

export interface MissingOccupierNameResponse {
  success?: boolean;
  message?: string;
  items: MissingOccupierNameItem[];
  errors?: unknown | null;
  correlationId?: string | null;
}
