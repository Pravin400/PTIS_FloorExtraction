import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IndividualOldDetailsTab } from '@/components/modules/property-tax/ptis/individual/old-details/IndividualOldDetailsTab';
import type {
  OldDetailsData,
  OldFloorDetailsData,
  OldTaxesData,
  MappedPropertyItem,
} from '@/types/ptis.types';

const mockGetIndividualOldDetailsAction = vi.fn();
const mockGetIndividualOldFloorDetailsAction = vi.fn();
const mockGetIndividualOldTaxesDetailsAction = vi.fn();
const mockGetIndividualMappedPropertiesAction = vi.fn();

vi.mock('@/app/[locale]/property-tax/ptis/individual/action', () => ({
  getIndividualOldDetailsAction: (...args: unknown[]) => mockGetIndividualOldDetailsAction(...args),
  getIndividualOldFloorDetailsAction: (...args: unknown[]) => mockGetIndividualOldFloorDetailsAction(...args),
  getIndividualOldTaxesDetailsAction: (...args: unknown[]) => mockGetIndividualOldTaxesDetailsAction(...args),
  getIndividualMappedPropertiesAction: (...args: unknown[]) => mockGetIndividualMappedPropertiesAction(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/en/property-tax/ptis/individual',
  useSearchParams: () => new URLSearchParams('propertyId=123'),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      'fields.oldZoneName': 'Old Zone Name',
      'fields.oldWardNo': 'Old Ward No',
      'fields.oldPropertyNo': 'Old Property No',
      'fields.oldPartitionNo': 'Old Partition No',
      'fields.oldEGovNo': 'Old E-Gov No',
      'fields.oldPlotNo': 'Old Plot No',
      'fields.oldPlotAreaWithUnit': 'Old Plot Area',
      'fields.oldConstructionAreaWithUnit': 'Old Const Area',
      'fields.oldALV': 'Old ALV',
      'fields.oldRV': 'Old RV',
      'fields.oldPropTax': 'Old Prop Tax',
      'fields.oldTotalTax': 'Old Total Tax',
      'actions.showMapDetails': 'Show Map Details',
      'actions.hideMapDetails': 'Hide Map Details',
      'actions.showFloorDetails': 'Show Floor Details',
      'actions.hideFloorDetails': 'Hide Floor Details',
      'actions.showOldTax': 'Show Old Tax',
      'actions.hideOldTax': 'Hide Old Tax',
      'actions.propertyMapping': 'Property Mapping',
      'oldDetails.propertyMapping': 'Property Mapping',
      'fields.oldMapDetails': 'Mapped Properties Details',
      'fields.oldFloorDetails': 'Old Floor Details',
      'fields.oldTaxDetails': 'Old Tax Details',
      'fields.wardPropPartNo': 'Ward / Prop / Part No',
      'fields.floor': 'Floor',
      'fields.year': 'Year',
      'fields.taxTotal': 'Total Tax',
    };
    const t = (key: string) => translations[key] || key;
    t.has = (key: string) => Boolean(translations[key]);
    return t;
  },
  useLocale: () => 'en',
}));

