import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MatrixGrid, MatrixColumn, MatrixRow } from '@/components/common/MatrixGrid';

const mockTranslations = {
  action: 'Action',
  currencySymbol: '₹',
  deleteRow: 'Delete Row',
};

describe('MatrixGrid', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const columns: MatrixColumn[] = [
    { id: 'col1', label: 'Column 1', unit: 'kg' },
    { id: 'col2', label: 'Column 2' },
  ];

  const metaColumns = [
    { id: 'meta1', label: 'Meta 1' },
  ];

  const rows: MatrixRow[] = [
    {
      id: 'row1',
      cells: { col1: 10, col2: 20 },
      meta: { meta1: 'Meta Value 1' },
    },
    {
      id: 'row2',
      cells: { col1: 30, col2: 40 },
      meta: { meta1: 'Meta Value 2' },
    },
  ];

  it('renders correctly with required props', () => {
    render(<MatrixGrid columns={columns} rows={rows} translations={mockTranslations} />);
    
    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('(kg)')).toBeInTheDocument();
    expect(screen.getByText('Column 2')).toBeInTheDocument();
    
    // In view mode (default), cells are rendered as static divs with formatted values (no currency symbol)
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('renders meta columns correctly', () => {
    render(<MatrixGrid columns={columns} rows={rows} metaColumns={metaColumns} translations={mockTranslations} />);
    
    expect(screen.getByText('Meta 1')).toBeInTheDocument();
    expect(screen.getByText('Meta Value 1')).toBeInTheDocument();
    expect(screen.getByText('Meta Value 2')).toBeInTheDocument();
  });

  it('renders action column when onRowDelete is provided', () => {
    const onRowDelete = vi.fn();
    render(<MatrixGrid columns={columns} rows={rows} onRowDelete={onRowDelete} translations={mockTranslations} />);
    
    expect(screen.getByText('Action')).toBeInTheDocument();
    const deleteButtons = screen.getAllByRole('button');
    expect(deleteButtons).toHaveLength(2);
  });

  it('calls onRowDelete when delete button is clicked', () => {
    const onRowDelete = vi.fn();
    render(<MatrixGrid columns={columns} rows={rows} onRowDelete={onRowDelete} translations={mockTranslations} />);
    
    const deleteButtons = screen.getAllByRole('button');
    fireEvent.click(deleteButtons[0]);
    
    expect(onRowDelete).toHaveBeenCalledWith(0);
  });

  it('renders inputs in edit mode for editable columns', () => {
    const onCellChange = vi.fn();
    render(
      <MatrixGrid 
        columns={columns} 
        rows={rows} 
        mode="edit" 
        editableColumns={['col1']} 
        onCellChange={onCellChange}
        translations={mockTranslations}
      />
    );
    
    // Only col1 is editable, so only 2 inputs (col1 for row1 and row2)
    const inputs = screen.getAllByRole('spinbutton'); // input type="number"
    expect(inputs).toHaveLength(2); // Only col1 cells are inputs
    expect(inputs[0]).toHaveValue(10); // row1, col1
    expect(inputs[0]).not.toHaveAttribute('readOnly');
    expect(inputs[1]).toHaveValue(30); // row2, col1
    expect(inputs[1]).not.toHaveAttribute('readOnly');
    
    // col2 cells are still static divs (not editable, no currency symbol)
    expect(screen.getByText('20')).toBeInTheDocument(); // row1, col2
    expect(screen.getByText('40')).toBeInTheDocument(); // row2, col2
  });

  it('calls onCellChange when input value changes', () => {
    const onCellChange = vi.fn();
    render(
      <MatrixGrid 
        columns={columns} 
        rows={rows} 
        mode="edit" 
        editableColumns={['col1']} 
        onCellChange={onCellChange}
        translations={mockTranslations}
      />
    );
    
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '15' } });
    
    expect(onCellChange).toHaveBeenCalledWith('row1', 'col1', 15);
  });

  it('handles empty/invalid input gracefully', () => {
    const onCellChange = vi.fn();
    render(
      <MatrixGrid 
        columns={columns} 
        rows={rows} 
        mode="edit" 
        editableColumns={['col1']} 
        onCellChange={onCellChange}
        translations={mockTranslations}
      />
    );
    
    const inputs = screen.getAllByRole('spinbutton');
    
    // Empty string -> 0
    fireEvent.change(inputs[0], { target: { value: '' } });
    expect(onCellChange).toHaveBeenCalledWith('row1', 'col1', 0);
    
    // Negative value -> 0
    fireEvent.change(inputs[0], { target: { value: '-5' } });
    expect(onCellChange).toHaveBeenCalledWith('row1', 'col1', 0);
  });

  it('applies colorMap to headers and cells', () => {
    const colorMap = { 'COL1': 'bg-red-100', 'COL2': 'bg-green-100' };
    render(<MatrixGrid columns={columns} rows={rows} colorMap={colorMap} translations={mockTranslations} />);
    
    // Check header for Col1
    // The text 'Column 1' is inside a div which is inside the th
    const col1Header = screen.getByText('Column 1').closest('th');
    expect(col1Header).toHaveClass('bg-red-100');
    
    // Check cell for Col1 (in row 1)
    // In view mode, cells are rendered as divs with formatted values (no currency symbol)
    const col1Cell = screen.getByText('10').closest('div');
    expect(col1Cell).toHaveClass('bg-red-100');
    
    // Check cell for Col2 (in row 1)
    const col2Cell = screen.getByText('20').closest('div');
    expect(col2Cell).toHaveClass('bg-green-100');
  });

  it('renders tooltip for columns with tooltip property', () => {
    const columnsWithTooltip: MatrixColumn[] = [
      { id: 'col1', label: 'Column 1', tooltip: 'Helpful info' }
    ];
    
    render(<MatrixGrid columns={columnsWithTooltip} rows={rows} translations={mockTranslations} />);
    
    // The tooltip trigger is the header cell wrapper
    // The structure is Tooltip -> headerCell
    const headerText = screen.getByText('Column 1');
    
    fireEvent.mouseEnter(headerText);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Helpful info')).toBeInTheDocument();
  });

  it('handles custom cell rendering with colorMap', () => {
    const colorMap = { 'COL1': 'bg-blue-100 text-blue-900' };
    render(
      <MatrixGrid 
        columns={columns} 
        rows={rows} 
        colorMap={colorMap} 
        translations={mockTranslations} 
      />
    );
    
    const cell = screen.getByText('10');
    expect(cell).toHaveClass('bg-blue-100');
    expect(cell).toHaveClass('text-blue-900');
  });
});