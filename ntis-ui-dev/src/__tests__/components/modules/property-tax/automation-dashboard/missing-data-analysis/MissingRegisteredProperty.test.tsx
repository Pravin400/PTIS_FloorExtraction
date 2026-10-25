import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MissingRegisteredProperty from '@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Registered-Property/MissingRegisteredProperty';
import { MissingRegisteredPropertyItem } from '@/types/automation-dashboard/missing-data-analysis/registered-property/missing-registered-property.type';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock ActionButton
vi.mock('@/components/common/ActionButton', () => ({
  Button: ({ children, ...props }: React.ComponentPropsWithoutRef<'button'>) => <button {...props}>{children}</button>,
}));

const mockData: MissingRegisteredPropertyItem = {
  totalOldPropertyCount: 1000,
  totalMergedProperties: 400,
  mergeOldPropertyCount: 400,
  totalMissingOldPropertyCount: 600,
  missingOldPropertyCount: 600,
  zones: [
    {
      zoneId: 1,
      zoneNo: 'Z1',
      zoneName: 'Zone Central',
      totalOldPropertyCount: 500,
      mergeOldPropertyCount: 200,
      totalMergedProperties: 200,
      missingOldPropertyCount: 300,
      totalMissingOldPropertyCount: 300,
    },
    {
      zoneId: 2,
      zoneNo: 'Z2',
      zoneName: 'Zone Harbor',
      totalOldPropertyCount: 500,
      mergeOldPropertyCount: 200,
      totalMergedProperties: 200,
      missingOldPropertyCount: 300,
      totalMissingOldPropertyCount: 300,
    },
  ],
};

describe('MissingRegisteredProperty', () => {
  it('renders top metric cards and zone table data', () => {
    render(<MissingRegisteredProperty serverData={mockData} />);

    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('Z1')).toBeInTheDocument();
    expect(screen.getByText('Z2')).toBeInTheDocument();
  });

  it('filters zones when searching', () => {
    render(<MissingRegisteredProperty serverData={mockData} />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'Central' } });

    expect(screen.getByText('Z1')).toBeInTheDocument();
    expect(screen.queryByText('Z2')).not.toBeInTheDocument();
  });
});
