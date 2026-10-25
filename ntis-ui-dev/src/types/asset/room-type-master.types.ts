/**
 * Room Type Master Types
 */

export interface RoomTypeMasterItem {
  id: number;
  roomTypeCode: string;
  roomTypeName: string;
  description?: string;
  assetTypeId?: number;
  isActive: boolean;
}

export type RoomTypeMasterPayload = Omit<RoomTypeMasterItem, 'id'>;

export interface RoomTypeMasterListParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  RoomTypeCode?: string;
  RoomTypeName?: string;
}

export interface RoomTypeMasterListResponse {
  items: RoomTypeMasterItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
