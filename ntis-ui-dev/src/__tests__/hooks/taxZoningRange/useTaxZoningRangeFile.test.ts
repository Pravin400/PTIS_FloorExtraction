import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaxZoningRangeFile } from '@/hooks/taxZoningRange/useTaxZoningRangeFile';
import type { Ward, TaxZone, TaxZoningRange } from '@/types/taxZoningRange.types';
import * as XLSX from 'xlsx';

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));
vi.mock('xlsx', () => ({ read: vi.fn(), utils: { sheet_to_json: vi.fn() } }));

const t = (key: string, values?: Record<string, string | number>) =>
  values ? `${key}${JSON.stringify(values)}` : key;

const mockWards: Ward[] = [
  { id: 89, wardNo: 'MM11', zoneNo: '1', description: null, descriptionEnglish: null, sequenceNo: null, isActive: true, createdBy: null, createdDate: '', updatedBy: null, updatedDate: null },
  { id: 90, wardNo: 'MM12', zoneNo: '1', description: null, descriptionEnglish: null, sequenceNo: null, isActive: true, createdBy: null, createdDate: '', updatedBy: null, updatedDate: null },
];

const mockTaxZones: TaxZone[] = [
  { id: 1, taxZoneNo: '1', taxZoneType: 'R', remark: null, createdDate: '', updatedDate: null, isActive: true },
  { id: 2, taxZoneNo: '2', taxZoneType: 'C', remark: null, createdDate: '', updatedDate: null, isActive: true },
];

const mockExistingRanges: TaxZoningRange[] = [];

const validDesc = 'This is a valid zone description';

