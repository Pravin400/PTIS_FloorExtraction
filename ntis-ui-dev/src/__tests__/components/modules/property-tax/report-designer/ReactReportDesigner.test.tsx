import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  createBlankClassicReportDefinition,
  type ClassicReportDefinition,
} from '@/lib/utils/reports/designer/classic-adapter';
import { newElement } from '@/lib/utils/reports/designer/editor-model';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  load: vi.fn(),
  save: vi.fn(),
  columns: vi.fn(),
  remove: vi.fn(),
  push: vi.fn(),
  importOptions: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: api.push }) }));
vi.mock('@/lib/utils/reports/designer/designer-api', () => ({
  listDesignerReports: api.list,
  loadDesignerReport: api.load,
  saveDesignerReport: api.save,
  reportDesignerApi: {
    loadColumns: api.columns,
    deleteReport: api.remove,
    importOptions: api.importOptions,
  },
}));
vi.mock('@/lib/utils/reports/import/client/pdf-layout-client', () => ({ extractPdfLayout: vi.fn() }));
import { ClassicReportDesigner } from '@/components/modules/property-tax/report-designer/ClassicReportDesigner';
import { useReportEditor } from '@/hooks/reports/designer/useReportEditor';
import { ReportImportDialog } from '@/components/modules/property-tax/report-designer/dialogs/ReportImportDialog';

let definition: ClassicReportDefinition;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('PointerEvent', MouseEvent);
  definition = createBlankClassicReportDefinition('THANE_SPECIAL_NOTICE', 'Thane Special Notice');
  definition.ntis = {
    ...definition.ntis!,
    templateId: 12,
    dataProviderCode: 'SpecialNoticeThaneDataProvider',
  };
  definition.elements = [newElement('field', definition.sections[0].id, 10, 20, 'oldWardNo')];
  api.list.mockResolvedValue([
    {
      id: definition.reportId,
      name: definition.reportName,
      reportCode: definition.reportCode,
      templateId: 12,
      canDelete: true,
    },
  ]);
  api.load.mockImplementation(async () => structuredClone(definition));
  api.columns.mockResolvedValue(
    Response.json({
      columns: [
        { name: 'upicId', label: 'UPIC ID', type: 'string', elementType: 'field' },
        { name: 'ulbLogo', label: 'ULB Logo', type: 'image', elementType: 'image' },
        { name: 'oldWardNo', label: 'जुना प्रभाग क्र.', type: 'string', elementType: 'field' },
      ],
    })
  );
  api.save.mockResolvedValue({ success: true, layoutVersion: 3 });
  api.remove.mockResolvedValue(Response.json({ success: true }));
  api.importOptions.mockResolvedValue(
    Response.json({
      options: {
        currentTenantId: 7,
        modules: [{ id: 3, name: 'Property Tax' }],
        dataProviderCodes: ['SpecialNoticeThaneDataProvider'],
      },
      dataSources: [],
    })
  );
});
afterEach(() => cleanup());