describe('IndividualOldDetailsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOldDetails: OldDetailsData = {
    oldZoneName: 'Zone 1',
    oldWardNo: '12',
    oldPropertyNo: 'P-100',
    oldPartitionNo: '0',
    oldEGovernanceNo: 'EGOV-999',
    oldPlotNo: 'Plot 42',
    oldPlotArea: '1500',
    oldConstructionArea: '1200',
    oldALV: '45000',
    oldRV: '60000',
    oldCV: '75000',
    oldPropertyTax: '5400',
    oldTotalTax: '6800',
    oldGeneralTax: '5400',
    oldConstructionYear: '2010',
    oldCarpetAreaSqMeter: '100',
    oldCarpetAreaSqFeet: '1076',
    oldBuiltupAreaSqMeter: '120',
    oldBuiltupAreaSqFeet: '1291',
    oldConstructionTypeId: 'RCC',
    oldTypeOfUseId: 'Residential',
  };

  const mockFloorData: OldFloorDetailsData[] = [
    {
      wardPropPartNo: '12 - P-100',
      floor: 'Ground',
      subFloor: '',
      assessmentYear: '2015',
      year: '2010',
      constructionType: 'RCC',
      typeOfUse: 'Residential',
      subType: 'Flat',
      carpetArea: '1076 / 100',
      builtupArea: '1291 / 120',
    },
  ];

  const mockTaxData: OldTaxesData = {
    propertyId: 123,
    taxYears: [
      {
        financeYearId: 1,
        year: 2024,
        yearCode: '2023-2024',
        rVorCV: 'RV',
        rVorCVValue: 60000,
        taxTotal: 6800,
        interest: 0,
        netTotal: 6800,
        oldWardNo: '12',
        oldPropertyNo: 'P-100',
        oldPartitionNo: '',
        taxes: [
          { taxId: 1, taxName: 'General Tax', taxAmount: 5000 },
          { taxId: 2, taxName: 'Water Tax', taxAmount: 1800 },
          { taxId: 3, taxName: 'taxtotal', taxAmount: 6800 },
        ],
      },
    ],
  };

  const mockMappedData: MappedPropertyItem[] = [
    {
      propertyId: 123,
      mappingCategory: 'Direct',
      oldZoneNo: 'Zone 1',
      oldWardNo: '12',
      oldPropertyNo: 'P-100',
      oldPartitionNo: '',
      oldEgovNo: 'EGOV-999',
      oldPropertyTypeId: 1,
      oldPlotArea: 1500,
      oldPlotNo: 'Plot 42',
      oldCSN: null,
      oldConstructionArea: 1200,
      oldConstructionYear: '2010',
      oldAssessmentYear: '2015',
      oldFloor: 'Ground',
      oldConstructionTypeOfUseId: 'RCC',
      oldUseType: 'Residential',
      oldALV: 45000,
      oldRV: 60000,
      oldGeneralTax: 5400,
      oldTotalTax: 6800,
      oldOwnerName: null,
      oldOccupierName: null,
      oldAddress: null,
      oldOwnerNameEnglish: null,
      oldOccupierNameEnglish: null,
      oldAddressEnglish: null,
    } as unknown as MappedPropertyItem,
  ];

  it('renders all 12 old details fields correctly with data', () => {
    render(
      <IndividualOldDetailsTab
        showOldFloorInfo={false}
        setShowOldFloorInfo={vi.fn()}
        showOldTaxInfo={false}
        setShowOldTaxInfo={vi.fn()}
        showOldMapInfo={false}
        setShowOldMapInfo={vi.fn()}
        oldDetailsData={mockOldDetails}
        oldFloorTableData={[]}
      />
    );

    expect(screen.getByText('Zone 1')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('P-100')).toBeInTheDocument();
    expect(screen.getByText('EGOV-999')).toBeInTheDocument();
    expect(screen.getByText('Plot 42')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('45000')).toBeInTheDocument();
    expect(screen.getByText('60000')).toBeInTheDocument();
    expect(screen.getByText('5400')).toBeInTheDocument();
    expect(screen.getByText('6800')).toBeInTheDocument();
  });

  it('renders the "Property Mapping" button and handles click', () => {
    const onPropertyMapping = vi.fn();

    render(
      <IndividualOldDetailsTab
        showOldFloorInfo={false}
        setShowOldFloorInfo={vi.fn()}
        showOldTaxInfo={false}
        setShowOldTaxInfo={vi.fn()}
        showOldMapInfo={false}
        setShowOldMapInfo={vi.fn()}
        oldDetailsData={mockOldDetails}
        oldFloorTableData={[]}
        onPropertyMapping={onPropertyMapping}
      />
    );

    const mappingBtn = screen.getByRole('button', { name: /Property Mapping/i });
    expect(mappingBtn).toBeInTheDocument();

    fireEvent.click(mappingBtn);
    expect(onPropertyMapping).toHaveBeenCalledTimes(1);
  });

  it('renders action buttons and handles floor details toggle with mutual exclusivity', () => {
    const setShowOldFloorInfo = vi.fn();
    const setShowOldTaxInfo = vi.fn();
    const setShowOldMapInfo = vi.fn();

    render(
      <IndividualOldDetailsTab
        showOldFloorInfo={false}
        setShowOldFloorInfo={setShowOldFloorInfo}
        showOldTaxInfo={false}
        setShowOldTaxInfo={setShowOldTaxInfo}
        showOldMapInfo={true}
        setShowOldMapInfo={setShowOldMapInfo}
        oldDetailsData={mockOldDetails}
        oldFloorTableData={mockFloorData}
      />
    );

    const floorBtn = screen.getByRole('button', { name: /Show Floor Details/i });
    expect(floorBtn).toBeInTheDocument();

    fireEvent.click(floorBtn);
    expect(setShowOldFloorInfo).toHaveBeenCalledWith(true);
    expect(setShowOldMapInfo).toHaveBeenCalledWith(false);
    expect(setShowOldTaxInfo).toHaveBeenCalledWith(false);
  });

  it('renders floor details table when showOldFloorInfo is true', () => {
    render(
      <IndividualOldDetailsTab
        showOldFloorInfo={true}
        setShowOldFloorInfo={vi.fn()}
        showOldTaxInfo={false}
        setShowOldTaxInfo={vi.fn()}
        showOldMapInfo={false}
        setShowOldMapInfo={vi.fn()}
        oldDetailsData={mockOldDetails}
        oldFloorTableData={mockFloorData}
      />
    );

    expect(screen.getByText('Old Floor Details')).toBeInTheDocument();
    expect(screen.getByText('Ground')).toBeInTheDocument();
    expect(screen.getByText('1076 / 100')).toBeInTheDocument();
  });

  it('renders old tax details table when showOldTaxInfo is true', () => {
    render(
      <IndividualOldDetailsTab
        showOldFloorInfo={false}
        setShowOldFloorInfo={vi.fn()}
        showOldTaxInfo={true}
        setShowOldTaxInfo={vi.fn()}
        showOldMapInfo={false}
        setShowOldMapInfo={vi.fn()}
        oldDetailsData={mockOldDetails}
        oldTaxesData={mockTaxData}
      />
    );

    expect(screen.getByText('Old Tax Details')).toBeInTheDocument();
    expect(screen.getByText('2023-2024')).toBeInTheDocument();
  });

  it('renders mapped properties table when showOldMapInfo is true', () => {
    render(
      <IndividualOldDetailsTab
        showOldFloorInfo={false}
        setShowOldFloorInfo={vi.fn()}
        showOldTaxInfo={false}
        setShowOldTaxInfo={vi.fn()}
        showOldMapInfo={true}
        setShowOldMapInfo={vi.fn()}
        oldDetailsData={mockOldDetails}
        mappedPropertiesData={mockMappedData}
      />
    );

    expect(screen.getByText('Mapped Properties Details')).toBeInTheDocument();
    expect(screen.getByText('Direct')).toBeInTheDocument();
  });

  it('calls getIndividualOldFloorDetailsAction on toggle if data is not loaded', async () => {
    mockGetIndividualOldFloorDetailsAction.mockResolvedValue({
      success: true,
      data: mockFloorData,
    });

    const setShowOldFloorInfo = vi.fn();

    render(
      <IndividualOldDetailsTab
        propertyId={123}
        showOldFloorInfo={false}
        setShowOldFloorInfo={setShowOldFloorInfo}
        showOldTaxInfo={false}
        setShowOldTaxInfo={vi.fn()}
        showOldMapInfo={false}
        setShowOldMapInfo={vi.fn()}
        oldDetailsData={mockOldDetails}
        oldFloorTableData={[]}
      />
    );

    const floorBtn = screen.getByRole('button', { name: /Show Floor Details/i });
    fireEvent.click(floorBtn);

    expect(setShowOldFloorInfo).toHaveBeenCalledWith(true);
    expect(mockGetIndividualOldFloorDetailsAction).toHaveBeenCalledWith(123);
  });

  it('fetches old details client-side when not provided via props and displays them', async () => {
    mockGetIndividualOldDetailsAction.mockResolvedValue({
      success: true,
      data: mockOldDetails,
    });

    render(
      <IndividualOldDetailsTab
        propertyId={456}
        oldFloorTableData={[]}
      />
    );

    expect(mockGetIndividualOldDetailsAction).toHaveBeenCalledWith(456);
    expect(await screen.findByText('Zone 1')).toBeInTheDocument();
    expect(await screen.findByText('P-100')).toBeInTheDocument();
  });
});

