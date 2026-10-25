import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MissingPhotoPlanDetails from '@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Photo-Plan/MissingPhotoPlanDetails';
import { MissingPhotoPlanItem } from '@/types/automation-dashboard/missing-data-analysis/photo-plan/missing-photo-plan.type';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock ActionButton
vi.mock('@/components/common/ActionButton', () => ({
  Button: ({ children, ...props }: React.ComponentPropsWithoutRef<'button'>) => <button {...props}>{children}</button>,
}));

const mockData: MissingPhotoPlanItem = {
  totalGapFields: 300,
  totalPhotoMissing: 180,
  totalPlanMissing: 120,
  zones: [
    { zoneId: 1, zoneNo: 'P1', zoneName: 'Photo Zone 1', photoMissing: 100, planMissing: 50, totalMissing: 150 },
    { zoneId: 2, zoneNo: 'P2', zoneName: 'Photo Zone 2', photoMissing: 80, planMissing: 70, totalMissing: 150 },
  ],
};

describe('MissingPhotoPlanDetails', () => {
  it('renders metric cards and zone table data correctly', () => {
    render(<MissingPhotoPlanDetails serverData={mockData} />);

    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText('P2')).toBeInTheDocument();
  });

  it('filters zones when searching', () => {
    render(<MissingPhotoPlanDetails serverData={mockData} />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'Photo Zone 1' } });

    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.queryByText('P2')).not.toBeInTheDocument();
  });
});
