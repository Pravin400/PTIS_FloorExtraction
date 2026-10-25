export interface MissingPhotoPlanZone {
  zoneId: number;
  zoneNo: string;
  zoneName: string;
  photoMissing: number;
  planMissing: number;
  totalMissing: number;
}

export interface MissingPhotoPlanItem {
  totalPhotoMissing: number;
  totalPlanMissing: number;
  totalGapFields: number;
  zones: MissingPhotoPlanZone[];
}

export interface MissingPhotoPlanResponse {
  success?: boolean;
  message?: string;
  items: MissingPhotoPlanItem[];
  errors?: unknown | null;
  correlationId?: string | null;
}
