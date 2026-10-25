export interface CreateAssetRoomWiseMinusDataDto {
  roomWiseSubmissionId?: number | null;
  lengthMtr?: number | null;
  widthMtr?: number | null;
  areaSqMtr?: number | null;
  heightMtr?: number | null;
  base1Mtr?: number | null;
  base2Mtr?: number | null;
  shape?: string | null;
  isActive?: boolean | null;
}

export interface AssetRoomWiseMinusDataDto {
  id: number;
  roomWiseSubmissionId?: number | null;
  lengthMtr?: number | null;
  widthMtr?: number | null;
  areaSqMtr?: number | null;
  heightMtr?: number | null;
  base1Mtr?: number | null;
  base2Mtr?: number | null;
  shape?: string | null;
  markedForDeletion: boolean;
  markedForDeletionDate?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
