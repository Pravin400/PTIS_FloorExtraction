import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppartmentQCSection from '@/components/modules/property-tax/ptis/appartmentQC/AppartmentQCSection';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key) => {
      if (key === 'appartmentTab') return 'residential';
      if (key === 'subTab') return 'rateable';
      return null;
    }),
    toString: vi.fn(() => 'appartmentTab=residential&subTab=rateable'),
  }),
  usePathname: () => '/test-path',
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "apartmentTabs.amenities": "Amenities",
      "apartmentTabs.commercial": "Commercial Units",
      "apartmentTabs.residential": "Residential Units",
      "apartmentTabs.rateable": "Rateable",
      "apartmentTabs.capital": "Capital",
      "apartmentTabs.dual": "Dual Method"
    };
    return map[key] || key;
  },
  useLocale: () => 'en',
}));

// Mock sub-components
vi.mock('@/components/modules/property-tax/ptis/appartmentQC/CommonPropertyTable', () => ({ default: () => <div data-testid="common-table">Common Table</div> }));
vi.mock('@/components/common', async () => {
  const actual = await vi.importActual('@/components/common');
  return {
    ...actual,
    LoadingPage: () => <div data-testid="loading-page">Loading...</div>,
  };
});

describe('AppartmentQCSection', () => {
  const mockProps = {
    initialData: {
      amenities: { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPrevious: false, hasNext: false },
      commercial: { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPrevious: false, hasNext: false },
      residential: { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPrevious: false, hasNext: false },
    },
    activeMainTab: 'residential',
    activeSubTab: 'rateable',
    locale: 'en',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });



  it('renders table component', () => {
    render(<AppartmentQCSection {...mockProps} />);
    expect(screen.getByTestId('common-table')).toBeInTheDocument();
  });
});
