import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IndividualFloorTopNav } from '@/components/modules/property-tax/ptis/individual/individual-floor/IndividualFloorTopNav';
import { IndividualFloorIntelligence } from '@/components/modules/property-tax/ptis/individual/individual-floor/IndividualFloorIntelligence';
import { RateableTaxTable } from '@/components/modules/property-tax/ptis/individual/individual-floor/rateable/components/RateableTaxTable';
import { CapitalTaxTable } from '@/components/modules/property-tax/ptis/individual/individual-floor/capital/components/CapitalTaxTable';
import { DualMethodComparisonTable } from '@/components/modules/property-tax/ptis/individual/individual-floor/dualmethod/components/ComparisonTable';
import type { RateableValueResponse } from '@/types/rateableValue.types';
import type { CapitalValueResponse } from '@/types/capitalValue.types';
import type { DualMethodResponse } from '@/types/dualMethod.types';
import type { OldDetailsData } from '@/types/ptis.types';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/en/property-tax/ptis/individual',
  useSearchParams: () => new URLSearchParams('propertyId=501&wardNo=W01'),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const fn = (key: string, opts?: { defaultValue?: string }) => {
      const map: Record<string, string> = {
        'tabs.BuildingPermission': 'Building Permission',
        'tabs.Discount': 'Discount & Social Data',
        'tabs.OldDetails': 'Old Details',
        'valuation.rv': 'Rateable Value (RV)',
        'valuation.cvm': 'Capital Value Method (CVM)',
        'valuation.dual': 'Dual Method View (RV + CVM)',
        'comparisonTable.oldTaxes': 'Old Taxes',
        'comparisonTable.rvTaxes': 'RV Taxes',
        'comparisonTable.cvTaxes': 'CV Taxes',
        'comparisonTable.retainTaxes': 'Retained Taxes',
        'comparisonTable.total': 'Total',
        noRateableRows: 'No Floor Details Available',
        noCapitalRows: 'No Capital Floor Details Available',
        'floor.floorDetails': 'Floor Details',
        changesOfUse: 'CHANGES OF USE',
        alv: 'ALV',
        area: 'AREA',
        tax: 'TAX',
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
      if (key === 'updated') return `${(opts as { count?: number })?.count ?? 0} Updated`;
      return map[key] || opts?.defaultValue || key;
    };
    fn.has = (_key: string) => false;
    return fn;
  },
  useLocale: () => 'en',
}));

describe('IndividualFloorTopNav', () => {
  it('renders all navigation buttons correctly', () => {
    const onToggleSection = vi.fn();
    const onTaxModeChange = vi.fn();

    render(
      <IndividualFloorTopNav
        activeSection="floor"
        onToggleSection={onToggleSection}
        taxMode="rateable"
        onTaxModeChange={onTaxModeChange}
      />
    );

    expect(screen.getByText('Floor Details')).toBeInTheDocument();
    expect(screen.getByText('Building Permission')).toBeInTheDocument();
    expect(screen.getByText('Discount & Social Data')).toBeInTheDocument();
    expect(screen.getByText('Old Details')).toBeInTheDocument();

    expect(screen.getByText('Rateable Value (RV)')).toBeInTheDocument();
    expect(screen.getByText('Capital Value Method (CVM)')).toBeInTheDocument();
    expect(screen.getByText('Dual Method View (RV + CVM)')).toBeInTheDocument();
  });

  it('triggers onToggleSection when a left nav button is clicked', () => {
    const onToggleSection = vi.fn();

    render(<IndividualFloorTopNav activeSection="floor" onToggleSection={onToggleSection} />);

    fireEvent.click(screen.getByText('Building Permission'));
    expect(onToggleSection).toHaveBeenCalledWith('building');

    fireEvent.click(screen.getByText('Discount & Social Data'));
    expect(onToggleSection).toHaveBeenCalledWith('discount');

    fireEvent.click(screen.getByText('Old Details'));
    expect(onToggleSection).toHaveBeenCalledWith('oldDetails');
  });

  it('triggers onTaxModeChange and automatically selects floor tab when valuation buttons are clicked', () => {
    const onTaxModeChange = vi.fn();
    const onToggleSection = vi.fn();

    render(
      <IndividualFloorTopNav
        activeSection="floor"
        onToggleSection={onToggleSection}
        onTaxModeChange={onTaxModeChange}
      />
    );

    fireEvent.click(screen.getByText('Capital Value Method (CVM)'));
    expect(onTaxModeChange).toHaveBeenCalledWith('capital');
    expect(onToggleSection).toHaveBeenCalledWith('floor');

    fireEvent.click(screen.getByText('Dual Method View (RV + CVM)'));
    expect(onTaxModeChange).toHaveBeenCalledWith('dual');
    expect(onToggleSection).toHaveBeenCalledWith('floor');

    fireEvent.click(screen.getByText('Rateable Value (RV)'));
    expect(onTaxModeChange).toHaveBeenCalledWith('rateable');
    expect(onToggleSection).toHaveBeenCalledWith('floor');
  });
});

