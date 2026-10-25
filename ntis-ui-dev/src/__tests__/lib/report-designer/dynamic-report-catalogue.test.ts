// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, cookieGet, resolveSchema } = vi.hoisted(() => ({
  get: vi.fn(), post: vi.fn(), cookieGet: vi.fn(), resolveSchema: vi.fn(),
}));
vi.mock('@/services/api.service', () => ({ apiClient: { get, post } }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: cookieGet }) }));
vi.mock('@/lib/utils/reports/designer/provider-schema.server', () => ({ resolveProviderSchema: resolveSchema }));

vi.mock('@/lib/api/property-tax/reports/report-import.service', () => ({ getDesignerImportOptionsServer: vi.fn() }));

import { listDesignerReportsAction as catalogue, loadDesignerReportAction as design, loadDesignerColumnsAction as columns, saveDesignerReportAction } from '@/app/[locale]/property-tax/reports/designer/actions';
import { createBlankClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';

describe('dynamic report catalogue', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    cookieGet.mockReturnValue({ value: 'test-session' });
  });

  it('requires a session before calling backend services', async () => {
    cookieGet.mockReturnValue(undefined);
    expect((await catalogue()).status).toBe(401);
    expect(get).not.toHaveBeenCalled();
  });

  it.each([false, true])('preserves the publish flag through the save action (%s)', async (publish) => {
    get.mockResolvedValueOnce({ success: true, data: [{ id: 91, reportCode: 'NEW_REPORT' }] })
      .mockResolvedValueOnce({ success: true, data: { id: 91, reportCode: 'NEW_REPORT', versions: [] } });
    post.mockResolvedValue({ success: true, data: { versionId: 102, versionNo: 2, status: 'Draft' } });
    const definition = createBlankClassicReportDefinition('NEW_REPORT', 'New report');
    const response = await saveDesignerReportAction('NEW_REPORT', definition, publish);
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({ success: true, status: publish ? 'Published' : 'Draft' });
    expect(post.mock.calls.map(([endpoint]) => endpoint)).toEqual(publish
      ? ['/designer-report-templates/91/drafts', '/designer-report-templates/91/versions/102/publish']
      : ['/designer-report-templates/91/drafts']);
  });

  it('lists a newly added backend report with its actual provider and permission', async () => {
    get.mockResolvedValue({ success: true, data: [{
      id: 91, reportCode: 'NEW_REPORT', reportName: 'New report',
      moduleCode: 'Property Tax', tenantId: 1, isActive: true,
      dataSourceCode: 'SOURCE_A', dataProviderCode: 'ProviderB', canDelete: false,
    }, { id: 92, isActive: false }] });

    const response = await catalogue();

    expect(response.data).toEqual({ reports: [{
      id: 'NEW_REPORT', reportCode: 'NEW_REPORT', name: 'New report',
      category: 'Property Tax', dataSourceCode: 'SOURCE_A', dataProviderCode: 'ProviderB',
      tenantScoped: true, templateId: 91, canDelete: false,
    }] });
  });

  it('reports upstream failures instead of pretending the catalogue is empty', async () => {
    get.mockResolvedValue({ success: false, statusCode: 503, error: 'Unavailable' });
    const response = await catalogue();
    expect(response.status).toBe(503);
    expect(response.data).toMatchObject({ error: 'Unavailable' });
  });

  it('does not open a similarly named report or an arbitrary Notice 119', async () => {
    get.mockResolvedValue({ success: true, data: [
      { id: 91, reportCode: 'NOTICE_119_OTHER', reportName: 'Notice 119' },
    ] });
    const response = await design('NOTICE_119');
    expect(response.status).toBe(404);
    expect(get).toHaveBeenCalledTimes(1);
    expect(response.data).not.toHaveProperty('elements');
  });

  it('rejects malformed successful catalogue responses instead of returning HTTP 200', async () => {
    get.mockResolvedValue({ success: true, statusCode: 200, data: {} });
    expect((await catalogue()).status).toBe(502);
  });

  it('loads the selected template ID and preserves its page settings', async () => {
    get.mockResolvedValueOnce({ success: true, data: [
      { id: 91, reportCode: 'NEW_REPORT' }, { id: 92, reportCode: 'OTHER_REPORT' },
    ] }).mockResolvedValueOnce({ success: true, data: {
      id: 91, reportCode: 'NEW_REPORT', reportName: 'New report', tenantId: 1,
      dataProviderCode: 'ProviderB', dataSourceCode: 'SOURCE_A', parameters: [],
      versions: [{ id: 100, versionNo: 1, status: 'Draft', templateJson: JSON.stringify({
        schemaVersion: 3, page: { size: 'A3', orientation: 'landscape', widthMm: 420, heightMm: 297 },
        elements: [], bands: [],
      }) }],
    } });
    const response = await design('NEW_REPORT', '91');
    expect(response.status).toBe(200);
    expect(get).toHaveBeenLastCalledWith('/designer-report-templates/91/current');
    expect(response.data).toMatchObject({ paperSize: 'A3', orientation: 'landscape' });
  });

  it('returns an error instead of a blank design when the backend fails', async () => {
    get.mockResolvedValue({ success: false, error: 'Unavailable' });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await design('NEW_REPORT');
    expect(response.status).toBe(502);
    expect(response.data).not.toHaveProperty('elements');
    log.mockRestore();
  });

  it('uses a numeric template ID to resolve schema settings without a report-specific fallback', async () => {
    get.mockResolvedValue({ success: true, data: { dataProviderCode: 'ProviderB' } });
    resolveSchema.mockResolvedValue({ fields: [{ name: 'amount' }], dataProviderCode: 'ProviderB', dataSourceCode: 'SOURCE_A' });
    const response = await columns({ reportId: 'NEW_REPORT', templateId: '91' });
    expect(get).toHaveBeenCalledWith('/designer-report-templates/91/settings');
    expect(resolveSchema).toHaveBeenCalledWith('ProviderB', '');
    expect(response.data).toMatchObject({ dataProviderCode: 'ProviderB', matched: true });
  });
});
