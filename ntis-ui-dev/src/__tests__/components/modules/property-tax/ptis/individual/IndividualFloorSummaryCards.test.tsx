import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IndividualFloorSummaryCards } from '@/components/modules/property-tax/ptis/individual/individual-floor/IndividualFloorSummaryCards';
import type { RateableValueResponse } from '@/types/rateableValue.types';
import type { CapitalValueResponse } from '@/types/capitalValue.types';
import type { DualMethodResponse } from '@/types/dualMethod.types';
import type { PropertyComparisonResponse } from '@/types/propertyComparison.types';
import type { OldDetailsData } from '@/types/ptis.types';

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, opts?: { count?: number }) => {
    if (namespace === 'common' || key === 'yes' || key === 'no') {
      if (key === 'yes') return 'Yes';
      if (key === 'no') return 'No';
    }
    const map: Record<string, string> = {
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
      yes: 'Yes',
      no: 'No',
    };
    if (key === 'updated') return `${opts?.count ?? 0} Updated`;
    return map[key] || key;
  },
}));

const mockRateableData = {
  totalAnnualRentalValue: 2050000,
  totalRateableValue: 1845000,
  totalTax: 18752,
  rateableValueDetails: [
    {
      propertyDetailsId: 1,
      floor: 'Ground Floor',
      use: 'Commercial',
      subTypeOfUse: 'Shop',
      annualRentalValue: 1000000,
      rateableValue: 900000,
      taxTotal: 9000,
    },
    {
      propertyDetailsId: 2,
      floor: 'First Floor',
      use: 'Residential',
      subTypeOfUse: 'Flat',
      annualRentalValue: 1050000,
      rateableValue: 945000,
      taxTotal: 9752,
    },
  ],
} as unknown as RateableValueResponse;

const mockCapitalData = {
  totalCapitalValue: 5500000,
  totalTax: 32500,
  items: [
    {
      propertyDetailsId: 101,
      floorDescription: 'Ground Floor',
      typeOfUseDescription: 'Commercial',
      subTypeOfUseDescription: 'Office',
      capitalValue: 2750000,
      taxTotal: 16250,
    },
    {
      propertyDetailsId: 102,
      floorDescription: 'First Floor',
      typeOfUseDescription: 'Residential',
      subTypeOfUseDescription: 'Flat',
      capitalValue: 2750000,
      taxTotal: 16250,
    },
  ],
} as unknown as CapitalValueResponse;

const mockDualMethodData = {
  oldTaxesTotal: 1000,
  rvTaxesTotal: 1200,
  cvTaxesTotal: 1500,
  retainTaxesTotal: 1200,
  totalRv: 1845000,
  totalCv: 5500000,
  retainTaxTotal: 1200,
} as unknown as DualMethodResponse;

const mockOldDetailsData = {
  oldPlotArea: '100',
  oldALV: '1800000',
  oldRV: '1620000',
  oldCV: '5000000',
  oldTotalTax: '16500',
  oldTypeOfUseId: 'Residential',
} as unknown as OldDetailsData;

const mockComparisonData = {
  area: { old: 100, new: 120, change: 20, unit: 'sq.ft' },
  changeOfUse: { oldUse: 'Residential', newUse: 'Commercial', hasChanged: true },
  alv: { old: 1800000, new: 2050000, changePercent: 13.89 },
  rv: { old: 1620000, new: 1845000, changePercent: 13.89 },
  cv: { old: 5000000, new: 5500000, changePercent: 10.0 },
  tax: { old: 16500, new: 18752, changePercent: 13.65 },
} as unknown as PropertyComparisonResponse;

describe('IndividualFloorSummaryCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary cards with default rateable valuation mode including ALV', () => {
    render(
      <IndividualFloorSummaryCards
        rateableData={mockRateableData}
        oldDetailsData={mockOldDetailsData}
      />
    );

    expect(screen.getByText('AREA')).toBeInTheDocument();
    expect(screen.getByText('CHANGES OF USE')).toBeInTheDocument();
    expect(screen.getByText('ALV')).toBeInTheDocument();
    expect(screen.getByText('RATEABLE VALUE (RV)')).toBeInTheDocument();
    expect(screen.getByText('TAX (CURRENT)')).toBeInTheDocument();

    expect(screen.getByText('₹18,00,000')).toBeInTheDocument();
    expect(screen.getByText('₹20,50,000')).toBeInTheDocument();
    expect(screen.getByText('₹16,20,000')).toBeInTheDocument();
    expect(screen.getByText('₹18,45,000')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('hides ALV card when taxMode is capital valuation mode', () => {
    render(
      <IndividualFloorSummaryCards
        taxMode="capital"
        capitalData={mockCapitalData}
        oldDetailsData={mockOldDetailsData}
      />
    );

    expect(screen.getByText('AREA')).toBeInTheDocument();
    expect(screen.getByText('CHANGES OF USE')).toBeInTheDocument();
    expect(screen.queryByText('ALV')).not.toBeInTheDocument();
    expect(screen.getByText('CAPITAL VALUE (CV)')).toBeInTheDocument();
    expect(screen.getByText('TAX (CURRENT)')).toBeInTheDocument();

    expect(screen.getByText('₹55,00,000')).toBeInTheDocument();
    expect(screen.getByText('₹32,500')).toBeInTheDocument();
  });

  it('renders summary cards with dual method mode', () => {
    render(
      <IndividualFloorSummaryCards
        taxMode="dual"
        rateableData={mockRateableData}
        capitalData={mockCapitalData}
        dualMethodData={mockDualMethodData}
        oldDetailsData={mockOldDetailsData}
      />
    );

    expect(screen.getByText('ALV')).toBeInTheDocument();
    expect(screen.getByText('RV vs CV')).toBeInTheDocument();
    expect(screen.getByText('TAX (RETAINED)')).toBeInTheDocument();
    expect(screen.getByText('RV / CVM')).toBeInTheDocument();
    expect(screen.getByText('Beneficial')).toBeInTheDocument();
    expect(screen.getByText('₹18,45,000')).toBeInTheDocument();
    expect(screen.getByText('₹55,00,000')).toBeInTheDocument();
  });

  it('renders comparison data when provided', () => {
    render(
      <IndividualFloorSummaryCards
        comparisonData={mockComparisonData}
        taxMode="rateable"
      />
    );

    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.getByText('120.00')).toBeInTheDocument();
    expect(screen.getByText('+20.00')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('renders skeleton cards when isLoading is true', () => {
    const { container } = render(
      <IndividualFloorSummaryCards
        isLoading={true}
        taxMode="rateable"
      />
    );

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBe(5);
  });

  it('renders 4 skeleton cards when isLoading is true in capital tax mode', () => {
    const { container } = render(
      <IndividualFloorSummaryCards
        isLoading={true}
        taxMode="capital"
      />
    );

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBe(4);
  });
});