describe('React designer interactions', () => {
  it('renders the prefetched layout in server HTML before any client requests', () => {
    const html = renderToString(
      <ClassicReportDesigner locale="en" defaultReportId={definition.reportId} initialDefinition={definition} />
    );
    expect(html).toContain(`data-element-id="${definition.elements[0].id}"`);
    expect(html).toContain('{oldWardNo}');
    expect(api.load).not.toHaveBeenCalled();
    expect(api.list).not.toHaveBeenCalled();
  });

  it('hydrates the prefetched layout without fetching it again and still loads its field schema', async () => {
    const { container } = render(
      <ClassicReportDesigner locale="en" defaultReportId={definition.reportId} initialDefinition={definition} />
    );
    expect(container.querySelector('[data-element-id]')).toHaveTextContent('{oldWardNo}');
    await screen.findByText('UPIC ID');
    expect(api.load).not.toHaveBeenCalled();
    expect(api.columns).toHaveBeenCalledWith(
      expect.objectContaining({ reportId: definition.reportCode, templateId: '12' }),
      expect.anything(),
    );
  });

  it('still fetches explicitly selected reports after hydrating the initial definition', async () => {
    api.columns.mockImplementation(async () => Response.json({ columns: [] }));
    const { result } = renderHook(() => useReportEditor(definition.reportId, definition));
    await waitFor(() => expect(api.columns).toHaveBeenCalledTimes(1));
    const other = createBlankClassicReportDefinition('OTHER_REPORT', 'Other Report');
    api.load.mockResolvedValue(other);
    await act(async () => { await result.current.load('OTHER_REPORT'); });
    expect(result.current.state.definition.reportCode).toBe('OTHER_REPORT');
    expect(api.load).toHaveBeenCalledTimes(1);
  });

  it('keeps the prefetched layout available when the field schema request fails', async () => {
    api.columns.mockResolvedValue(Response.json({ error: 'Schema unavailable' }, { status: 502 }));
    const { result } = renderHook(() => useReportEditor(definition.reportId, definition));
    await waitFor(() => expect(result.current.message).toContain('data-field schema'));
    expect(result.current.state.definition.reportCode).toBe(definition.reportCode);
    expect(result.current.busy).toBe(false);
    expect(api.load).not.toHaveBeenCalled();
  });

  it('ignores late initial schema results after switching reports', async () => {
    let finish!: (response: Response) => void;
    api.columns.mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; }));
    api.columns.mockImplementation(async () => Response.json({ columns: [{ name: 'otherField', label: 'Other Field' }] }));
    const { result } = renderHook(() => useReportEditor(definition.reportId, definition));
    await waitFor(() => expect(api.columns).toHaveBeenCalledTimes(1));
    const initialSignal = api.columns.mock.calls[0][1].signal as AbortSignal;
    api.load.mockResolvedValue(createBlankClassicReportDefinition('OTHER_REPORT', 'Other Report'));
    await act(async () => { await result.current.load('OTHER_REPORT'); });
    expect(initialSignal.aborted).toBe(true);
    await act(async () => { finish(Response.json({ columns: [{ name: 'staleField' }] })); });
    expect(result.current.fields.map((field) => field.name)).toEqual(['otherField']);
  });

  it('shows the current saved Karakarni report only once and keeps other reports selectable', async () => {
    definition.reportId = 'KarakarniReport';
    definition.reportCode = 'KarakarniReport';
    definition.reportName = 'Karakarni';
    api.list.mockResolvedValue([
      { id: 'KarakarniReport', name: 'Karakarni', reportCode: 'KarakarniReport', templateId: 12 },
      { id: 'THANE_KARAKARNI', name: 'Thane Karakarni', reportCode: 'THANE_KARAKARNI', templateId: 13 },
    ]);
    render(<ClassicReportDesigner locale="en" defaultReportId="KarakarniReport" />);
    await screen.findByText('UPIC ID');
    const selector = screen.getByRole('combobox', { name: 'Report' });
    expect(within(selector).getAllByRole('option', { name: /^Karakarni$/ })).toHaveLength(1);
    expect(selector).toHaveValue('KarakarniReport');
    expect(within(selector).getByRole('option', { name: 'Thane Karakarni' })).toBeInTheDocument();
    fireEvent.change(selector, { target: { value: 'THANE_KARAKARNI' } });
    await waitFor(() => expect(api.load).toHaveBeenLastCalledWith('THANE_KARAKARNI', expect.any(AbortSignal)));
  });

  it('keeps the current unsaved report visible when it is absent from the saved catalogue', async () => {
    definition.reportId = 'NEW_DRAFT';
    definition.reportCode = 'NEW_DRAFT';
    definition.reportName = 'New draft';
    api.list.mockResolvedValue([]);
    render(<ClassicReportDesigner locale="en" defaultReportId="NEW_DRAFT" initialDefinition={definition} />);
    await screen.findByText('UPIC ID');
    const selector = screen.getByRole('combobox', { name: 'Report' });
    expect(within(selector).getAllByRole('option')).toHaveLength(1);
    expect(within(selector).getByRole('option')).toHaveTextContent('New draft');
    expect(selector).toHaveValue('');
  });

  it('loads a saved report without injecting scripts or static HTML', async () => {
    const { container } = render(
      <ClassicReportDesigner locale="en" defaultReportId="THANE_SPECIAL_NOTICE" />
    );
    await screen.findByText('UPIC ID');
    expect(screen.getByText('Old Ward No')).toBeInTheDocument();
    expect(screen.queryByText('जुना प्रभाग क्र.')).not.toBeInTheDocument();
    expect(container.querySelector('[data-element-id]')).toHaveTextContent('{oldWardNo}');
    expect(
      document.querySelector('script[data-classic-script],link[data-classic-style]')
    ).toBeNull();
    expect((window as unknown as Record<string, unknown>).initDesignerApp).toBeUndefined();
  });
  it('binds fields, preserves prior fields, and sends explicit draft/publish flags', async () => {
    render(<ClassicReportDesigner locale="en" defaultReportId="THANE_SPECIAL_NOTICE" />);
    fireEvent.click(await screen.findByText('UPIC ID'));
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(api.save).toHaveBeenCalled());
    const draft = api.save.mock.calls[0];
    expect(draft[0]).toBe('THANE_SPECIAL_NOTICE');
    expect(draft[2]).toBe(false);
    expect(draft[1].elements.map((e: { fieldName: string }) => e.fieldName)).toEqual([
      'oldWardNo',
      'upicId',
    ]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(api.save.mock.calls[1][2]).toBe(true));
  });
  it('edits selected text and restores its previous binding with undo', async () => {
    const { container } = render(
      <ClassicReportDesigner locale="en" defaultReportId="THANE_SPECIAL_NOTICE" />
    );
    await screen.findByText('UPIC ID');
    // jsdom has no pointer capture; the browser owns capture in production.
    HTMLElement.prototype.setPointerCapture = vi.fn();
    fireEvent.pointerDown(container.querySelector('[data-element-id]')!, {
      button: 0,
      pointerId: 1,
    });
    fireEvent.change(screen.getByLabelText('Field binding'), { target: { value: 'upicId' } });
    expect(screen.getByLabelText('Field binding')).toHaveValue('upicId');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(container.querySelector('[data-element-id]')).toHaveTextContent('{oldWardNo}');
  });
  it('removes beforeunload listeners and confines shortcuts to the mounted designer', async () => {
    const add = vi.spyOn(window, 'addEventListener'),
      remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <ClassicReportDesigner locale="en" defaultReportId="THANE_SPECIAL_NOTICE" />
    );
    fireEvent.click(await screen.findByText('UPIC ID'));
    const listener = add.mock.calls.find((call) => call[0] === 'beforeunload')?.[1];
    expect(listener).toBeDefined();
    unmount();
    expect(
      remove.mock.calls.some((call) => call[0] === 'beforeunload' && call[1] === listener)
    ).toBe(true);
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(api.save).not.toHaveBeenCalled();
    add.mockRestore();
    remove.mockRestore();
  });
  it('only deletes a report after an explicit confirmation', async () => {
    render(<ClassicReportDesigner locale="en" defaultReportId="THANE_SPECIAL_NOTICE" />);
    await screen.findByText('UPIC ID');
    fireEvent.click(screen.getByRole('button', { name: 'Delete report' }));
    expect(api.remove).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Delete report' })).getByRole('button', {
        name: 'Delete report',
      })
    );
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(12));
  });
});

