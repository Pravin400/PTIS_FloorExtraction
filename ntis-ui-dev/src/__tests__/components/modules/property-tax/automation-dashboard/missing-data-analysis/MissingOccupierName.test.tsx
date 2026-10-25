import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MissingOccupierName from '@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Occupier-Name/MissingOccupierName';
import { MissingOccupierNameItem } from '@/types/automation-dashboard/missing-data-analysis/occupier-name/missing-occupier-name.type';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock ActionButton
vi.mock('@/components/common/ActionButton', () => ({
  Button: ({ children, ...props }: React.ComponentPropsWithoutRef<'button'>) => <button {...props}>{children}</button>,
}));

const mockData: MissingOccupierNameItem = {
  totalMissing: 350,
  zones: [
    { zoneId: 1, zoneNo: 'Z1', zoneName: 'Zone East', missingCount: 150 },
    { zoneId: 2, zoneNo: 'Z2', zoneName: 'Zone West', missingCount: 200 },
  ],
};

describe('MissingOccupierName', () => {
  it('renders total missing metric card and zone table data', () => {
    render(<MissingOccupierName serverData={mockData} />);

    expect(screen.getByText('350')).toBeInTheDocument();
    expect(screen.getByText('Z1')).toBeInTheDocument();
    expect(screen.getByText('Z2')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('filters zones when searching', () => {
    render(<MissingOccupierName serverData={mockData} />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'East' } });

    expect(screen.getByText('Z1')).toBeInTheDocument();
    expect(screen.queryByText('Z2')).not.toBeInTheDocument();
  });
});
