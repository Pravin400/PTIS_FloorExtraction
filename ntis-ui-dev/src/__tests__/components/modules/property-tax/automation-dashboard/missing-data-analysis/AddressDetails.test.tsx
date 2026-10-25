import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AddressDetails from '@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Address/AddressDetails';
import { MissingAddressItem } from '@/types/automation-dashboard/missing-data-analysis/address/missing-address.type';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock ActionButton
vi.mock('@/components/common/ActionButton', () => ({
  Button: ({ children, ...props }: React.ComponentPropsWithoutRef<'button'>) => <button {...props}>{children}</button>,
}));

const mockData: MissingAddressItem = {
  totalMissing: 79,
  zones: [
    { zoneId: 1, zoneNo: 'UT', zoneName: 'Uthalsar', missingCount: 0 },
    { zoneId: 2, zoneNo: 'NK', zoneName: 'Naupada', missingCount: 28 },
  ],
};

describe('AddressDetails', () => {
  it('renders total missing metric card and zone table data', () => {
    render(<AddressDetails serverData={mockData} />);

    expect(screen.getByText('79')).toBeInTheDocument();
    expect(screen.getByText('UT')).toBeInTheDocument();
    expect(screen.getByText('NK')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('filters zones when searching', () => {
    render(<AddressDetails serverData={mockData} />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'Naupada' } });

    expect(screen.getByText('NK')).toBeInTheDocument();
    expect(screen.queryByText('UT')).not.toBeInTheDocument();
  });
});
