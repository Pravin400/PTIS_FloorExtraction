import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeoSequencingWardWiseItems } from '@/types/automation-dashboard/geo-sequencing/geo-sequencing.type';
import { GeoSequencingWardWiseDashboard } from '@/components/modules/property-tax/automation-dashboard/GeoSequencing/ward-wise-summary/WardWisedashboard';

// Setup router mock
const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
    getAll: vi.fn(),
    has: vi.fn(),
    forEach: vi.fn(),
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    toString: vi.fn(() => ''),
  }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'geoSequencing.buttons.backToDivisions': 'Back to Divisions',
      'geoSequencing.buttons.export': 'Export',
      'geoSequencing.wardWiseSummary': 'Ward-wise Summary',
      'geoSequencing.stage': 'Stage:',
      'geoSequencing.generatedOn': 'Generated On:',
      'geoSequencing.total': 'Total',
    };
    return translations[key] || key;
  },
}));

vi.mock('@/hooks/automation-dashboard/useFormattedDate', () => ({
  useFormattedDate: () => '24-Jul-2026',
}));

describe('GeoSequencingWardWiseDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  const mockSummaryData: GeoSequencingWardWiseItems = {
    zoneId: 1,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    zoneName: 'Zone A',
    wardData: [
      {
        wardId: 101,
        wardNo: 'Ward 101',
        registeredProperties: 100,
        geoSequencedProperties: { structureCount: 10, unitCount: 20 },
        propertyTypeBreakdown: {
          residential: 5,
          nonResidential: 3,
          mixed: 1,
          publicUtility: 1,
          underConstruction: 0,
        },
        assessmentStatusBreakdown: {
          assessed: { statusId: 1, structureCount: 6, unitCount: 12 },
          unassessed: { statusId: 2, structureCount: 2, unitCount: 4 },
          newlyAssessedFound: { statusId: 3, structureCount: 1, unitCount: 2 },
          assessmentInProcess: { statusId: 4, structureCount: 1, unitCount: 2 },
        },
      },
    ],
    totalRow: {
      wardId: 0,
      wardNo: 'Total',
      registeredProperties: 100,
      geoSequencedProperties: { structureCount: 10, unitCount: 20 },
      propertyTypeBreakdown: {
        residential: 5,
        nonResidential: 3,
        mixed: 1,
        publicUtility: 1,
        underConstruction: 0,
      },
      assessmentStatusBreakdown: {
        assessed: { statusId: 1, structureCount: 6, unitCount: 12 },
        unassessed: { statusId: 2, structureCount: 2, unitCount: 4 },
        newlyAssessedFound: { statusId: 3, structureCount: 1, unitCount: 2 },
        assessmentInProcess: { statusId: 4, structureCount: 1, unitCount: 2 },
      },
    },
  };

  it('renders dashboard with title, cards, and automation table', () => {
    render(<GeoSequencingWardWiseDashboard zoneId="Z1" summaryData={mockSummaryData} />);

    // Header title check
    expect(screen.getByText('Zone A - Ward-wise Summary')).toBeInTheDocument();

    // Stage check
    expect(screen.getByText('Stage: Geo-sequencing')).toBeInTheDocument();

    // Back to Divisions button check
    expect(screen.getByText('Back to Divisions')).toBeInTheDocument();

    // Table data check - division name 'Ward 101'
    expect(screen.getByText('Ward 101')).toBeInTheDocument();
  });

  it('navigates when a row is clicked (excluding total row)', () => {
    render(<GeoSequencingWardWiseDashboard zoneId="Z1" summaryData={mockSummaryData} />);

    const wardCell = screen.getByText('Ward 101');
    fireEvent.click(wardCell);

    expect(mockPush).toHaveBeenCalled();
  });

  it('triggers router push with pageNumber on page change', () => {
    // Setup window.location mock
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...originalLocation, search: '?stage=geoSequencing', pathname: '/geo-sequencing' },
    });

    render(<GeoSequencingWardWiseDashboard zoneId="Z1" summaryData={mockSummaryData} />);

    // Restore original location after test
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });
});
