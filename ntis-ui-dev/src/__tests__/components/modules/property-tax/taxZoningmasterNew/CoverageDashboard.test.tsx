import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CoverageDashboard from '@/components/modules/property-tax/taxZoningmasterNew/CoverageDashboard';
import type { TaxZoningCoverage } from '@/types/taxZoningRange.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

const baseCoverage: TaxZoningCoverage = {
  totalProperties: 1000,
  coveredProperties: 750,
  pendingProperties: 250,
  zoneWiseCounts: [
    { taxZoneId: 1, taxZoneNo: 'Z1', count: 400 },
    { taxZoneId: 2, taxZoneNo: 'Z2', count: 350 },
  ],
};

describe('CoverageDashboard', () => {
  it('renders total, covered and pending property counts', () => {
    render(<CoverageDashboard coverage={baseCoverage} />);
    expect(screen.getByText(/1,?000/)).toBeInTheDocument();
    expect(screen.getByText(/750/)).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it('renders coverage percentage rounded to 2 decimals', () => {
    render(<CoverageDashboard coverage={baseCoverage} />);
    // 750/1000 * 100 = 75.00
    expect(screen.getByText('75.00%')).toBeInTheDocument();
  });

  it('renders each zone taxZoneNo and count', () => {
    render(<CoverageDashboard coverage={baseCoverage} />);
    expect(screen.getByText(/Z1/)).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText(/Z2/)).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
  });

  it('renders noZoneData text when zoneWiseCounts is empty', () => {
    render(<CoverageDashboard coverage={{ ...baseCoverage, zoneWiseCounts: [] }} />);
    expect(screen.getByText('noZoneData')).toBeInTheDocument();
  });

  it('renders 0.00% when totalProperties is 0 without dividing by zero', () => {
    const zeroCoverage: TaxZoningCoverage = {
      totalProperties: 0,
      coveredProperties: 0,
      pendingProperties: 0,
      zoneWiseCounts: [],
    };
    render(<CoverageDashboard coverage={zeroCoverage} />);
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });
});
