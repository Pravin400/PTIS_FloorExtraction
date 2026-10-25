// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/services/api.service', () => ({ apiClient: { get } }));
import { getDesignerReportStatusServer } from '@/lib/api/property-tax/reports/report-jobs.service';

describe('report job status service', () => {
  beforeEach(() => vi.resetAllMocks());

  it('preserves status and partial completion progress for polling clients', async () => {
    const id = '12345678-1234-1234-1234-123456789abc';
    const status = { jobId: id, status: 'PartiallyCompleted', processedRecords: 3 };
    get.mockResolvedValue({ success: true, data: status });
    expect(await getDesignerReportStatusServer(id)).toEqual(status);
    expect(get).toHaveBeenCalledWith(`/designer-report-jobs/${id}`);
  });

  it('rejects an invalid ID before sending a backend request', async () => {
    await expect(getDesignerReportStatusServer('../other-tenant')).rejects.toMatchObject({ statusCode: 400 });
    expect(get).not.toHaveBeenCalled();
  });
});
