import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IndividualTaxDetailsSection } from '@/components/modules/property-tax/ptis/individual/individual-tax-details/IndividualTaxDetailsSection';
import type { ApartmentTaxDetailsItem } from '@/types/property-tax/apartment';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, opts?: { type?: string; count?: number }) => {
    const map: Record<string, string> = {
      taxDetailsTab: `Tax Details (${opts?.type || ''})`,
      arrearsTab: 'Arrears',
      alv: 'ALV',
      area: 'AREA',
      changesOfUse: 'CHANGES OF USE',
      old: 'OLD:',
      new: 'NEW:',
      rv: 'RV:',
      cv: 'CV:',
      retained: 'RETAINED:',
      rvCvm: 'RV / CVM',
      beneficial: 'Beneficial',
      capitalValue: 'CAPITAL VALUE (CV)',
      rateableValue: 'RATEABLE VALUE (RV)',
      rvVsCv: 'RV vs CV',
      taxCurrent: 'TAX (CURRENT)',
      taxRetained: 'TAX (RETAINED)',
      changed: 'Changed',
      cvm: 'CVM',
    };
    if (key === 'updated') return `${opts?.count ?? 0} Updated`;
    return map[key] || key;
  },
}));

const mockTaxDetails: ApartmentTaxDetailsItem = {
  wardId: 101,
  propertyNo: 'PROP-001',
  wingMasterId: null,
  wingName: null,
  wingNo: null,
  societyName: null,
  propertyCount: 1,
  currentTaxes: [
    {
      taxType: 'RV',
      taxHeads: [
        {
          taxId: 1,
          taxName: 'General Tax',
          taxAmount: 12500,
          policyCode: 'NETTAX',
        },
        {
          taxId: 2,
          taxName: 'Water Tax',
          taxAmount: 3200,
          policyCode: 'NETTAX',
        },
        {
          taxId: 3,
          taxName: 'Drainage Tax',
          taxAmount: 1800,
          policyCode: 'NETTAX',
        },
      ],
    },
  ],
  arrears: [
    {
      taxId: 1,
      taxName: 'General Tax Arrears',
      taxAmount: 5000,
      policyCode: 'ARREARS',
    },
    {
      taxId: 2,
      taxName: 'Water Tax Arrears',
      taxAmount: 1200,
      policyCode: 'ARREARS',
    },
  ],
};
describe('IndividualTaxDetailsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no data and no wardId/propertyNo are provided', () => {
    render(<IndividualTaxDetailsSection />);

    expect(screen.getByText('taxes')).toBeInTheDocument();
    expect(screen.getByText('noTaxDetailsAvailable')).toBeInTheDocument();
    expect(screen.getByText('Tax Details (RV)')).toBeInTheDocument();
    expect(screen.getByText('Arrears')).toBeInTheDocument();
    expect(screen.getByText('Mode: Rateable Value (RV)')).toBeInTheDocument();
  });

  it('renders skeleton loader when isLoading is true', () => {
    const { container } = render(<IndividualTaxDetailsSection isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders tax details table with dynamic columns and amounts', () => {
    render(<IndividualTaxDetailsSection taxDetails={mockTaxDetails} taxMode="rateable" />);

    expect(screen.getByText('Tax Details (RV)')).toBeInTheDocument();
    expect(screen.getByText('Mode: Rateable Value (RV)')).toBeInTheDocument();

    // Tax Head Headers
    expect(screen.getByText('General Tax')).toBeInTheDocument();
    expect(screen.getByText('Water Tax')).toBeInTheDocument();
    expect(screen.getByText('Drainage Tax')).toBeInTheDocument();

    // Policy Code Row
    expect(screen.getByText('NETTAX')).toBeInTheDocument();

    // Amounts
    expect(screen.getByText('12,500')).toBeInTheDocument();
    expect(screen.getByText('3,200')).toBeInTheDocument();
    expect(screen.getByText('1,800')).toBeInTheDocument();
  });

  it('switches to Arrears tab and displays arrears breakdown', () => {
    render(<IndividualTaxDetailsSection taxDetails={mockTaxDetails} taxMode="rateable" />);

    // Arrears badge count
    expect(screen.getByText('2')).toBeInTheDocument();

    const arrearsBtn = screen.getByText('Arrears');
    fireEvent.click(arrearsBtn);

    // Arrears columns & rows
    expect(screen.getByText('General Tax Arrears')).toBeInTheDocument();
    expect(screen.getByText('Water Tax Arrears')).toBeInTheDocument();
    expect(screen.getAllByText('Arrears').length).toBeGreaterThan(0);
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
  });

  it('updates mode badge correctly for capital and dual modes', () => {
    const { rerender } = render(
      <IndividualTaxDetailsSection taxDetails={mockTaxDetails} taxMode="capital" />
    );
    expect(screen.getByText('Mode: Capital Value (CV)')).toBeInTheDocument();
    expect(screen.getByText('Tax Details (CV)')).toBeInTheDocument();

    rerender(
      <IndividualTaxDetailsSection taxDetails={mockTaxDetails} taxMode="dual" />
    );
    expect(screen.getByText('Mode: Dual Method (RV + CVM)')).toBeInTheDocument();
    expect(screen.getByText('Tax Details (Dual)')).toBeInTheDocument();
  });

  it('renders tax details when taxDetails prop is provided with wardId and propertyNo', () => {
    render(
      <IndividualTaxDetailsSection
        wardId="101"
        propertyNo="PROP-001"
        taxDetails={mockTaxDetails}
        taxMode="rateable"
      />
    );

    expect(screen.getByText('General Tax')).toBeInTheDocument();
    expect(screen.getByText('12,500')).toBeInTheDocument();
  });

  it('renders mode badge correctly based on tax mode', () => {
    const { rerender } = render(
      <IndividualTaxDetailsSection
        taxDetails={mockTaxDetails}
        taxMode="rateable"
      />
    );
    expect(screen.getByText('Mode: Rateable Value (RV)')).toBeInTheDocument();

    rerender(
      <IndividualTaxDetailsSection
        taxDetails={mockTaxDetails}
        taxMode="capital"
      />
    );
    expect(screen.getByText('Mode: Capital Value (CV)')).toBeInTheDocument();

    rerender(
      <IndividualTaxDetailsSection
        taxDetails={mockTaxDetails}
        taxMode="dual"
      />
    );
    expect(screen.getByText('Mode: Dual Method (RV + CVM)')).toBeInTheDocument();
  });

  it('filters out CC row from current taxes when CC has empty taxAmounts and only pendingYears', () => {
    const rateableTaxDetailsWithEmptyCc = {
      propertyId: 1488616,
      policies: [
        {
          policyCode: 'NETTAX',
          policyName: 'Net Tax',
          taxAmounts: [
            { taxName: 'TaxTotal', taxAmount: 38381 },
            { taxName: 'General Tax', taxAmount: 13126 },
          ],
          pendingYears: [],
        },
        {
          policyCode: 'OC',
          policyName: 'Occupancy Certificate',
          taxAmounts: [
            { taxName: 'TaxTotal', taxAmount: 38381 },
            { taxName: 'General Tax', taxAmount: 13126 },
          ],
          pendingYears: [
            {
              pendingYearId: 3,
              yearCode: '2024-25',
              policyCode: 'OC',
              taxAmounts: [{ taxName: 'TaxTotal', taxAmount: 38381 }],
              taxTotal: 38381,
            },
          ],
        },
        {
          policyCode: 'CC',
          policyName: 'Completion Certificate',
          taxAmounts: [],
          pendingYears: [
            {
              pendingYearId: 11,
              yearCode: '2022-23',
              policyCode: 'CC',
              taxAmounts: [{ taxName: 'TaxTotal', taxAmount: 57414 }],
              taxTotal: 57414,
            },
          ],
        },
      ],
    };

    render(
      <IndividualTaxDetailsSection
        rateableTaxDetails={rateableTaxDetailsWithEmptyCc}
        taxMode="rateable"
      />
    );

    // NETTAX and OC should be visible in current tab
    expect(screen.getByText('NETTAX')).toBeInTheDocument();
    expect(screen.getByText('OC')).toBeInTheDocument();

    // CC should NOT be visible in current tab because its current taxAmounts is empty
    expect(screen.queryByText('CC')).not.toBeInTheDocument();

    // Switch to Arrears tab
    fireEvent.click(screen.getByText('Arrears'));

    // CC pending year row should be present in Arrears tab
    expect(screen.getByText('CC (2022-23)')).toBeInTheDocument();
    expect(screen.getByText('57,414')).toBeInTheDocument();
  });
});

