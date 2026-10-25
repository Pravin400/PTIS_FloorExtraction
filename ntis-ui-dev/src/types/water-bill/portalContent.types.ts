export type PortalContentType = "LATEST_UPDATE" | "ANNOUNCEMENT" | "IMPORTANT_LINK";

export interface PortalContentItem {
  departmentId: number;
  contentType: PortalContentType;
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
  publishFromDate: string | null;
  publishToDate: string | null;
  createdBy: number;
  updatedBy: number | null;
  id: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface PortalContentPagedResponse {
  items: PortalContentItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PortalContentQueryParameters {
  departmentId?: number;
  contentType?: PortalContentType;
  pageNumber?: number;
  pageSize?: number;
}

export interface PortalContentGrouped {
  updates: PortalContentItem[];
  announcements: PortalContentItem[];
  importantLinks: PortalContentItem[];
}
