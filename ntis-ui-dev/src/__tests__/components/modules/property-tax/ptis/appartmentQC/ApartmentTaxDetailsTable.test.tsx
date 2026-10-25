import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApartmentTaxDetailsTable } from '@/components/modules/property-tax/ptis/appartmentQC/ApartmentTaxDetailsTable';
import type { ApartmentTaxDetailsItems, DualMethodTaxDetails } from '@/types/apartmentQC.types';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      appartmentQC: {
        'taxDetails.title': 'Tax Details',
        'taxDetails.subtitle': 'Summary of property taxes',
        'taxDetails.method': 'Method',
        'taxDetails.propertyType': 'Property Type',
        'taxDetails.total': 'Total',
        'taxDetails.columnTotal': 'Grand Total',
        'taxDetails.noData': 'No data available',
      },
      ptis: {
        'apartmentTabs.amenities': 'Amenities',
        'apartmentTabs.commercial': 'Commercial',
        'apartmentTabs.residential': 'Residential',
        'apartmentTabs.rateable': 'Rateable Value',
        'apartmentTabs.capital': 'Capital Value',
        'apartmentTabs.dual': 'Dual Method',
        'apartmentTabs.loading': 'Loading...',
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

// Mock MasterTable component
vi.mock('@/components/common/MasterTable', () => ({
  MasterTable: ({ 
    headerExtra,
    data, 
    loading, 
    emptyText,
    columns,
  }: {
    headerExtra?: React.ReactNode;
    data: unknown[];
    loading?: boolean;
    emptyText: string;
    columns: unknown[];
  }) => (
    <div data-testid="master-table">
      {headerExtra && <div data-testid="header-extra">{headerExtra}</div>}
      {loading && <div data-testid="loading">Loading...</div>}
      {!loading && data.length === 0 && <div data-testid="empty">{emptyText}</div>}
      <div data-testid="column-count">{columns.length} columns</div>
      <div data-testid="row-count">{data.length} rows</div>
    </div>
  ),
}));

// Mock the hook utility functions
vi.mock('@/hooks/apartmentQc/useApartmentTaxDetailsTable', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/apartmentQc/useApartmentTaxDetailsTable')>('@/hooks/apartmentQc/useApartmentTaxDetailsTable');
  return actual;
});

vi.mock('@/hooks/apartmentQc/useTaxTableColumns', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/apartmentQc/useTaxTableColumns')>('@/hooks/apartmentQc/useTaxTableColumns');
  return actual;
});

/* ============================================================
   TEST DATA
 ============================================================ */

const mockTaxDetails: ApartmentTaxDetailsItems = {
  propertyId: 1,
  propertyCount: 10,
  taxAmounts: [
    { taxName: 'Property Tax', taxAmount: 1000, displayOrder: 1 },
    { taxName: 'Water Tax', taxAmount: 500, displayOrder: 2 },
  ],
};

const mockDualMethodDetails: DualMethodTaxDetails = {
  rateable: {
    propertyId: 1,
    propertyCount: 5,
    taxAmounts: [
      { taxName: 'Property Tax', taxAmount: 800, displayOrder: 1 },
    ],
  },
  capital: {
    propertyId: 1,
    propertyCount: 3,
    taxAmounts: [
      { taxName: 'Property Tax', taxAmount: 1200, displayOrder: 1 },
    ],
  },
};

/* ============================================================
   TESTS
 ============================================================ */

