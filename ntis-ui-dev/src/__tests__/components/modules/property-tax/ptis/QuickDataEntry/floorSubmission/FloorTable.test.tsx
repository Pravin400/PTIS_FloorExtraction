import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FloorTable from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/FloorTable';
import { FloorData } from '@/types/room-details.types';

vi.mock('@/components/common', () => ({
  AddButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      data-testid={label === 'floor.dataEntry' || label === 'floor.dataEntryApplyAll' ? 'data-entry-button' : 'add-floor-button'}
    >
      {label}
    </button>
  ),
  FloorDetailsTable: ({ data, columns, emptyMessage, rowClassName }: { data: FloorData[]; columns: { key: string; render?: (row: FloorData, idx: number) => React.ReactNode }[]; emptyMessage?: React.ReactNode; rowClassName?: string | ((row: FloorData, idx: number) => string) }) => (
    <div data-testid="master-table">
      {!data || data.length === 0 ? (
        <div data-testid="empty-text">{emptyMessage}</div>
      ) : (
        <table>
          <tbody>
            {data.map((row: FloorData, index: number) => {
              return (
                <tr key={row.id || index} className={typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName}>
                  <td>
                    <a aria-label="Expand row" href={`#floor-${row.id}`}>Expand</a>
                  </td>
                  {columns.map((col: { key: string; render?: (row: FloorData, idx: number) => React.ReactNode }) => (
                    <td key={col.key}>
                      {col.render ? col.render(row, index) : String(row[col.key as keyof FloorData] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  ),
  DeleteButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} data-testid="delete-button">Delete</button>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
  Layers: () => <div>Layers Icon</div>,
}));

vi.mock('@/lib/utils/floorSubmission/floor-mappers', () => ({
  getFloorDescription: (val: string) => `Floor ${val}`,
  getSubFloorDescription: (val: string) => `SubFloor ${val}`,
  getConstructionDescription: (val: string) => `Construction ${val}`,
  getUseDescription: (val: string) => `Use ${val}`,
  getSubTypeDescription: (val: string) => `SubType ${val}`,
  getTypeOfUseId: (floor: FloorData) => floor.use || null,
  normalizeFloorFormData: (floor: FloorData) => floor,
}));

vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/FloorTableColumns', () => ({
  useFloorTableColumns: () => [
    { key: 'floor', label: 'Floor', render: (val: unknown) => val },
    { key: 'areaSqFt', label: 'Area', render: (val: unknown) => val },
  ],
  renderFloorActions: (_t: (key: string) => string, handleDelete: (row: FloorData) => void) => (row: FloorData) => (
    <button onClick={() => handleDelete(row)} data-testid="delete-action">Delete</button>
  ),
}));

describe('FloorTable', () => {
  const mockFloorData: FloorData[] = [
    {
      id: 1,
      floor: 'Ground Floor',
      subFloor: 'None',
      conYr: '2020',
      asstYr: '2021',
      conTyp: 'RCC',
      use: 'Residential',
      subTyp: 'Apartment',
      rooms: '5',
      areaSqFt: '1000',
      areaSqM: '92.9',
      builtupAreaSqFt: '1200',
      builtupAreaSqM: '111.5',
      renter: false,
    },
    {
      id: 2,
      floor: 'First Floor',
      subFloor: 'None',
      conYr: '2020',
      asstYr: '2021',
      conTyp: 'RCC',
      use: 'Commercial',
      subTyp: 'Office',
      rooms: '3',
      areaSqFt: '800',
      areaSqM: '74.3',
      builtupAreaSqFt: '900',
      builtupAreaSqM: '83.6',
      renter: true,
    },
  ];

  const mockProps = {
    t: (key: string) => key,
    filteredFloors: mockFloorData,
    floorSearch: '',
    setFloorSearch: vi.fn(),
    selectedFloor: null,
    setSelectedFloor: vi.fn(),
    isAddingNewFloor: false,
    setIsAddingNewFloor: vi.fn(),
    handleAddFloor: vi.fn(),
    handleOpenDataEntrySameAs: vi.fn(),
    updateUrlParams: vi.fn(),
    handleDeleteFloor: vi.fn(),
    startTransition: vi.fn((fn: () => void) => fn()),
    setFormErrors: vi.fn(),
    floorLookup: [],
    subFloorLookup: [],
    constructionLookup: [],
    useLookup: [],
    subTypeData: [],
    setEditingFloorForm: vi.fn(),
    categoryName: 'Individual',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders floor table with data', () => {
    render(<FloorTable {...mockProps} />);

    expect(screen.getByTestId('master-table')).toBeInTheDocument();
    expect(screen.getByText('floor.allFloors')).toBeInTheDocument();
  });

  it('displays floor count badge', () => {
    render(<FloorTable {...mockProps} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders table summary metrics badges including Additional Plot Area', () => {
    render(<FloorTable {...mockProps} plotAreaSqM={1000} />);

    expect(screen.getByText('floor.plotAreaColon')).toBeInTheDocument();
    expect(screen.getByText('floor.additionalPlotAreaColon')).toBeInTheDocument();
    expect(screen.getByText('floor.carpetAreaColon')).toBeInTheDocument();
    expect(screen.getByText('floor.builtupAreaColon')).toBeInTheDocument();
  });

  it('hides table summary metrics badges when isBuildingPermissionView is true', () => {
    render(<FloorTable {...mockProps} isBuildingPermissionView={true} plotAreaSqM={1000} />);

    expect(screen.queryByText('Plot Area:')).toBeNull();
    expect(screen.queryByText('Additional Plot Area:')).toBeNull();
    expect(screen.queryByText('Carpet Area:')).toBeNull();
    expect(screen.queryByText('Built-up Area:')).toBeNull();
  });

  it('renders add floor button', () => {
    render(<FloorTable {...mockProps} />);

    const addButton = screen.getByTestId('add-floor-button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent('floor.addFloor');
  });

  it('renders data entry same as button', () => {
    render(<FloorTable {...mockProps} />);

    const dataEntryButton = screen.getByTestId('data-entry-button');
    expect(dataEntryButton).toBeInTheDocument();
    expect(dataEntryButton).toHaveTextContent('floor.dataEntry');
  });

  it('opens the data entry same as drawer when data entry same as button is clicked', () => {
    render(<FloorTable {...mockProps} />);

    const dataEntryButton = screen.getByTestId('data-entry-button');
    fireEvent.click(dataEntryButton);

    expect(mockProps.handleOpenDataEntrySameAs).toHaveBeenCalled();
  });

  it('calls handleAddFloor when add button is clicked', () => {
    render(<FloorTable {...mockProps} />);

    const addButton = screen.getByTestId('add-floor-button');
    fireEvent.click(addButton);

    expect(mockProps.handleAddFloor).toHaveBeenCalled();
  });

  it('hides Data Entry Same As button when propertyDescription is Amenity or ॲमिनिटी', () => {
    render(<FloorTable {...mockProps} propertyDescription="ॲमिनिटी" />);
    expect(screen.queryByTestId('data-entry-button')).toBeNull();
  });

  it('hides Data Entry Same As button when partitionNo is AAM10', () => {
    render(<FloorTable {...mockProps} partitionNo="AAM10" />);
    expect(screen.queryByTestId('data-entry-button')).toBeNull();
  });

  it('enables Data Entry Same As for an Apartment with an A2 partition', () => {
    render(
      <FloorTable
        {...mockProps}
        categoryName={'Apartment'}
        partitionNo={'A2'}
      />
    );

    const btn = screen.getByTestId('data-entry-button');
    expect(btn).toBeEnabled();
    expect(btn).toHaveTextContent('floor.dataEntryApplyAll');
  });

  it('hides Data Entry Same As button when category is Apartment and partitionNo is null or empty', () => {
    render(<FloorTable {...mockProps} categoryName="Apartment" partitionNo="" />);
    expect(screen.queryByTestId('data-entry-button')).toBeNull();
  });

  it('hides Data Entry Same As button when property has no category (categoryName is undefined or empty)', () => {
    render(<FloorTable {...mockProps} categoryName="" />);
    expect(screen.queryByTestId('data-entry-button')).toBeNull();

    render(<FloorTable {...mockProps} categoryName={undefined} />);
    expect(screen.queryByTestId('data-entry-button')).toBeNull();
  });
});