describe('React designer asynchronous lifecycle', () => {
  it('ignores a report that completes loading after unmount and aborts its wait', async () => {
    let finish!: (d: ClassicReportDefinition) => void;
    api.load.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { unmount } = renderHook(() => useReportEditor('THANE_SPECIAL_NOTICE'));
    await waitFor(() => expect(api.load).toHaveBeenCalled());
    const signal = api.load.mock.calls[0][1] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => finish(definition));
    expect(api.columns).not.toHaveBeenCalled();
  });
  it('prevents repeated save clicks from issuing duplicate requests', async () => {
    let finish!: (v: { success: boolean }) => void;
    api.save.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { result } = renderHook(() => useReportEditor('THANE_SPECIAL_NOTICE'));
    await waitFor(() => expect(result.current.busy).toBe(false));
    let first!: Promise<boolean>;
    act(() => {
      first = result.current.save(false);
      void result.current.save(false);
    });
    expect(api.save).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish({ success: true });
      await first;
    });
    expect(result.current.message).toBe('Draft saved.');
  });
});

describe('React report creation', () => {
  it('creates a tenant draft with the selected data provider', async () => {
    const done = vi.fn();
    render(<ReportImportDialog importing={false} close={vi.fn()} done={done} />);
    await screen.findByRole('option', { name: 'SpecialNoticeThaneDataProvider' });
    fireEvent.change(screen.getByLabelText('Report title'), {
      target: { value: 'Special Notice' },
    });
    fireEvent.change(screen.getByLabelText('Report code'), {
      target: { value: 'SPECIAL_NOTICE_THANE' },
    });
    fireEvent.change(screen.getByLabelText('Data provider'), {
      target: { value: 'SpecialNoticeThaneDataProvider' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create draft' }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(api.save.mock.calls[0][1].ntis).toMatchObject({
      dataProviderCode: 'SpecialNoticeThaneDataProvider',
      tenantId: 7,
      tenantScope: 'CurrentTenant',
    });
    expect(api.save.mock.calls[0][2]).toBe(false);
  });
  it('shows upload errors without replacing the selected report', async () => {
    render(<ReportImportDialog importing close={vi.fn()} done={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Crystal report (.rpt), up to 25 MB'), {
      target: { files: [new File(['invalid'], 'notice.txt')] },
    });
    expect(screen.getByRole('status')).toHaveTextContent('Select a .rpt file');
    expect(api.save).not.toHaveBeenCalled();
  });
});
