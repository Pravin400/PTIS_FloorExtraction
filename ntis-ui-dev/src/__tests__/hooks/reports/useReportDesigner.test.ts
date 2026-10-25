import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useReportDesigner } from '@/hooks/reports/useReportDesigner';
import { createBlankClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';
import {
  listDesignerReports,
  loadDesignerReport,
  saveDesignerReport,
} from '@/lib/utils/reports/designer/designer-api';
import type { ReportDesignerCopy } from '@/types/report-designer-copy.types';

vi.mock('@/lib/utils/reports/designer/designer-api', () => ({
  listDesignerReports: vi.fn(),
  loadDesignerReport: vi.fn(),
  saveDesignerReport: vi.fn(),
  updateDesignerReportSettings: vi.fn(),
}));
vi.mock('@/lib/utils/reports/designer/preview-report', () => ({ openReportPreview: vi.fn() }));

const messages: ReportDesignerCopy['messages'] = {
  reportsLoadFailed: 'Reports failed',
  designLoadFailed: 'Design failed',
  saveFailed: 'Save failed',
  reportPublished: 'Published',
  draftSaved: 'Saved',
  settingsSaved: 'Settings saved',
  settingsSaveFailed: 'Settings failed',
  importSaved: 'Imported',
  importSaveFailed: 'Import failed',
};

describe('useReportDesigner composed hooks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(listDesignerReports).mockResolvedValue([
      {
        id: 'REPORT_A',
        reportCode: 'REPORT_A',
        name: 'Report A',
        category: 'Property Tax',
        dataProviderCode: 'UnassignedReportDataProvider',
        tenantScoped: true,
        templateId: null,
        canDelete: true,
      },
    ]);
    vi.mocked(loadDesignerReport).mockImplementation(async (code) =>
      createBlankClassicReportDefinition(code, code)
    );
  });

  it('shares editing and selection state with undo, redo and publishing', async () => {
    const { result } = renderHook(() => useReportDesigner(messages));
    await waitFor(() => expect(result.current.activity).toBe('idle'));
    expect(result.current.activeReportId).toBe('REPORT_A');

    act(() => result.current.addElement('text'));
    const elementId = result.current.selectedElementId;
    expect(result.current.selectedElement?.id).toBe(elementId);
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.updateSelectedElement({ text: 'Updated title' }));
    expect(result.current.selectedElement?.text).toBe('Updated title');

    act(() => result.current.undo());
    expect(result.current.selectedElement?.text).not.toBe('Updated title');
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.redo());
    expect(result.current.selectedElement?.text).toBe('Updated title');

    vi.mocked(saveDesignerReport).mockResolvedValue({
      success: true,
      layoutVersion: 2,
      templateId: 7,
      versionId: 9,
      status: 'Published',
    });
    const edited = result.current.definition;
    await act(async () => {
      expect(await result.current.save(true)).toBe(true);
    });
    expect(saveDesignerReport).toHaveBeenCalledWith('REPORT_A', edited, true);
    expect(result.current.definition?.ntis).toMatchObject({ templateId: 7, status: 'Published' });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.message).toBe(messages.reportPublished);
  });

  it('clears editing history and selection when switching and reloading reports', async () => {
    const { result } = renderHook(() => useReportDesigner(messages));
    await waitFor(() => expect(result.current.activity).toBe('idle'));
    act(() => result.current.addElement('table'));
    expect(result.current.selectedCellKeys).toEqual(['0_0']);
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.selectReport('REPORT_B'));
    await waitFor(() => expect(result.current.definition?.reportCode).toBe('REPORT_B'));
    expect(result.current.selectedElementId).toBeNull();
    expect(result.current.selectedCellKeys).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.isDirty).toBe(false);

    act(() => result.current.addElement('text'));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.activity).toBe('idle'));
    expect(result.current.definition?.elements).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.selectedElementId).toBeNull();
  });
});
