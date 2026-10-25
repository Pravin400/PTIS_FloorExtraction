import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ShopNameDetails from '@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Shop-name/ShopNameDetails';
import { MissingShopNameItem } from '@/types/automation-dashboard/missing-data-analysis/shop-name/missing-shop-name';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock ActionButton
vi.mock('@/components/common/ActionButton', () => ({
  Button: ({ children, ...props }: React.ComponentPropsWithoutRef<'button'>) => <button {...props}>{children}</button>,
}));

const mockData: MissingShopNameItem = {
  totalMissing: 500,
  zones: [
    { zoneId: 1, zoneNo: 'Z1', zoneName: 'Zone North', missingCount: 200 },
    { zoneId: 2, zoneNo: 'Z2', zoneName: 'Zone South', missingCount: 300 },
  ],
};

describe('ShopNameDetails', () => {
  it('renders total missing metric card and zone table data', () => {
    render(<ShopNameDetails serverData={mockData} />);

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Z1')).toBeInTheDocument();
    expect(screen.getByText('Z2')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('filters zones when searching', () => {
    render(<ShopNameDetails serverData={mockData} />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'North' } });

    expect(screen.getByText('Z1')).toBeInTheDocument();
    expect(screen.queryByText('Z2')).not.toBeInTheDocument();
  });
});