import {
  fetchIndividualRateableValueAction,
  fetchIndividualCapitalValueAction,
  fetchIndividualDualMethodAction,
} from '@/app/[locale]/property-tax/ptis/individual/action';

vi.mock('@/app/[locale]/property-tax/ptis/individual/action', () => ({
  fetchIndividualRateableValueAction: vi.fn().mockResolvedValue({ success: true, data: null }),
  fetchIndividualCapitalValueAction: vi.fn().mockResolvedValue({ success: true, data: null }),
  fetchIndividualDualMethodAction: vi.fn().mockResolvedValue({ success: true, data: null }),
  fetchIndividualPropertyComparisonAction: vi.fn().mockResolvedValue({ success: true, data: null }),
  getIndividualBuildingCertificatesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  fetchIndividualSocialAndDiscountDetailsAction: vi.fn().mockResolvedValue({ success: true, data: null }),
  getIndividualOldDetailsAction: vi.fn().mockResolvedValue({ success: true, data: null }),
  getIndividualOldFloorDetailsAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getIndividualOldTaxesDetailsAction: vi.fn().mockResolvedValue({ success: true, data: null }),
  getIndividualMappedPropertiesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

const mockRateableData = {
  totalAnnualRentalValue: 2050000,
  totalRateableValue: 1845000,
  totalTax: 18752,
  rateableValueDetails: [
    {
      propertyDetailsId: 1,
      floor: 'Ground Floor',
      use: 'व्यावसायिक',
      subTypeOfUse: 'Shop',
      noOfRooms: 2,
      carpetAreaSqFeet: 120.5,
      carpetAreaSqMeter: 11.2,
      builtupAreaSqFeet: 135.75,
      builtupAreaSqMeter: 12.62,
      rateableValue: 120500,
      taxTotal: 18752,
      taxable: true,
    },
    {
      propertyDetailsId: 2,
      floor: 'First Floor',
      use: 'निवासी',
      subTypeOfUse: 'Residential',
      noOfRooms: 5,
      carpetAreaSqFeet: 138.75,
      carpetAreaSqMeter: 12.89,
      builtupAreaSqFeet: 155.4,
      builtupAreaSqMeter: 14.43,
      rateableValue: 138750,
      taxTotal: 21456,
      taxable: true,
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
      noOfRooms: 2,
      carpetAreaSqFeet: 200,
      carpetAreaSqMeter: 18.58,
      builtupAreaSqFeet: 220,
      builtupAreaSqMeter: 20.44,
      capitalValue: 2750000,
      taxTotal: 16250,
      taxable: true,
    },
    {
      propertyDetailsId: 102,
      floorDescription: 'First Floor',
      typeOfUseDescription: 'Residential',
      subTypeOfUseDescription: 'Flat',
      noOfRooms: 3,
      carpetAreaSqFeet: 150,
      carpetAreaSqMeter: 13.94,
      builtupAreaSqFeet: 170,
      builtupAreaSqMeter: 15.79,
      capitalValue: 2750000,
      taxTotal: 16250,
      taxable: true,
    },
  ],
} as unknown as CapitalValueResponse;

const mockDualMethodData = {
  oldTaxes: [{ taxName: 'General Tax', taxAmount: 1000 }],
  rvTaxes: [{ taxName: 'General Tax', taxAmount: 1200 }],
  cvTaxes: [{ taxName: 'General Tax', taxAmount: 1500 }],
  retainTaxes: [{ taxName: 'General Tax', taxAmount: 1200 }],
  oldTaxesTotal: 1000,
  rvTaxesTotal: 1200,
  cvTaxesTotal: 1500,
  retainTaxesTotal: 1200,
  totalRv: 1845000,
  totalCv: 5500000,
  retainTaxTotal: 1200,
} as unknown as DualMethodResponse;

const mockOldDetailsData = {
  oldALV: '1800000',
  oldRV: '1620000',
  oldTotalTax: '16500',
  oldTypeOfUseId: 'Residential',
} as unknown as OldDetailsData;

describe('Rateable & Capital Tax Tables', () => {
  it('renders PTIS rateable table headers and empty state message when no data is provided', () => {
    render(<RateableTaxTable rateableData={null} searchParams={{}} locale="en" />);
    expect(screen.getByText('No Floor Details Available')).toBeInTheDocument();
  });

  it('renders rateable floor rows dynamically when rateableData is provided', () => {
    render(<RateableTaxTable rateableData={mockRateableData} searchParams={{}} locale="en" />);

    expect(screen.getAllByText('Ground Floor').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('First Floor').length).toBeGreaterThanOrEqual(1);
  });

  it('renders capital mode floor rows and headers when capitalData is provided', () => {
    render(<CapitalTaxTable capitalData={mockCapitalData} searchParams={{}} locale="en" />);

    expect(screen.getAllByText('Commercial').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Office').length).toBeGreaterThanOrEqual(1);
  });

  it('renders dual mode comparison table when dualMethodData is provided', () => {
    render(<DualMethodComparisonTable dualMethodData={mockDualMethodData} locale="en" />);
    expect(screen.getAllByText('Old Taxes').length).toBeGreaterThanOrEqual(1);
  });
});

describe('IndividualFloorIntelligence', () => {
  it('renders top nav and comparison table in floor mode by default', () => {
    render(<IndividualFloorIntelligence propertyId={123} wardNo="MM11" />);
    expect(screen.getByText('Floor Details')).toBeInTheDocument();
  });

  it('switches to building permission section when clicked', async () => {
    render(<IndividualFloorIntelligence propertyId={123} wardNo="MM11" />);

    fireEvent.click(screen.getByText('Building Permission'));
    await waitFor(() => {
      expect(screen.getByText('BUILDING PERMISSION (Certificates & Clearances)')).toBeInTheDocument();
    });
  });

  it('renders floor details section correctly in rateable mode when data is passed', () => {
    render(
      <IndividualFloorIntelligence
        propertyId={123}
        wardNo="MM11"
        rateableData={mockRateableData}
        oldDetailsData={mockOldDetailsData}
      />
    );

    expect(screen.getAllByText('Ground Floor').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('First Floor').length).toBeGreaterThanOrEqual(1);
  });

  it('renders summary cards and table correctly for capital valuation mode', () => {
    render(
      <IndividualFloorIntelligence
        propertyId={123}
        wardNo="MM11"
        taxMode="capital"
        capitalData={mockCapitalData}
        oldDetailsData={mockOldDetailsData}
      />
    );

    expect(screen.getAllByText('Commercial').length).toBeGreaterThanOrEqual(1);
  });

  it('renders dual table correctly for dual valuation mode', () => {
    render(
      <IndividualFloorIntelligence
        propertyId={123}
        wardNo="MM11"
        taxMode="dual"
        rateableData={mockRateableData}
        capitalData={mockCapitalData}
        dualMethodData={mockDualMethodData}
        oldDetailsData={mockOldDetailsData}
      />
    );

    expect(screen.getAllByText('Dual Method View (RV + CVM)').length).toBeGreaterThanOrEqual(1);
  });

  it('automatically selects floor details tab and fetches capital value API when Capital Value button is clicked', async () => {
    const onCapitalDataLoaded = vi.fn();
    render(
      <IndividualFloorIntelligence
        propertyId={123}
        wardNo="MM11"
        onCapitalDataLoaded={onCapitalDataLoaded}
      />
    );

    // Switch away to building permission
    fireEvent.click(screen.getByText('Building Permission'));
    await waitFor(() => {
      expect(screen.getByText('BUILDING PERMISSION (Certificates & Clearances)')).toBeInTheDocument();
    });

    // Click Capital Value Method (CVM)
    fireEvent.click(screen.getByText('Capital Value Method (CVM)'));

    // Building permission must be closed, floor section is selected
    expect(screen.queryByText('BUILDING PERMISSION (Certificates & Clearances)')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(fetchIndividualCapitalValueAction).toHaveBeenCalledWith(123);
    });
  });

  it('automatically selects floor details tab and fetches dual method API when Dual Method button is clicked', async () => {
    const onDualMethodDataLoaded = vi.fn();
    render(
      <IndividualFloorIntelligence
        propertyId={123}
        wardNo="MM11"
        onDualMethodDataLoaded={onDualMethodDataLoaded}
      />
    );

    // Switch away to discount
    fireEvent.click(screen.getByText('Discount & Social Data'));

    // Click Dual Method View (RV + CVM)
    fireEvent.click(screen.getByText('Dual Method View (RV + CVM)'));

    // Floor section is selected and Dual Method API is called
    await waitFor(() => {
      expect(fetchIndividualDualMethodAction).toHaveBeenCalledWith(123);
    });
  });

  it('automatically selects floor details tab and fetches rateable value API when Rateable Value button is clicked', async () => {
    const onRateableDataLoaded = vi.fn();
    render(
      <IndividualFloorIntelligence
        propertyId={123}
        wardNo="MM11"
        onRateableDataLoaded={onRateableDataLoaded}
      />
    );

    // Switch away to building permission
    fireEvent.click(screen.getByText('Building Permission'));
    await waitFor(() => {
      expect(screen.getByText('BUILDING PERMISSION (Certificates & Clearances)')).toBeInTheDocument();
    });

    // Click Rateable Value (RV)
    fireEvent.click(screen.getByText('Rateable Value (RV)'));

    // Building permission must be closed, floor section is selected
    expect(screen.queryByText('BUILDING PERMISSION (Certificates & Clearances)')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(fetchIndividualRateableValueAction).toHaveBeenCalledWith(123);
    });
  });

  it('renders separate tables for each valuation method and not in a single merged table', () => {
    // 1. Rateable mode: rateable rows appear
    const { unmount: unmount1 } = render(
      <IndividualFloorIntelligence
        propertyId={123}
        wardNo="MM11"
        taxMode="rateable"
        rateableData={mockRateableData}
      />
    );
    expect(screen.getAllByText('Ground Floor').length).toBeGreaterThanOrEqual(1);
    unmount1();

    // 2. Capital mode: capital data appears
    const { unmount: unmount2 } = render(
      <IndividualFloorIntelligence
        propertyId={123}
        wardNo="MM11"
        taxMode="capital"
        capitalData={mockCapitalData}
      />
    );
    expect(screen.getAllByText('Commercial').length).toBeGreaterThanOrEqual(1);
    unmount2();

    // 3. Dual mode: comparison table appears
    const { unmount: unmount3 } = render(
      <IndividualFloorIntelligence
        propertyId={123}
        wardNo="MM11"
        taxMode="dual"
        dualMethodData={mockDualMethodData}
      />
    );
    expect(screen.getAllByText('Old Taxes').length).toBeGreaterThanOrEqual(1);
    unmount3();
  });
});
