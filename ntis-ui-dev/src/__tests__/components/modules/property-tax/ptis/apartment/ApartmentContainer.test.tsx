import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ApartmentContainer } from '@/components/modules/property-tax/ptis/apartment/ApartmentContainer';
import { PtisRedesignCopy } from '@/types/property-tax/apartment';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/property-tax/ptis/apartment',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}));

const mockCopy: PtisRedesignCopy = {
  title: 'Property Tax Assessment - Survey & Difference Engine',
  newSurveyTitle: 'NEW SURVEY (Current)',
  differenceEngineTitle: 'DIFFERENCE ENGINE',
  existingAssessmentTitle: 'EXISTING ASSESSMENT (Previous)',
  aiStatus: 'AI Status',
  hiddenPanelsLabel: 'HIDDEN PANELS:',
  restoreAllTables: 'Restore All Tables',
  totalUnitsLabel: 'TOTAL (9 UNITS)',
  totalDeltaLabel: 'TOTAL Δ',
  editUnitTitle: 'Edit Unit Survey Details',
  saveChanges: 'Save Changes',
  cancel: 'Cancel',
  action: 'Action',
  suggestions: {
    verifyArea: 'Verify Area',
    createNew: 'Create New',
    verify: 'Verify',
  },
  tableHeaders: {
    prop: 'PROP',
    wgFl: 'WG/FL',
    type: 'TYPE',
    flr: 'FLR',
    cyr: 'CYR',
    cty: 'CTY',
    use: 'USE',
    rent: 'RENT',
    cpt: 'CPT',
    bua: 'BUA',
    ayr: 'AYR',
    occdt: 'OCCDT',
    rtpd: 'RTPD',
    rate: 'RATE',
    rv: 'RV',
    cv: 'CV',
    tax: 'TAX',
    rvVsCvm: 'RV VS CVM',
    rttx: 'RTTX',
    pen: 'PEN',
    exmp: 'EXMP',
    disc: 'DISC',
    owner: 'OWNER',
    ocpr: 'OCPR',
    rntr: 'RNTR',
    carpetDelta: 'CARPET Δ',
    buaDelta: 'BUA Δ',
    rvDelta: 'RV Δ (₹)',
    taxDelta: 'TAX Δ (₹)',
    rtTaxDelta: 'RT TAX Δ',
    suggestion: 'SUGGESTION',
  },
};

const mockInitialData = {
  propertyDetails: {},
  kycDetails: {},
  societyDetails: {},
  buildingPermission: {},
  wardOptions: [],
  propertyOptions: [],
  rawPropertyData: [],
  oldDetails: {},
  oldFloorTableData: [],
  showOldFloorInfo: false,
  oldTaxesData: {},
  showOldTaxInfo: false,
  showOldMapInfo: false,
  discountDetails: {},
  tabHeaderInfo: {},
  mappedPropertiesData: [],
};

describe('ApartmentContainer', () => {
  it('should render all 3 panels by default', () => {
    render(
      <ApartmentContainer
        copy={mockCopy}
        initialData={mockInitialData as unknown as React.ComponentProps<typeof ApartmentContainer>['initialData']}
        initialWardId={null}
      />
    );
    expect(screen.getByText('NEW SURVEY (Current)')).toBeInTheDocument();
    expect(screen.getByText('DIFFERENCE ENGINE')).toBeInTheDocument();
    expect(screen.getByText('EXISTING ASSESSMENT (Previous)')).toBeInTheDocument();
  });
});
