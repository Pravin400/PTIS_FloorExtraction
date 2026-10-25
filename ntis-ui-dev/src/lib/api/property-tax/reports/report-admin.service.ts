import 'server-only';
import { apiClient } from '@/services/api.service';
import type {
  ReportTenant,
  CreateReportTenantPayload,
  UpdateReportTenantPayload,
  AdminReportModule,
  CreateReportModulePayload,
  UpdateReportModulePayload,
  ReportCatalogItem,
  CreateReportDefinitionPayload,
  UpdateReportDefinitionPayload,
} from '@/types/report-admin.types';

// ─── Tenants API ────────────────────────────────────────────────────────────

export async function getReportTenants(): Promise<ReportTenant[]> {
  try {
    const result = await apiClient.get<ReportTenant[]>('/ReportTenants');
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  } catch (err) {
    console.error('Failed to get report tenants:', err);
    return [];
  }
}

export async function createReportTenant(payload: CreateReportTenantPayload): Promise<ReportTenant | null> {
  const result = await apiClient.post<ReportTenant>('/ReportTenants', payload);
  if (result.success && result.data) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to create tenant');
}

export async function updateReportTenant(organizationId: number, payload: UpdateReportTenantPayload): Promise<ReportTenant | null> {
  const result = await apiClient.put<ReportTenant>(`/ReportTenants/${organizationId}`, payload);
  if (result.success && result.data) {
    return result.data;
  }
  throw new Error(result.error || 'Failed to update tenant');
}

export async function deleteReportTenant(organizationId: number): Promise<void> {
  const result = await apiClient.delete(`/ReportTenants/${organizationId}`);
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete tenant');
  }
}

// ─── Modules API ────────────────────────────────────────────────────────────

export async function getAdminReportModules(): Promise<AdminReportModule[]> {
  try {
    const result = await apiClient.get<{ items: Record<string, unknown>[] }>('/ReportModules?PageSize=-1');
    if (result.success && result.data && Array.isArray(result.data.items)) {
      return result.data.items.map((m) => ({
        id: Number(m.id),
        name: String(m.name),
        logoFileName: m.logoFileName ? String(m.logoFileName) : null,
        logoContentType: m.logoContentType ? String(m.logoContentType) : null,
        logoBase64: m.logoBase64 ? String(m.logoBase64) : null,
      }));
    }
    return [];
  } catch (err) {
    console.error('Failed to get report modules:', err);
    return [];
  }
}

export async function createReportModule(payload: CreateReportModulePayload): Promise<void> {
  const result = await apiClient.post('/ReportModules', payload);
  if (!result.success) {
    throw new Error(result.error || 'Failed to create module');
  }
}

export async function updateReportModule(id: number, payload: UpdateReportModulePayload): Promise<void> {
  const result = await apiClient.put(`/ReportModules/${id}`, payload);
  if (!result.success) {
    throw new Error(result.error || 'Failed to update module');
  }
}

export async function deleteReportModule(id: number): Promise<void> {
  const result = await apiClient.delete(`/ReportModules/${id}`);
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete module');
  }
}

// ─── Reports Catalog API ────────────────────────────────────────────────────

export async function getAdminReportCatalog(): Promise<ReportCatalogItem[]> {
  try {
    const result = await apiClient.get<ReportCatalogItem[]>('/Report/admin/catalog');
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  } catch (err) {
    console.error('Failed to get report catalog:', err);
    return [];
  }
}

export async function createReportDefinition(payload: CreateReportDefinitionPayload): Promise<void> {
  const result = await apiClient.post('/Report', payload);
  if (!result.success) {
    throw new Error(result.error || 'Failed to create report definition');
  }
}

export async function updateReportDefinition(id: number, payload: UpdateReportDefinitionPayload): Promise<void> {
  const result = await apiClient.put(`/Report/${id}`, payload);
  if (!result.success) {
    throw new Error(result.error || 'Failed to update report definition');
  }
}

export async function deleteReportDefinition(id: number): Promise<void> {
  const result = await apiClient.delete(`/Report/${id}`);
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete report definition');
  }
}
