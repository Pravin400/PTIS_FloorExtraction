import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FloorDetailsTable, type FloorDetailsTableColumn } from '@/components/common/FloorDetailsTable';
import { ChevronRight, type LucideIcon } from 'lucide-react';

describe('FloorDetailsTable', () => {
  interface TestData {
    id: number;
    name: string;
    value: string;
  }

  const columns: FloorDetailsTableColumn<TestData>[] = [
    { key: 'name', label: 'Name', render: (row) => row.name },
    { key: 'value', label: 'Value', render: (row) => row.value },
  ];

  const data: TestData[] = [
    { id: 1, name: 'Row 1', value: 'Val 1' },
    { id: 2, name: 'Row 2', value: 'Val 2' },
    { id: 3, name: 'Row 3', value: 'Val 3' },
    { id: 4, name: 'Row 4', value: 'Val 4' },
  ];

  it('renders empty message when data is empty', () => {
    render(<FloorDetailsTable data={[]} columns={columns} emptyMessage="No items" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('renders default empty message when data is null', () => {
    render(<FloorDetailsTable data={null as unknown as TestData[]} columns={columns} />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders table headers and data correctly', () => {
    render(<FloorDetailsTable data={data} columns={columns} showExpandColumn={false} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Val 1')).toBeInTheDocument();
  });

  it('renders custom header using renderHeader prop', () => {
    render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        renderHeader={() => <tr data-testid="custom-header"><td>Header</td></tr>} 
      />
    );
    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
  });

  it('renders custom footer using renderFooter prop', () => {
    render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        renderFooter={() => <tr data-testid="custom-footer"><td>Footer</td></tr>} 
      />
    );
    expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
  });

  it('applies striped background classes correctly', () => {
    const { container } = render(<FloorDetailsTable data={data} columns={columns} striped={true} />);
    const rows = container.querySelectorAll('tbody tr:not([class*="bg-blue-50/30"])');
    
    // Row 1 (index 0) -> bg-white
    expect(rows[0]).toHaveClass('bg-white');
    // Row 2 (index 1) -> bg-white
    expect(rows[1]).toHaveClass('bg-white');
    // Row 3 (index 2) -> bg-[#EEF6FF]
    expect(rows[2]).toHaveClass('bg-[#EEF6FF]');
    // Row 4 (index 3) -> bg-[#EEF6FF]
    expect(rows[3]).toHaveClass('bg-[#EEF6FF]');
  });

  it('handles custom colorGroups for striping', () => {
    const { container } = render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        striped={true} 
        colorGroups={['bg-red-50', 'bg-green-50']} 
      />
    );
    const rows = container.querySelectorAll('tbody tr:not([class*="bg-blue-50/30"])');
    expect(rows[0]).toHaveClass('bg-red-50');
    expect(rows[2]).toHaveClass('bg-green-50');
  });

  it('handles empty colorGroups by falling back to bg-white', () => {
    const { container } = render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        striped={true} 
        colorGroups={[]} 
      />
    );
    const rows = container.querySelectorAll('tbody tr:not([class*="bg-blue-50/30"])');
    expect(rows[0]).toHaveClass('bg-white');
  });

  it('does not apply background classes when striped is false', () => {
    const { container } = render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        striped={false} 
      />
    );
    const rows = container.querySelectorAll('tbody tr:not([class*="bg-blue-50/30"])');
    expect(rows[0]).not.toHaveClass('bg-white');
    expect(rows[0]).not.toHaveClass('bg-[#EEF6FF]');
  });

  it('renders expansion column with links when getExpandHref is provided', () => {
    render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        getExpandHref={(row) => `/details/${row.id}`} 
      />
    );
    const button = screen.getAllByRole('button')[0];
    expect(button).toHaveAttribute('data-href', '/details/1');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders expanded row content when row is in expandedRowIds', () => {
    render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        expandedRowIds={[1]} 
        renderExpanded={(row) => <div data-testid={`expanded-${row.id}`}>Expanded Content</div>}
      />
    );
    expect(screen.getByTestId('expanded-1')).toBeInTheDocument();
    expect(screen.queryByTestId('expanded-2')).not.toBeInTheDocument();
  });

  it('toggles expansion icons when expanded', () => {
    render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        expandedRowIds={[1]} 
        getExpandHref={(row) => `?id=${row.id}`}
        expandIcon={ChevronRight}
      />
    );
    const expandedButton = screen.getAllByRole('button')[0];
    expect(expandedButton).toHaveAttribute('aria-expanded', 'true');
    // ChevronDown should be present for expanded row
    expect(expandedButton.querySelector('.lucide-chevron-down')).toBeInTheDocument();
  });

  it('renders empty expansion cell when getExpandHref is missing', () => {
    const { container } = render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        showExpandColumn={true}
      />
    );
    const cells = container.querySelectorAll('tbody td:first-child');
    expect(cells[0].querySelector('button')).toBeNull();
    expect(cells[0].querySelector('.h-3.w-3')).toBeInTheDocument();
  });

  it('respects showExpandColumn={false}', () => {
    const { container } = render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        showExpandColumn={false}
      />
    );
    expect(container.querySelector('th .lucide-home')).toBeNull();
  });

  it('uses custom rowClassName if provided', () => {
    render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        rowClassName={(row) => `custom-row-${row.id}`}
      />
    );
    expect(screen.getByText('Row 1').closest('tr')).toHaveClass('custom-row-1');
  });

  it('renders custom column header using headerRender', () => {
    const customColumns: FloorDetailsTableColumn<TestData>[] = [
      { 
        key: 'name', 
        label: 'Name', 
        headerRender: (col) => <div data-testid="custom-col-header">{col.label}</div>,
        render: (row) => row.name 
      }
    ];
    render(<FloorDetailsTable data={data} columns={customColumns} />);
    expect(screen.getByTestId('custom-col-header')).toBeInTheDocument();
  });

  it('renders non-string labels in headers correctly', () => {
    const customColumns: FloorDetailsTableColumn<TestData>[] = [
      { 
        key: 'name', 
        label: <span data-testid="span-label">Name</span>, 
        render: (row) => row.name 
      }
    ];
    render(<FloorDetailsTable data={data} columns={customColumns} />);
    expect(screen.getByTestId('span-label')).toBeInTheDocument();
  });

  it('hides sort icon when sortable is false', () => {
    const customColumns: FloorDetailsTableColumn<TestData>[] = [
      { key: 'name', label: 'Name', render: (row) => row.name, sortable: false }
    ];
    const { container } = render(<FloorDetailsTable data={data} columns={customColumns} />);
    expect(container.querySelector('.lucide-arrow-up-down')).toBeNull();
  });

  it('applies custom class names to various elements', () => {
    const { container } = render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        tableClassName="custom-table"
        containerClassName="custom-container"
        theadClassName="custom-thead"
        tbodyClassName="custom-tbody"
        headerCellClassName="custom-header-cell"
        cellClassName="custom-cell"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-container');
    expect(container.querySelector('table')).toHaveClass('custom-table');
    expect(container.querySelector('thead')).toHaveClass('custom-thead');
    expect(container.querySelector('tbody')).toHaveClass('custom-tbody');
    expect(container.querySelector('th')).toHaveClass('custom-header-cell');
    expect(container.querySelector('td')).toHaveClass('custom-cell');
  });

  it('applies column-specific class names', () => {
    const customColumns: FloorDetailsTableColumn<TestData>[] = [
      { 
        key: 'name', 
        label: 'Name', 
        headerClassName: 'col-header-custom',
        cellClassName: 'col-cell-custom',
        render: (row) => row.name 
      }
    ];
    render(<FloorDetailsTable data={data} columns={customColumns} />);
    expect(screen.getByText('Name').closest('th')).toHaveClass('col-header-custom');
    expect(screen.getByText('Row 1').closest('td')).toHaveClass('col-cell-custom');
  });

  it('renders custom ExpandIcon and ExpandHeaderIcon', () => {
    const CustomIcon = () => <div data-testid="custom-icon" />;
    const CustomHeaderIcon = () => <div data-testid="custom-header-icon" />;
    
    render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        getExpandHref={() => '#'}
        expandIcon={CustomIcon as unknown as LucideIcon}
        expandHeaderIcon={CustomHeaderIcon as unknown as LucideIcon}
      />
    );
    
    expect(screen.getByTestId('custom-header-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('custom-icon').length).toBeGreaterThan(0);
  });

  it('renders expanded row content correctly when showExpandColumn is false', () => {
    render(
      <FloorDetailsTable 
        data={data} 
        columns={columns} 
        showExpandColumn={false}
        expandedRowIds={[1]} 
        renderExpanded={(row) => <div data-testid={`expanded-no-col-${row.id}`}>Expanded</div>}
      />
    );
    expect(screen.getByTestId('expanded-no-col-1')).toBeInTheDocument();
    const td = screen.getByTestId('expanded-no-col-1').closest('td');
    expect(td).toHaveAttribute('colSpan', '2'); // 2 columns + 0 expansion col
  });

  it('supports interactive client-side sorting', () => {
    interface SortTestRow {
      id: number;
      name: string;
      area: string;
      date: string;
    }

    const sortData: SortTestRow[] = [
      { id: 1, name: 'Charlie', area: '10,000.00 / 1,000.00', date: '25/05/2026' },
      { id: 2, name: 'Alpha', area: '1,000.00 / 100.00', date: '10/01/2022' },
      { id: 3, name: 'Bravo', area: '50,000.00 / 5,000.00', date: '15/08/2024' },
    ];

    const sortColumns: FloorDetailsTableColumn<SortTestRow>[] = [
      { key: 'name', label: 'Name', render: (row) => row.name },
      { key: 'area', label: 'Area', render: (row) => row.area },
      { key: 'date', label: 'Date', render: (row) => row.date },
    ];

    render(<FloorDetailsTable data={sortData} columns={sortColumns} showExpandColumn={false} />);

    // 1. Text Sorting Test (Name)
    const nameHeader = screen.getByText('Name');
    
    // First click: Ascending (Alpha, Bravo, Charlie)
    fireEvent.click(nameHeader);
    let cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Alpha');
    expect(cells[3]).toHaveTextContent('Bravo');
    expect(cells[6]).toHaveTextContent('Charlie');

    // Second click: Descending (Charlie, Bravo, Alpha)
    fireEvent.click(nameHeader);
    cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Charlie');
    expect(cells[3]).toHaveTextContent('Bravo');
    expect(cells[6]).toHaveTextContent('Alpha');

    // Third click: Reset to original order (Charlie, Alpha, Bravo)
    fireEvent.click(nameHeader);
    cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Charlie');
    expect(cells[3]).toHaveTextContent('Alpha');
    expect(cells[6]).toHaveTextContent('Bravo');

    // 2. Numeric Pair Sorting Test (Area)
    const areaHeader = screen.getByText('Area');

    // First click: Ascending (Alpha: 1000, Charlie: 10000, Bravo: 50000)
    fireEvent.click(areaHeader);
    cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Alpha');
    expect(cells[3]).toHaveTextContent('Charlie');
    expect(cells[6]).toHaveTextContent('Bravo');

    // Second click: Descending (Bravo: 50000, Charlie: 10000, Alpha: 1000)
    fireEvent.click(areaHeader);
    cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Bravo');
    expect(cells[3]).toHaveTextContent('Charlie');
    expect(cells[6]).toHaveTextContent('Alpha');

    // 3. Date Sorting Test (Date)
    const dateHeader = screen.getByText('Date');

    // First click: Ascending (Alpha: 2022, Bravo: 2024, Charlie: 2026)
    fireEvent.click(dateHeader);
    cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Alpha');
    expect(cells[3]).toHaveTextContent('Bravo');
    expect(cells[6]).toHaveTextContent('Charlie');

    // Second click: Descending (Charlie: 2026, Bravo: 2024, Alpha: 2022)
    fireEvent.click(dateHeader);
    cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Charlie');
    expect(cells[3]).toHaveTextContent('Bravo');
    expect(cells[6]).toHaveTextContent('Alpha');
  });

  it('renders edit button when onEditClick is provided', () => {
    const onEditMock = vi.fn();
    render(
      <FloorDetailsTable
        data={data}
        columns={columns}
        onEditClick={onEditMock}
      />
    );

    const editButtons = screen.getAllByLabelText('Edit row');
    expect(editButtons).toHaveLength(data.length);

    fireEvent.click(editButtons[0]);
    expect(onEditMock).toHaveBeenCalledTimes(1);
    expect(onEditMock).toHaveBeenCalledWith(data[0], 0);
  });

  it('renders edit button with custom editTooltip when provided', () => {
    render(
      <FloorDetailsTable
        data={data}
        columns={columns}
        onEditClick={() => {}}
        editTooltip="Modify Item"
      />
    );

    const editButtons = screen.getAllByLabelText('Modify Item');
    expect(editButtons).toHaveLength(data.length);
    expect(editButtons[0]).toHaveAttribute('title', 'Modify Item');
  });
});
