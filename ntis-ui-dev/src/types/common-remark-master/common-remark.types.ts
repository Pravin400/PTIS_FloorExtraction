/**
 * Model representing a Common Remark record
 */
export interface CommonRemark {
  [key: string]: unknown;
  id: number;
  remarkTypeId: number;
  remarkType: string;
  remark: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * Form model for creating or editing a Common Remark
 */
export interface CommonRemarkFormModel {
  id?: number;
  remarkTypeId?: number;
  remarkType: string;
  customRemarkType?: string;
  remark: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface RemarkCategory {
  id: number;
  categoryCode: string;
  categoryName: string;
}

/**
 * Props for the Common Remark Master page component
 */
export interface CommonRemarkProps {
  data: CommonRemark[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  search?: string;
  filterType?: string;
  sortBy?: string;
  sortOrder?: string;
  categories: RemarkCategory[];
}
