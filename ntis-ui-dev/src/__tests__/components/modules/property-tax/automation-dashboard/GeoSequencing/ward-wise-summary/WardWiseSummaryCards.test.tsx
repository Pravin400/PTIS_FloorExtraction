import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WardWiseSummaryCards } from '@/components/modules/property-tax/automation-dashboard/GeoSequencing/ward-wise-summary/WardWiseSummaryCards';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'geoSequencing.cards.totalStructure': 'TOTAL STRUCTURE',
      'geoSequencing.cards.totalUnits': 'TOTAL UNITS',
      'geoSequencing.cards.assessed': 'ASSESSED',
      'geoSequencing.cards.unassessed': 'UNASSESSED',
      'geoSequencing.wardWiseTable': 'WARD WISE TABLE',
    };
    return translations[key] || key;
  },
}));

describe('WardWiseSummaryCards Component', () => {
  it('renders nothing when data is not provided', () => {
    const { container } = render(<WardWiseSummaryCards />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all summary cards and section header when data is provided', () => {
    const mockData = {
      totalStructure: 150,
      totalUnits: 300,
      assessed: 100,
      unassessed: 50,
      formattedStage: 'Geo-sequencing',
    };

    render(<WardWiseSummaryCards data={mockData} />);

    // Check card headers
    expect(screen.getByText('TOTAL STRUCTURE')).toBeInTheDocument();
    expect(screen.getByText('TOTAL UNITS')).toBeInTheDocument();
    expect(screen.getByText('ASSESSED')).toBeInTheDocument();
    expect(screen.getByText('UNASSESSED')).toBeInTheDocument();

    // Check values
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    // Check table section header
    expect(screen.getByRole('heading', { name: /Geo-sequencing - WARD WISE TABLE/i })).toBeInTheDocument();
  });
});
