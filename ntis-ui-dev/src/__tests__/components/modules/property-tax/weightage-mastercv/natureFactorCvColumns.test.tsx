import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { getNatureFactorCvColumns } from '@/components/modules/property-tax/weightage-mastercv/natureFactorCv/natureFactorCvColumns';
import { NatureFactorCVMaster } from '@/types/natureofbuilding-cv-weightageMaster.types';

describe('getNatureFactorCvColumns', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'columns.constructionCode': 'Construction Code',
      'columns.description': 'Description',
      'columns.factor': 'Factor',
      'columns.assessmentYear': 'Assessment Year',
      'columns.status': 'Status',
    };
    return translations[key] || key;
  });

  const mockTW = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'common.labels.active': 'Active',
      'common.labels.inactive': 'Inactive',
    };
    return translations[key] || key;
  });

  const mockTCommon = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'table.sort.verb': 'Sort',
      'table.sort.ascending': 'ascending',
      'table.sort.descending': 'descending',
      'table.sort.by': 'Sort by',
    };
    return translations[key] || key;
  });

  const mockHandleCellChange = vi.fn();
  const mockGetRowUid = vi.fn((row: NatureFactorCVMaster) => `${row.id}-${row.constructionTypeId}`);

  const mockEditableRows: Record<string, NatureFactorCVMaster> = {};

  const mockRow: NatureFactorCVMaster = {
    id: 1,
    constructionTypeId: 101,
    constructionCode: 'C1',
    constructionDescription: 'RCC',
    factor: 1.2,
    yearRangeCVId: 2024,
    fromYear: 2024,
    toYear: 2025,
    isActive: true,
  };

  it('returns correct number of columns', () => {
    const columns = getNatureFactorCvColumns({
      t: mockT,
      tW: mockTW,
      tCommon: mockTCommon,
      editableRows: mockEditableRows,
      handleCellChange: mockHandleCellChange,
      getRowUid: mockGetRowUid,
    });

    expect(columns).toHaveLength(5);
  });

  it('constructionCode column renders correctly', () => {
    const columns = getNatureFactorCvColumns({
      t: mockT,
      tW: mockTW,
      tCommon: mockTCommon,
      editableRows: mockEditableRows,
      handleCellChange: mockHandleCellChange,
      getRowUid: mockGetRowUid,
    });

    const col = columns[0];
    expect(col.key).toBe('constructionCode');
    expect(col.label).toBeDefined();
    expect(col.render?.('C1', mockRow, 0)).toBe('C1');
  });

  it('constructionCode column renders "-" for undefined value', () => {
    const columns = getNatureFactorCvColumns({
      t: mockT,
      tW: mockTW,
      tCommon: mockTCommon,
      editableRows: mockEditableRows,
      handleCellChange: mockHandleCellChange,
      getRowUid: mockGetRowUid,
    });

    const col = columns[0];
    expect(col.render?.(undefined, mockRow, 0)).toBe('-');
  });

  it('description column renders correctly', () => {
    const columns = getNatureFactorCvColumns({
      t: mockT,
      tW: mockTW,
      tCommon: mockTCommon,
      editableRows: mockEditableRows,
      handleCellChange: mockHandleCellChange,
      getRowUid: mockGetRowUid,
    });

    const col = columns[1];
    expect(col.key).toBe('constructionDescription');
    expect(col.label).toBeDefined();
    expect(col.render?.('RCC', mockRow, 0)).toBe('RCC');
  });

  it('factor column renders MatrixCellInput', () => {
    const columns = getNatureFactorCvColumns({
      t: mockT,
      tW: mockTW,
      tCommon: mockTCommon,
      editableRows: mockEditableRows,
      handleCellChange: mockHandleCellChange,
      getRowUid: mockGetRowUid,
    });

    const col = columns[2];
    expect(col.key).toBe('factor');
    expect(col.label).toBe('Factor');

    const result = col.render?.(1.2, mockRow, 0);
    const { container } = render(<>{result}</>);
    
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveDisplayValue('1.20');
  });

  it('factor column uses editable value when available', () => {
    const editableRows = {
      '1-101': {
        ...mockRow,
        factor: 1.5,
      },
    };

    const columns = getNatureFactorCvColumns({
      t: mockT,
      tW: mockTW,
      tCommon: mockTCommon,
      editableRows,
      handleCellChange: mockHandleCellChange,
      getRowUid: mockGetRowUid,
    });

    const col = columns[2];
    const result = col.render?.(1.2, mockRow, 0);
    const { container } = render(<>{result}</>);
    
    const input = container.querySelector('input');
    expect(input).toHaveDisplayValue('1.50');
  });

  it('assessmentYear column renders range', () => {
    const columns = getNatureFactorCvColumns({
      t: mockT,
      tW: mockTW,
      tCommon: mockTCommon,
      editableRows: mockEditableRows,
      handleCellChange: mockHandleCellChange,
      getRowUid: mockGetRowUid,
    });

    const col = columns[3];
    expect(col.key).toBe('fromYear');
    expect(col.label).toBeDefined();
    expect(col.render?.(2024, mockRow, 0)).toBe('2024-2025');
  });

  it('isActive column renders active status badge for new records', () => {
    const newRow = { ...mockRow, id: 0, isActive: true };
    
    const columns = getNatureFactorCvColumns({
      t: mockT,
      tW: mockTW,
      tCommon: mockTCommon,
      editableRows: mockEditableRows,
      handleCellChange: mockHandleCellChange,
      getRowUid: mockGetRowUid,
    });

    const col = columns[4];
    const result = col.render?.(true, newRow, 0);
    const { container } = render(<>{result}</>);
    
    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
    expect(badge?.className).toContain('bg-emerald-50');
    expect(badge?.textContent).toContain('Active');
  });

  it('MatrixCellInput calls handleCellChange on value change', () => {
    const columns = getNatureFactorCvColumns({
      t: mockT,
      tW: mockTW,
      tCommon: mockTCommon,
      editableRows: mockEditableRows,
      handleCellChange: mockHandleCellChange,
      getRowUid: mockGetRowUid,
    });

    const col = columns[2];
    const result = col.render?.(1.2, mockRow, 0);
    const { container } = render(<>{result}</>);
    
    const input = container.querySelector('input');
    fireEvent.change(input!, { target: { value: '1.5' } });
    
    expect(mockHandleCellChange).toHaveBeenCalled();
  });
});
