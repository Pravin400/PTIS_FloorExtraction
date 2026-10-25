// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBlankClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';

const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/lib/utils/reports/designer/designer-api', () => ({ loadDesignerReport: load }));
vi.mock('@/components/modules/property-tax/report-designer/ClassicReportDesigner', () => ({
  ClassicReportDesigner: () => null,
}));
import ReportDesignerPage, { dynamic } from '@/app/[locale]/property-tax/reports/designer/page';

describe('report designer request-time prefetch', () => {
  beforeEach(() => vi.resetAllMocks());

  it('passes the requested definition to the client designer during server rendering', async () => {
    const definition = createBlankClassicReportDefinition('KarakarniReport', 'Karakarni');
    load.mockResolvedValue(definition);
    const page = await ReportDesignerPage({
      params: Promise.resolve({ locale: 'mr' }),
      searchParams: Promise.resolve({ reportId: 'KarakarniReport', import: '1' }),
    });
    expect(dynamic).toBe('force-dynamic');
    expect(load).toHaveBeenCalledWith('KarakarniReport');
    expect(page.props.children.props).toMatchObject({
      locale: 'mr', defaultReportId: 'KarakarniReport', initialDefinition: definition, openImporter: true,
    });
  });

  it('preserves client fallback when no report is requested', async () => {
    const page = await ReportDesignerPage({ params: Promise.resolve({ locale: 'en' }) });
    expect(load).not.toHaveBeenCalled();
    expect(page.props.children.props.initialDefinition).toBeNull();
  });

  it('falls back to client loading if request-time prefetch throws', async () => {
    load.mockRejectedValue(new Error('Report not found'));
    const page = await ReportDesignerPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ reportId: 'MISSING', newReport: '1' }),
    });
    expect(page.props.children.props.initialDefinition).toBeNull();
    expect(page.props.children.props.createNewReport).toBe(true);
  });
});
