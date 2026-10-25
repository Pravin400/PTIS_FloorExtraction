import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeoSequencingItems } from '@/types/automation-dashboard/geo-sequencing/geo-sequencing.type';
import GeoSequencingPage from '@/components/modules/property-tax/automation-dashboard/GeoSequencing/GeoSequencingPage';

// Mock next/navigation
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
  usePathname: () => '/',
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'geoSequencing.searchPlaceholder': 'Search...',
      'geoSequencing.buttons.search': 'Search',
      'geoSequencing.buttons.export': 'Export',
      'geoSequencing.total': 'Total',
    };
    return translations[key] || key;
  },
}));

describe('GeoSequencingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  const mockServerData: GeoSequencingItems = {
    zones: [
      {
        zoneId: 13,
        zoneNo: '13',
        zoneName: 'Central Zone',
        registeredProperties: 1000,
        geoSequencedProperties: { structureCount: 500, unitCount: 900 },
        propertyTypeBreakdown: {
          residential: 400,
          nonResidential: 50,
          mixed: 30,
          publicUtility: 10,
          underConstruction: 10,
        },
        assessmentStatusBreakdown: {
          assessed: { statusId: 1, structureCount: 300, unitCount: 600 },
          unassessed: { statusId: 2, structureCount: 100, unitCount: 150 },
          newlyAssessedFound: { statusId: 3, structureCount: 50, unitCount: 100 },
          assessmentInProcess: { statusId: 4, structureCount: 50, unitCount: 50 },
        },
      },
    ],
    totalRow: {
      zoneId: 0,
      zoneNo: 'Total',
      zoneName: 'Total',
      registeredProperties: 1000,
      geoSequencedProperties: { structureCount: 500, unitCount: 900 },
      propertyTypeBreakdown: {
        residential: 400,
        nonResidential: 50,
        mixed: 30,
        publicUtility: 10,
        underConstruction: 10,
      },
      assessmentStatusBreakdown: {
        assessed: { statusId: 1, structureCount: 300, unitCount: 600 },
        unassessed: { statusId: 2, structureCount: 100, unitCount: 150 },
        newlyAssessedFound: { statusId: 3, structureCount: 50, unitCount: 100 },
        assessmentInProcess: { statusId: 4, structureCount: 50, unitCount: 50 },
      },
    },
  };

  it('renders search input, search button, export button and automation table', () => {
    render(<GeoSequencingPage serverData={mockServerData} />);

    // Search inputs and button
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();

    // Table content check - Zone Division Name
    expect(screen.getByText('13 - Central Zone')).toBeInTheDocument();
  });

  it('allows user to input search term', () => {
    render(<GeoSequencingPage serverData={mockServerData} />);

    const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Central' } });

    expect(searchInput.value).toBe('Central');
  });

  it('triggers router push when clicking a row', () => {
    render(<GeoSequencingPage serverData={mockServerData} />);

    const zoneRow = screen.getByText('13 - Central Zone');
    fireEvent.click(zoneRow);

    expect(mockPush).toHaveBeenCalled();
  });
});
