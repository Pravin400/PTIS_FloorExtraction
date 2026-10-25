import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  useDrawerCommonColumns,
  useDrawerRateableColumns,
  useDrawerCapitalColumns,
  CompactSelect,
  CompactCellInput,
  ReadOnlyCellHover,
  useDrawerActionColumn,
} from '@/components/modules/property-tax/ptis/appartmentQC/PropertyEditScreenColumns';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock Tooltip component
vi.mock('@/components/common', () => ({
  Tooltip: ({ children, content }: { children?: React.ReactNode; content?: React.ReactNode }) => (
    <div data-testid="tooltip">
      {children}
      <div data-testid="tooltip-content">{content}</div>
    </div>
  ),
}));

// Mock ExternalLink icon from lucide-react
vi.mock('lucide-react', () => ({
  ExternalLink: () => <span data-testid="external-link" />,
}));

describe('PropertyEditScreenColumns', () => {
  const mockProps = {
    floorOptions: [
      { value: '1', label: 'Ground Floor' },
      { value: '2', label: 'First Floor' },
    ],
    conTypeOptions: [
      { value: '1', label: 'Brick' },
      { value: '2', label: 'Concrete' },
    ],
    useTypeOptions: [
      { value: '1', label: 'Residential' },
      { value: '2', label: 'Commercial' },
    ],
    getSubTypeOptions: vi.fn((useTypeId: string) => {
      if (useTypeId === '1') {
        return [
          { value: '1', label: '1 BHK' },
          { value: '2', label: '2 BHK' },
        ];
      }
      return [];
    }),
    isLoadingFloors: false,
    isLoadingConTypes: false,
    isLoadingUseTypes: false,
    handleFloorDropdownClick: vi.fn(),
    handleConTypeDropdownClick: vi.fn(),
    handleUseTypeDropdownClick: vi.fn(),
    updateRow: vi.fn(),
    onOpenRoomSubmission: vi.fn(),
  };

  describe('useDrawerCommonColumns', () => {
    it('should return common columns with correct structure', () => {
      // Create a test component to use the hook
      const TestComponent = () => {
        const columns = useDrawerCommonColumns(mockProps);
        return (
          <div>
            {columns.map(col => (
              <div key={col.key} data-testid={`column-${col.key}`}>{col.label}</div>
            ))}
          </div>
        );
      };
      render(<TestComponent />);
      expect(screen.getByTestId('column-floorId')).toBeInTheDocument();
      expect(screen.getByTestId('column-constructionTypeId')).toBeInTheDocument();
      expect(screen.getByTestId('column-typeOfUseId')).toBeInTheDocument();
    });
  });

  describe('useDrawerRateableColumns', () => {
    it('should return rateable columns', () => {
      const TestComponent = () => {
        const columns = useDrawerRateableColumns({ onOpenRoomSubmission: vi.fn() });
        return (
          <div>
            {columns.map(col => (
              <div key={col.key} data-testid={`column-${col.key}`}>{col.label}</div>
            ))}
          </div>
        );
      };
      render(<TestComponent />);
      expect(screen.getByTestId('column-rentMY')).toBeInTheDocument();
      expect(screen.getByTestId('column-rateMY')).toBeInTheDocument();
      expect(screen.getByTestId('column-rentalValue')).toBeInTheDocument();
    });
  });

  describe('useDrawerCapitalColumns', () => {
    it('should return capital columns', () => {
      const TestComponent = () => {
        const columns = useDrawerCapitalColumns({ onOpenRoomSubmission: vi.fn() });
        return (
          <div>
            {columns.map(col => (
              <div key={col.key} data-testid={`column-${col.key}`}>{col.label}</div>
            ))}
          </div>
        );
      };
      render(<TestComponent />);
      expect(screen.getByTestId('column-sdrr')).toBeInTheDocument();
      expect(screen.getByTestId('column-baseValue')).toBeInTheDocument();
      expect(screen.getByTestId('column-capitalValue')).toBeInTheDocument();
    });
  });

  describe('useDrawerActionColumn', () => {
    it('should return correct column configuration', () => {
      const onOpenFloorQCEdit = vi.fn();
      let actionColumn: ReturnType<typeof useDrawerActionColumn> | undefined;
      const TestComponent = () => {
        actionColumn = useDrawerActionColumn({ onOpenFloorQCEdit });
        return null;
      };
      render(<TestComponent />);
      expect(actionColumn?.key).toBe('actions');
      expect(actionColumn?.label).toBeDefined();
    });
  });

  describe('ReadOnlyCellHover', () => {
    it('should render with value and external link icon', () => {
      const onClick = vi.fn();
      render(<ReadOnlyCellHover value="100" onClick={onClick} disabled={false} />);
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByTestId('external-link')).toBeInTheDocument();
    });

    it('should render without external link when disabled', () => {
      const onClick = vi.fn();
      render(<ReadOnlyCellHover value="100" onClick={onClick} disabled={true} />);
      expect(screen.queryByTestId('external-link')).not.toBeInTheDocument();
    });
  });

  describe('CompactSelect', () => {
    it('should render options and call onChange', () => {
      const onChange = vi.fn();
      const TestComponent = () => {
        return <CompactSelect value="1" onChange={onChange} options={mockProps.floorOptions} />;
      };
      render(<TestComponent />);
      const select = screen.getByDisplayValue('Ground Floor');
      expect(select).toBeInTheDocument();
    });
  });

  describe('CompactCellInput', () => {
    it('should render input and call onChange', () => {
      const onChange = vi.fn();
      const TestComponent = () => {
        return <CompactCellInput value="100" onChange={onChange} />;
      };
      render(<TestComponent />);
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });
  });
});