function makeXlsxFile(name = 'test.xlsx') {
  return new File(['dummy binary content'], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function setSheetRows(rawRows: unknown[][]) {
  (XLSX.read as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    SheetNames: ['Sheet1'],
    Sheets: { Sheet1: {} },
  });
  (XLSX.utils.sheet_to_json as unknown as ReturnType<typeof vi.fn>).mockReturnValue(rawRows);
}

async function importFile(result: { current: ReturnType<typeof useTaxZoningRangeFile> }, file = makeXlsxFile()) {
  const event = { target: { files: [file], value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>;
  await act(async () => {
    result.current.handleImportFile(event);
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
}

describe('useTaxZoningRangeFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useTaxZoningRangeFile(t, mockWards, mockTaxZones, mockExistingRanges));
    expect(result.current.rows).toEqual([]);
    expect(result.current.fileName).toBeNull();
    expect(result.current.importing).toBe(false);
    expect(result.current.hasValidRows).toBe(false);
    expect(result.current.hasInvalidRows).toBe(false);
  });

  describe('handleDownloadTemplate', () => {
    it('should create an anchor pointing at the bulk-template endpoint and click it', () => {
      const clickSpy = vi.fn();
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      const realCreateElement = document.createElement.bind(document);
      const anchorSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = realCreateElement(tag);
        if (tag === 'a') {
          el.click = clickSpy;
        }
        return el;
      });

      const { result } = renderHook(() => useTaxZoningRangeFile(t, mockWards, mockTaxZones, mockExistingRanges));
      act(() => {
        result.current.handleDownloadTemplate();
      });

      expect(anchorSpy).toHaveBeenCalledWith('a');
      expect(clickSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      anchorSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('handleImportFile', () => {
    it('should reject a non csv/xlsx/xls file and reset the input value', async () => {
      const { result } = renderHook(() => useTaxZoningRangeFile(t, mockWards, mockTaxZones, mockExistingRanges));
      const file = new File(['bad'], 'test.txt', { type: 'text/plain' });
      const event = { target: { files: [file], value: 'test.txt' } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleImportFile(event);
      });

      expect(mockToast.error).toHaveBeenCalledWith('messages.invalidFileType');
      expect(event.target.value).toBe('');
      expect(result.current.rows).toEqual([]);
    });

    it('should do nothing when no file is selected', () => {
      const { result } = renderHook(() => useTaxZoningRangeFile(t, mockWards, mockTaxZones, mockExistingRanges));
      const event = { target: { files: [] } } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleImportFile(event);
      });

      expect(mockToast.error).not.toHaveBeenCalled();
      expect(mockToast.warning).not.toHaveBeenCalled();
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('should parse a valid file and mark rows accordingly, including an invalid row', async () => {
      setSheetRows([
        ['Ward No.', 'Property From', 'Property To', 'Tax Zone', 'Zone Description'],
        ['MM11', '1', '10', '1', validDesc],
        ['BADWARD', 'abc', '5', '9', 'short'],
      ]);

      const { result } = renderHook(() => useTaxZoningRangeFile(t, mockWards, mockTaxZones, mockExistingRanges));
      await importFile(result);

      expect(result.current.fileName).toBe('test.xlsx');
      expect(result.current.rows).toHaveLength(2);

      const [validRow, invalidRow] = result.current.rows;
      expect(validRow.status).toBe('New');
      expect(validRow.wardId).toBe(89);
      expect(validRow.taxZoneId).toBe(1);
      expect(validRow.errors).toBeUndefined();

      expect(invalidRow.status).toBe('Invalid');
      expect(invalidRow.wardId).toBeUndefined();
      expect(invalidRow.errors).toBeDefined();
      expect(invalidRow.errors).toEqual(
        expect.arrayContaining([
          'messages.wardNotFound',
          'messages.taxZoneNotFound',
          'messages.propertyFromMustBeNumber',
          'messages.descriptionTooShort',
        ])
      );

      expect(mockToast.warning).toHaveBeenCalledWith(
        `1 messages.rowsValid, 1 messages.rowsInvalid`
      );
      expect(result.current.hasValidRows).toBe(true);
      expect(result.current.hasInvalidRows).toBe(true);
    });

    it('should show a warning and clear the file name when the sheet has no data rows', async () => {
      setSheetRows([['Ward No.', 'Property From', 'Property To', 'Tax Zone', 'Zone Description']]);

      const { result } = renderHook(() => useTaxZoningRangeFile(t, mockWards, mockTaxZones, mockExistingRanges));
      await importFile(result);

      expect(mockToast.warning).toHaveBeenCalledWith('messages.fileHasNoData');
      expect(result.current.fileName).toBeNull();
      expect(result.current.rows).toEqual([]);
    });

    it('should detect overlapping ranges within the same ward and mark both rows invalid', async () => {
      setSheetRows([
        ['Ward No.', 'Property From', 'Property To', 'Tax Zone', 'Zone Description'],
        ['MM11', '1', '10', '1', validDesc],
        ['MM11', '5', '15', '2', validDesc],
      ]);

      const { result } = renderHook(() => useTaxZoningRangeFile(t, mockWards, mockTaxZones, mockExistingRanges));
      await importFile(result);

      expect(result.current.rows).toHaveLength(2);
      const [rowA, rowB] = result.current.rows;
      expect(rowA.status).toBe('Invalid');
      expect(rowB.status).toBe('Invalid');
      expect(rowA.errors).toEqual(
        expect.arrayContaining([`messages.overlapsWithRow${JSON.stringify({ row: 3, from: '5', to: '15' })}`])
      );
      expect(rowB.errors).toEqual(
        expect.arrayContaining([`messages.overlapsWithRow${JSON.stringify({ row: 2, from: '1', to: '10' })}`])
      );
      expect(mockToast.warning).toHaveBeenCalledWith('0 messages.rowsValid, 2 messages.rowsInvalid');
    });

    it('should show a success toast when all rows are valid', async () => {
      setSheetRows([
        ['Ward No.', 'Property From', 'Property To', 'Tax Zone', 'Zone Description'],
        ['MM11', '1', '10', '1', validDesc],
        ['MM12', '1', '10', '2', validDesc],
      ]);

      const { result } = renderHook(() => useTaxZoningRangeFile(t, mockWards, mockTaxZones, mockExistingRanges));
      await importFile(result);

      expect(mockToast.success).toHaveBeenCalledWith('2 messages.rowsReadyToImport');
      expect(result.current.hasValidRows).toBe(true);
      expect(result.current.hasInvalidRows).toBe(false);
    });
  });

  describe('clearRows', () => {
    it('should reset rows and fileName', async () => {
      setSheetRows([
        ['Ward No.', 'Property From', 'Property To', 'Tax Zone', 'Zone Description'],
        ['MM11', '1', '10', '1', validDesc],
      ]);

      const { result } = renderHook(() => useTaxZoningRangeFile(t, mockWards, mockTaxZones, mockExistingRanges));
      await importFile(result);
      expect(result.current.rows).toHaveLength(1);

      act(() => {
        result.current.clearRows();
      });

      expect(result.current.rows).toEqual([]);
      expect(result.current.fileName).toBeNull();
    });
  });

  describe('toCreatePayloads', () => {
    it('should filter out invalid rows and rows missing ward/zone ids, mapping the rest to payloads', async () => {
      setSheetRows([
        ['Ward No.', 'Property From', 'Property To', 'Tax Zone', 'Zone Description'],
        ['MM11', '1', '10', '1', validDesc],
        ['BADWARD', 'abc', '5', '9', 'short'],
        ['MM12', '20', '30', '2', validDesc],
      ]);

      const { result } = renderHook(() => useTaxZoningRangeFile(t, mockWards, mockTaxZones, mockExistingRanges));
      await importFile(result);

      let payloads: ReturnType<typeof result.current.toCreatePayloads> = [];
      act(() => {
        payloads = result.current.toCreatePayloads();
      });

      expect(payloads).toEqual([
        {
          wardIds: [89],
          taxZoneId: 1,
          assignEntireWard: false,
          fromPropertyNo: '1',
          toPropertyNo: '10',
          zoneDescription: validDesc,
        },
        {
          wardIds: [90],
          taxZoneId: 2,
          assignEntireWard: false,
          fromPropertyNo: '20',
          toPropertyNo: '30',
          zoneDescription: validDesc,
        },
      ]);
    });
  });
});
