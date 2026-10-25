import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Commercial from '@/components/modules/property-tax/ptis/appartmentQC/Commercial';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ locale: 'en' }),
  useSearchParams: () => ({
    get: vi.fn((key) => key === 'subTab' ? 'rateable' : null),
    toString: vi.fn(() => ''),
  }),
  usePathname: () => '/test-path',
}));

// Mock sub-components
vi.mock('@/components/modules/property-tax/ptis/appartmentQC/CommonPropertyTable', () => ({ default: () => <div data-testid="common-table">Table</div> }));

describe('Commercial Tab', () => {
  const mockProps = {
    initialData: [],
    initialTotalCount: 0,
    initialPageNumber: 1,
    initialPageSize: 10,
    initialTotalPages: 0,
    initialSearchTerm: '',
  };

  it('renders table', () => {
    render(<Commercial {...mockProps} />);
    expect(screen.getByTestId('common-table')).toBeInTheDocument();
  });
});
