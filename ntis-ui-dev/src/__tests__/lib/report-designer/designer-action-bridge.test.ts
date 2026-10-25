// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportServiceResult } from '@/lib/api/property-tax/reports/report-service-result';

const { load, save } = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn() }));
vi.mock('@/app/[locale]/property-tax/reports/designer/actions', () => ({
  loadDesignerReportAction: load, saveDesignerReportAction: save,
}));
import { actionResponse, reportDesignerApi } from '@/lib/utils/reports/designer/designer-api';
import { createBlankClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';

describe('classic designer server action bridge', () => {
  beforeEach(() => vi.resetAllMocks());

  it('passes the selected template ID and preserves service errors', async () => {
    load.mockResolvedValue({ status: 404, data: { error: 'Layout missing' } });
    const response = await reportDesignerApi.loadDesign('NEW_REPORT', '91');
    expect(load).toHaveBeenCalledWith('NEW_REPORT', '91');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Layout missing' });
  });

  it('sends the definition and draft/publish flag directly to the save action', async () => {
    const definition = createBlankClassicReportDefinition('NEW_REPORT', 'New report');
    save.mockResolvedValue({ status: 200, data: { success: true } });
    await reportDesignerApi.saveDesign('NEW_REPORT', definition, false);
    expect(save).toHaveBeenCalledWith('NEW_REPORT', definition, false);
  });

  it('rejects aborted waits and ignores late action responses', async () => {
    const controller = new AbortController();
    let finish!: (result: ReportServiceResult) => void;
    const operation = () => new Promise<ReportServiceResult>((resolve) => { finish = resolve; });
    const response = actionResponse(operation, controller.signal);
    await Promise.resolve();
    controller.abort();
    await expect(response).rejects.toMatchObject({ name: 'AbortError' });
    finish({ status: 200, data: { success: true } });
  });

  it('does not start an action when its signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(reportDesignerApi.loadDesign('NEW_REPORT', '91', { signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(load).not.toHaveBeenCalled();
  });
});
