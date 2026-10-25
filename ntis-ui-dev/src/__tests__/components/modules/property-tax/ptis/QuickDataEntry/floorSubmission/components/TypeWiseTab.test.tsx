import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TypeWiseTab } from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/components/TypeWiseTab';
import type { SelectableProperty } from '@/types/floor-details.types';

// Mock dependencies of TypeWiseTab
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/FloorTable', () => ({
  default: () => <div data-testid="mock-floor-table">FloorTable</div>,
}));

vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/SelectPropertiesTable', () => ({
  default: ({ properties, leftHeaderContent }: { properties: SelectableProperty[]; leftHeaderContent?: React.ReactNode }) => (
    <div data-testid={leftHeaderContent ? 'drawer-properties-table' : 'main-properties-table'}>
      {leftHeaderContent && <div data-testid="left-header">{leftHeaderContent}</div>}
      <ul>
        {properties.map((p) => (
          <li key={p.id} data-testid={`prop-row-${p.id}`}>
            {p.partitionNo} - {p.type}
          </li>
        ))}
      </ul>
    </div>
  ),
}));

vi.mock('@/components/common', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Drawer: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div>{children}</div> : null),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Select: () => <select data-testid="mock-select" />,
}));

vi.mock('@/components/common/ActionButtons', () => ({
  UpdateButton: ({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{label}</button>
  ),
}));

describe('TypeWiseTab', () => {
  const mockProperties: SelectableProperty[] = [
    { id: '1', partitionNo: 'A1', type: '1', typeLabel: 'Residential', wardId: 1, wardNo: 'WARD1', propertyNo: '1', wing: '-', flatNo: '-' },
    { id: '2', partitionNo: 'A2', type: '1', typeLabel: 'Residential', wardId: 1, wardNo: 'WARD1', propertyNo: '1', wing: '-', flatNo: '-' },
    { id: '3', partitionNo: 'A3', type: '2', typeLabel: 'Commercial', wardId: 1, wardNo: 'WARD1', propertyNo: '1', wing: '-', flatNo: '-' },
    { id: '4', partitionNo: 'B1', type: '2', typeLabel: 'Commercial', wardId: 1, wardNo: 'WARD1', propertyNo: '1', wing: '-', flatNo: '-' },
  ];

  const defaultProps = {
    t: (key: string) => key,
    currentPropertyType: '1',
    properties: mockProperties,
    selectedIds: new Set<string | number>(),
    onToggle: vi.fn(),
    onClearSelection: vi.fn(),
    isLoading: false,
    disabledIds: new Set<string | number>(),
    sourcePropertyIds: new Set<string | number>(['1']),
    isApplying: false,
    onApply: vi.fn(),
    changeTypeInput: '',
    setChangeTypeInput: vi.fn(),
    isApplyingTypeSubmission: false,
    onApplyTypeSubmission: vi.fn(),
    // FloorTable dummy props
    filteredFloors: [],
    floorSearch: '',
    setFloorSearch: vi.fn(),
    selectedFloor: null,
    setSelectedFloor: vi.fn(),
    isAddingNewFloor: false,
    setIsAddingNewFloor: vi.fn(),
    handleAddFloor: vi.fn(),
    updateUrlParams: vi.fn(),
    handleDeleteFloor: vi.fn(),
    startTransition: vi.fn(),
    setFormErrors: vi.fn(),
    floorLookup: [],
    subFloorLookup: [],
    constructionLookup: [],
    useLookup: [],
    subTypeData: [],
    setEditingFloorForm: vi.fn(),
  };

  it('filters main properties table to show only properties matching currentPropertyType', () => {
    render(<TypeWiseTab {...defaultProps} />);

    const mainTable = screen.getByTestId('main-properties-table');
    expect(mainTable).toBeInTheDocument();

    // Partition A1 and A2 have type '1', so they should be present
    expect(screen.getByTestId('prop-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('prop-row-2')).toBeInTheDocument();

    // Partition A3 and B1 have type '2', so they should NOT be in the main table
    expect(screen.queryByTestId('prop-row-3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('prop-row-4')).not.toBeInTheDocument();
  });
});
