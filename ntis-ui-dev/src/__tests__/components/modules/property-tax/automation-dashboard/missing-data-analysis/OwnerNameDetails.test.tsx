import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OwnerNameDetails from '@/components/modules/property-tax/automation-dashboard/missing-data-analysis/owner-name/OwnerNameDetails';
import { MissingOwnerNameItem } from '@/types/automation-dashboard/missing-data-analysis/owner-name/missing-owner-name.type';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock ActionButton
vi.mock('@/components/common/ActionButton', () => ({
  Button: ({ children, ...props }: React.ComponentPropsWithoutRef<'button'>) => <button {...props}>{children}</button>,
}));

const mockData: MissingOwnerNameItem = {
  totalMissing: 150,
  zones: [
    { zoneId: 1, zoneNo: 'Z1', zoneName: 'Zone East', missingCount: 50 },
    { zoneId: 2, zoneNo: 'Z2', zoneName: 'Zone West', missingCount: 100 },
  ],
};

describe('OwnerNameDetails', () => {
  it('renders total missing metric card and zone table data', () => {
    render(<OwnerNameDetails serverData={mockData} />);

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Z1')).toBeInTheDocument();
    expect(screen.getByText('Z2')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('filters zones when searching', () => {
    render(<OwnerNameDetails serverData={mockData} />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'East' } });

    expect(screen.getByText('Z1')).toBeInTheDocument();
    expect(screen.queryByText('Z2')).not.toBeInTheDocument();
  });
});
