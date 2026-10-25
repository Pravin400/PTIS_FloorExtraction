import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MobileNoDetails from '@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Mobile-No/MobileNoDetails';
import { MissingMobileNoItem } from '@/types/automation-dashboard/missing-data-analysis/mobile-no/missing-mobile-no.type';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock ActionButton
vi.mock('@/components/common/ActionButton', () => ({
  Button: ({ children, ...props }: React.ComponentPropsWithoutRef<'button'>) => <button {...props}>{children}</button>,
}));

const mockData: MissingMobileNoItem = {
  totalMissing: 200,
  zones: [
    { zoneId: 1, zoneNo: 'M1', zoneName: 'Mobile Zone 1', missingCount: 80 },
    { zoneId: 2, zoneNo: 'M2', zoneName: 'Mobile Zone 2', missingCount: 120 },
  ],
};

describe('MobileNoDetails', () => {
  it('renders total missing metric card and zone table data', () => {
    render(<MobileNoDetails serverData={mockData} />);

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('M1')).toBeInTheDocument();
    expect(screen.getByText('M2')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('filters zones when searching', () => {
    render(<MobileNoDetails serverData={mockData} />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'Mobile Zone 1' } });

    expect(screen.getByText('M1')).toBeInTheDocument();
    expect(screen.queryByText('M2')).not.toBeInTheDocument();
  });
});
