import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SelectPropertiesTable from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/SelectPropertiesTable';
import { SelectableProperty } from '@/types/floor-details.types';
import type { ReactNode } from 'react';

interface ClearButtonMockProps {
  label: string;
  onClick: () => void;
}

interface CheckboxMockProps {
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  'aria-label'?: string;
}

interface MasterTableColumn {
  key: keyof SelectableProperty | string;
  label: string;
  render?: (value: unknown, row: SelectableProperty, rowIndex: number) => ReactNode;
}

interface MasterTableMockProps {
  columns: MasterTableColumn[];
  data: SelectableProperty[];
  onRowClick?: (row: SelectableProperty) => void;
  rowClassName?: string | ((row: SelectableProperty) => string);
}

vi.mock('@/components/common/ActionButtons', () => ({
  ClearButton: ({ label, onClick }: ClearButtonMockProps) => (
    <button onClick={onClick} data-testid="clear-button">
      {label}
    </button>
  ),
}));

vi.mock('@/components/common', () => ({
  Checkbox: ({ checked, disabled, onCheckedChange, 'aria-label': ariaLabel }: CheckboxMockProps) => (
    <input
      type="checkbox"
      checked={!!checked}
      disabled={!!disabled}
      onChange={(e) => onCheckedChange(e.target.checked)}
      aria-label={ariaLabel}
      data-testid="mock-checkbox"
    />
  ),
  MasterTable: ({ columns, data, onRowClick, rowClassName }: MasterTableMockProps) => (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex: number) => {
          const className = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
          return (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={className}
              data-testid={`row-${row.id}`}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key as keyof SelectableProperty], row, rowIndex) : String(row[col.key as keyof SelectableProperty] ?? '')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  ),
}));

describe('SelectPropertiesTable', () => {
  const mockProperties: SelectableProperty[] = [
    {
      id: 1,
      propertyFloorId: null,
      propertyDetailsId: null,
      wardNo: '1',
      propertyNo: 'PROP1',
      partitionNo: '101',
      type: '1',
      typeLabel: 'Type 1',
      wing: '-',
      flatNo: '-',
      carpetAreaSqFeet: 100,
      carpetAreaSqMeter: 9.29,
    },
    {
      id: 2,
      propertyFloorId: null,
      propertyDetailsId: null,
      wardNo: '1',
      propertyNo: 'PROP2',
      partitionNo: '102',
      type: '2',
      typeLabel: 'Type 2',
      wing: '-',
      flatNo: '-',
      carpetAreaSqFeet: 200,
      carpetAreaSqMeter: 18.58,
    },
  ];

  const defaultProps = {
    t: (key: string) => key,
    properties: mockProperties,
    selectedIds: new Set<string | number>(),
    onToggle: vi.fn(),
    onClearSelection: vi.fn(),
    onToggleMultiple: vi.fn(),
    isLoading: false,
    disabledIds: new Set<string | number>(),
    hideTypeColumn: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders properties inside rows correctly', () => {
    render(<SelectPropertiesTable {...defaultProps} />);

    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-2')).toBeInTheDocument();
    expect(screen.getByText('1-PROP1-101')).toBeInTheDocument();
    expect(screen.getByText('1-PROP2-102')).toBeInTheDocument();
  });

  it('triggers onToggle when single checkbox or row is clicked', () => {
    render(<SelectPropertiesTable {...defaultProps} />);

    // Click checkbox for row 1
    const checkboxes = screen.getAllByTestId('mock-checkbox');
    // first checkbox is select all, second is row 1
    fireEvent.click(checkboxes[1]);
    expect(defaultProps.onToggle).toHaveBeenCalledWith(1);

    // Click row 2 directly
    fireEvent.click(screen.getByTestId('row-2'));
    expect(defaultProps.onToggle).toHaveBeenCalledWith(2);
  });

  it('handles select all behavior correctly when not all selected', () => {
    render(<SelectPropertiesTable {...defaultProps} />);

    const selectAllCheckbox = screen.getAllByTestId('mock-checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    // Should call onToggleMultiple with both property ids since none were selected
    expect(defaultProps.onToggleMultiple).toHaveBeenCalledWith([1, 2], true);
  });

  it('handles select all behavior correctly when onToggleMultiple is not provided', () => {
    const propsWithoutBulk = { ...defaultProps, onToggleMultiple: undefined };
    render(<SelectPropertiesTable {...propsWithoutBulk} />);

    const selectAllCheckbox = screen.getAllByTestId('mock-checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    // Should fallback to loop-calling onToggle
    expect(defaultProps.onToggle).toHaveBeenCalledWith(1);
    expect(defaultProps.onToggle).toHaveBeenCalledWith(2);
  });

  it('handles clear selection when clicking select all when all are already selected', () => {
    const propsAllSelected = {
      ...defaultProps,
      selectedIds: new Set<string | number>([1, 2]),
    };
    render(<SelectPropertiesTable {...propsAllSelected} />);

    const selectAllCheckbox = screen.getAllByTestId('mock-checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    expect(defaultProps.onClearSelection).toHaveBeenCalledTimes(1);
  });

  it('applies correct class names based on row selected/disabled states', () => {
    const props = {
      ...defaultProps,
      selectedIds: new Set<string | number>([1]),
      disabledIds: new Set<string | number>([2]),
    };
    render(<SelectPropertiesTable {...props} />);

    const row1 = screen.getByTestId('row-1');
    const row2 = screen.getByTestId('row-2');

    expect(row1).toHaveClass('!bg-green-100', '[&>td]:!bg-green-100');

    // Check visual disabled classes
    expect(row2).toHaveClass('opacity-60', 'bg-slate-50', 'cursor-not-allowed');
    expect(row2).not.toHaveClass('!bg-green-50', 'hover:!bg-green-100');

    // Check semantic disabled state (checkbox)
    const checkboxes = screen.getAllByTestId('mock-checkbox');
    expect(checkboxes[2]).toBeDisabled();

    // Check interaction is disabled
    fireEvent.click(row2);
    expect(props.onToggle).not.toHaveBeenCalledWith(2);
  });

  it('hides Type column when hideTypeColumn is true', () => {
    const props = {
      ...defaultProps,
      hideTypeColumn: true,
    };
    render(<SelectPropertiesTable {...props} />);

    expect(screen.queryByText('Type 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Type 2')).not.toBeInTheDocument();
  });
});


