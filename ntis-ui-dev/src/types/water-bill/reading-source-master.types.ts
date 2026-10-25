export interface ReadingSource extends Record<string, unknown> {
  id: number;
  readingSourceCode: string;
  code?: string;
  readingSource: string;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface ReadingSourceFormModel {
  id?: number;
  readingSourceCode?: string;
  code: string;
  readingSource: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface ReadingSourceProps {
  data: ReadingSource[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: string;
}
