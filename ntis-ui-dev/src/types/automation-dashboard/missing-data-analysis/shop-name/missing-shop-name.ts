export interface MissingShopNameZone {
  zoneId: number;
  zoneNo: string;
  zoneName: string;
  missingCount: number;
}

export interface MissingShopNameItem {
  totalMissing: number;
  zones: MissingShopNameZone[];
}

export interface MissingShopNameResponse {
  success?: boolean;
  message?: string;
  items: MissingShopNameItem[];
  errors?: unknown | null;
  correlationId?: string | null;
}
