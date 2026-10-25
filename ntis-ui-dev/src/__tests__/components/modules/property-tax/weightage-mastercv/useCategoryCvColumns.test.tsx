import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { getTypeOfUseColumns, getUseFactorColumns } from '@/components/modules/property-tax/weightage-mastercv/useCategoryCv/useCategoryCvColumns';
import { UseFactorCVMaster, UseType } from '@/types/useCategoryCvFactor.types';

describe('useCategoryCvColumns', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'leftTable.typeOfUseCode': 'Type Of Use Code',
      'leftTable.typeOfUse': 'Type Of Use',
      'leftTable.status': 'Status',
      'columns.typeOfUseCode': 'Type Of Use Code',
      'columns.typeOfUse': 'Type Of Use',
      'columns.subType': 'Sub Type',
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

  describe('getTypeOfUseColumns', () => {
    const mockHandleTypeRowClick = vi.fn();
    const mockLeftSort = vi.fn();

    const mockRow: UseType = {
      id: 1,
      typeOfUseCode: 'T1',
      description: 'Type 1',
      type: 'T',
      typeOfUseGroupId: 1,
      searchKey: 'T1',
      searchSequence: 1,
      isActive: true,
    };

    it('returns correct number of columns', () => {
      const columns = getTypeOfUseColumns(
        mockT,
        mockTW,
        mockHandleTypeRowClick,
        mockTCommon
      );

      expect(columns).toHaveLength(3);
    });

    it('handles sorting click on header', () => {
      const columns = getTypeOfUseColumns(
        mockT,
        mockTW,
        mockHandleTypeRowClick,
        mockTCommon,
        'TypeOfUseCode',
        'asc',
        mockLeftSort
      );

      const col = columns[0]; // Type of Use Code
      const { container } = render(<>{col.label}</>);
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      fireEvent.click(button!);
      
      expect(mockLeftSort).toHaveBeenCalledWith('TypeOfUseCode');
    });

    it('row click triggers handleTypeRowClick', () => {
      const columns = getTypeOfUseColumns(
        mockT,
        mockTW,
        mockHandleTypeRowClick,
        mockTCommon
      );

      const col = columns[0];
      const result = col.render?.('T1', mockRow, 0);
      const { container } = render(<>{result}</>);
      
      const button = container.querySelector('button');
      fireEvent.click(button!);
      
      expect(mockHandleTypeRowClick).toHaveBeenCalledWith(mockRow);
    });
  });

  describe('getUseFactorColumns', () => {
    const mockHandleCellChange = vi.fn();
    const mockGetRowUid = vi.fn((row: UseFactorCVMaster) => `${row.id}-${row.typeOfUseId}-${row.subTypeOfUseId}`);
    const mockSort = vi.fn();

    const mockRow: UseFactorCVMaster = {
      id: 1,
      typeOfUseId: 10,
      subTypeOfUseId: 20,
      factor: 1.5,
      yearRangeCVId: 2024,
      fromYear: 2024,
      toYear: 2025,
      isActive: true,
      typeOfUseCode: 'T1',
      typeOfUseDescription: 'Type 1',
      subTypeOfUseDescription: 'Sub 1',
    };

    it('returns correct number of columns', () => {
      const columns = getUseFactorColumns(
        mockT,
        mockTW,
        {},
        mockHandleCellChange,
        mockGetRowUid,
        mockTCommon
      );

      expect(columns).toHaveLength(6);
    });

    it('handles sorting click on right table headers', () => {
      const columns = getUseFactorColumns(
        mockT,
        mockTW,
        {},
        mockHandleCellChange,
        mockGetRowUid,
        mockTCommon,
        'TypeOfUseCode',
        'asc',
        mockSort
      );

      // columns: typeOfUseCode (0), typeOfUseDescription (1), subTypeOfUseDescription (2), factor (3), fromYear (4), isActive (5)
      const col = columns[0]; // typeOfUseCode
      const { container } = render(<>{col.label}</>);
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      fireEvent.click(button!);
      
      expect(mockSort).toHaveBeenCalledWith('TypeOfUseCode');
    });

    it('renders assessment year range correctly', () => {
      const columns = getUseFactorColumns(
        mockT,
        mockTW,
        {},
        mockHandleCellChange,
        mockGetRowUid,
        mockTCommon
      );

      const col = columns[4]; // assessmentYear (fromYear)
      expect(col.render?.(2024, mockRow, 0)).toBe('2024-2025');
    });

    it('factor column renders input and handles changes', () => {
      const columns = getUseFactorColumns(
        mockT,
        mockTW,
        {},
        mockHandleCellChange,
        mockGetRowUid,
        mockTCommon
      );

      const col = columns[3]; // factor
      const result = col.render?.(1.5, mockRow, 0);
      const { container } = render(<>{result}</>);
      
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(1.5);

      fireEvent.change(input!, { target: { value: '2.5' } });
      expect(mockHandleCellChange).toHaveBeenCalledWith('1-10-20', 'factor', 2.5);
    });
  });
});