describe('ApartmentTaxDetailsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render MasterTable component', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={mockTaxDetails}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="rateable"
        />
      );

      expect(screen.getByTestId('master-table')).toBeInTheDocument();
    });

    it('should display header for amenities tab', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={mockTaxDetails}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="rateable"
        />
      );

      const headerExtra = screen.getByTestId('header-extra');
      expect(headerExtra).toBeInTheDocument();
      expect(headerExtra).toHaveTextContent('Tax Details');
      expect(headerExtra).toHaveTextContent('Amenities');
      expect(headerExtra).toHaveTextContent('Rateable Value');
    });

    it('should display header for commercial tab', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={mockTaxDetails}
          loading={false}
          activeMainTab="commercial"
          activeSubTab="capital"
        />
      );

      const headerExtra = screen.getByTestId('header-extra');
      expect(headerExtra).toHaveTextContent('Tax Details');
      expect(headerExtra).toHaveTextContent('Commercial');
      expect(headerExtra).toHaveTextContent('Capital Value');
    });

    it('should display header for residential tab with dual method', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={null}
          dualMethodDetails={mockDualMethodDetails}
          loading={false}
          activeMainTab="residential"
          activeSubTab="dual-method"
        />
      );

      const headerExtra = screen.getByTestId('header-extra');
      expect(headerExtra).toHaveTextContent('Tax Details');
      expect(headerExtra).toHaveTextContent('Residential');
      expect(headerExtra).toHaveTextContent('Dual Method');
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading is true', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={null}
          loading={true}
          activeMainTab="amenities"
          activeSubTab="rateable"
        />
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty message when no data', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={null}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="rateable"
        />
      );

      expect(screen.getByTestId('empty')).toHaveTextContent('No data available');
    });
  });

  describe('single method view (rateable/capital)', () => {
    it('should render 1 row for single method', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={mockTaxDetails}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="rateable"
        />
      );

      expect(screen.getByTestId('row-count')).toHaveTextContent('1 rows');
    });

    it('should show subtitle in header for rateable method', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={mockTaxDetails}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="rateable"
        />
      );

      const headerExtra = screen.getByTestId('header-extra');
      expect(headerExtra).toHaveTextContent('Summary of property taxes');
    });
  });

  describe('dual method view', () => {
    it('should render 3 rows for dual method (RV, CV, Total)', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={null}
          dualMethodDetails={mockDualMethodDetails}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="dual-method"
        />
      );

      expect(screen.getByTestId('row-count')).toHaveTextContent('3 rows');
    });

    it('should show comparison subtitle in header for dual method', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={null}
          dualMethodDetails={mockDualMethodDetails}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="dual-method"
        />
      );

      const headerExtra = screen.getByTestId('header-extra');
      expect(headerExtra).toHaveTextContent('Rateable Value');
      expect(headerExtra).toHaveTextContent('Capital Value');
    });
  });

  describe('column visibility', () => {
    it('should not show columns when there is no data', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={null}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="rateable"
        />
      );

      expect(screen.getByTestId('column-count')).toHaveTextContent('0 columns');
    });

    it('should show Method and tax columns when data exists', () => {
      render(
        <ApartmentTaxDetailsTable
          taxDetails={mockTaxDetails}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="rateable"
        />
      );

      // Method + 2 tax columns = 3 columns
      expect(screen.getByTestId('column-count')).toHaveTextContent('3 columns');
    });
  });

  describe('gradient styling', () => {
    it('should have correct wrapper class for rateable tab', () => {
      const { container } = render(
        <ApartmentTaxDetailsTable
          taxDetails={mockTaxDetails}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="rateable"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('bg-gradient-to-r');
      expect(wrapper.className).toContain('from-blue-50');
    });

    it('should have correct wrapper class for capital tab', () => {
      const { container } = render(
        <ApartmentTaxDetailsTable
          taxDetails={mockTaxDetails}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="capital"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('from-green-50');
    });

    it('should have correct wrapper class for dual-method tab', () => {
      const { container } = render(
        <ApartmentTaxDetailsTable
          taxDetails={null}
          dualMethodDetails={mockDualMethodDetails}
          loading={false}
          activeMainTab="amenities"
          activeSubTab="dual-method"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('from-purple-50');
    });
  });

  describe('props validation', () => {
    it('should handle undefined dualMethodDetails', () => {
      expect(() => 
        render(
          <ApartmentTaxDetailsTable
            taxDetails={mockTaxDetails}
            loading={false}
            activeMainTab="amenities"
            activeSubTab="rateable"
          />
        )
      ).not.toThrow();
    });

    it('should handle null taxDetails', () => {
      expect(() => 
        render(
          <ApartmentTaxDetailsTable
            taxDetails={null}
            loading={false}
            activeMainTab="amenities"
            activeSubTab="rateable"
          />
        )
      ).not.toThrow();
    });

    it('should handle all null data gracefully', () => {
      expect(() => 
        render(
          <ApartmentTaxDetailsTable
            taxDetails={null}
            dualMethodDetails={null}
            loading={false}
            activeMainTab="amenities"
            activeSubTab="dual-method"
          />
        )
      ).not.toThrow();
    });
  });
});
