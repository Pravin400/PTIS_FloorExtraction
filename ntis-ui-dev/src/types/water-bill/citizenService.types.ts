export interface CitizenServiceItem {
  departmentId: number;
  iconName: string | null;
  badge: string | null;
  title: string;
  description: string | null;
  titleLocal: string | null;
  descriptionLocal: string | null;
  referenceLink: string | null;
  category: string | null;
  displayOrder: number;
  openInNewTab: boolean;
  createdBy: number;
  updatedBy: number | null;
  id: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface CitizenServicePagedResponse {
  items: CitizenServiceItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface CitizenServiceQueryParameters {
  departmentId?: number;
  pageNumber?: number;
  pageSize?: number;
}
