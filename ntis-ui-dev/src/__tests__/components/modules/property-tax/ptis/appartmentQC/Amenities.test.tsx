import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Amenities from '@/components/modules/property-tax/ptis/appartmentQC/Amenities';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ locale: 'en' }),
  usePathname: () => '/test',
  useSearchParams: () => ({
    get: vi.fn((key) => key === 'subTab' ? 'rateable' : null),
    toString: vi.fn(() => ''),
  }),
}));

// Mock sub-components
vi.mock('@/components/modules/property-tax/ptis/appartmentQC/CommonPropertyTable', () => ({ default: () => <div data-testid="common-table">Table</div> }));

describe('Amenities Tab', () => {
  it('renders table and tax details', () => {
    render(
      <Amenities 
        initialData={[]} 
        initialTotalCount={0}
        initialPageNumber={1}
        initialPageSize={10}
        initialTotalPages={1}
        initialSearchTerm=""
      />
    );
    expect(screen.getByTestId('common-table')).toBeInTheDocument();
  });
});
