export interface ReportTenant {
  organizationId: number;
  name: string;
  isActive: boolean;
  reportsCount: number;
  createdDate: string;
  updatedDate?: string | null;
}

export interface CreateReportTenantPayload {
  organizationId: number;
  name: string;
  isActive: boolean;
}

export interface UpdateReportTenantPayload {
  name: string;
  isActive: boolean;
}

export interface AdminReportModule {
  id: number;
  name: string;
  logoFileName?: string | null;
  logoContentType?: string | null;
  logoBase64?: string | null;
}

export interface CreateReportModulePayload {
  name: string;
  logoFileName?: string;
  logoContentType?: string;
  logoContent?: string; // base64
}

export interface UpdateReportModulePayload {
  name: string;
  logoFileName?: string;
  logoContentType?: string;
  logoContent?: string; // base64
}

export interface ReportCatalogItem {
  id: number;
  reportCode: string;
  reportName: string;
  tenantId: number | null;
  tenantName: string;
  moduleId: number | null;
  moduleName: string;
  dataProviderCode: string;
  templateFile: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  htmlTemplateId?: number | null;
  templateStatus: string;
  publishedVersionId?: number | null;
  draftVersionId?: number | null;
}

export interface CreateReportDefinitionPayload {
  reportCode: string;
  reportName: string;
  tenantId?: number | null;
  moduleId?: number | null;
  description?: string;
  templateFile?: string;
  dataProviderCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateReportDefinitionPayload {
  reportCode: string;
  reportName: string;
  tenantId?: number | null;
  moduleId?: number | null;
  description?: string;
  templateFile?: string;
  dataProviderCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}
