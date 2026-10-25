import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PropertyMasterRevenueCard } from '@/components/modules/property-tax/ptis/apartment/apartment-tabSection/components/PropertyMasterRevenueCard';
import { PropertyMasterRevenueStats } from '@/components/modules/property-tax/ptis/apartment/apartment-tabSection/components/PropertyMasterRevenueStats';
import type { PropertyPerformanceData } from '@/types/property-tax/apartment';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'revenueCard.addRevenue': 'ADD. REVENUE',
      'revenueCard.desc': 'DESC:',
      'revenueCard.oldCurrentTax': 'Old Current Tax',
      'stats.oldCurrentTax': 'Old Current Tax',
      'stats.currentTax': 'Current Tax',
      'stats.retroTax': 'Retro Tax',
      'stats.retroTaxTooltip': 'Retro Tax (Arrears)',
      'stats.totalTax': 'Total Tax',
      'stats.totalDemand': 'Total Demand',
      'stats.currentDemand': 'Current Demand',
      'stats.pendingDemand': 'Pending Demand',
      'stats.collection': 'Collection',
      'stats.totalBalance': 'Total Balance',
      'stats.total': 'Total',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

describe('PropertyMasterRevenueStats - 4-Box Layout', () => {
  const mockPerformance: PropertyPerformanceData = {
    thisAssessmentRevenue: '₹4,131',
    revenueGrowthPct: '0%',
    oldCurrentTax: '₹3,500',
    currentTax: '₹4,131',
    retroTax: '₹0',
    totalTax: '₹4,131',
    totalDemand: '₹4,131',
    currentDemand: '₹4,131',
    pendingDemand: '₹0',
    collectionAmount: '₹0',
    collectionPercent: '0%',
    totalBalance: '₹4,131',
  };

  it('renders 4 boxes in Row 1: Old Current Tax (before Current Tax), Current Tax, Retro Tax, Total Tax', () => {
    render(<PropertyMasterRevenueStats performance={mockPerformance} />);

    // Row 1 checks
    expect(screen.getAllByText('Old Current Tax').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹3,500').length).toBe(2);

    expect(screen.getAllByText('Current Tax').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Retro Tax').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Total Tax').length).toBeGreaterThan(0);
  });

  it('renders 4 boxes in Row 2: Current Demand, Pending Demand (separated), Collection, Total Balance', () => {
    render(<PropertyMasterRevenueStats performance={mockPerformance} />);

    // Row 2 checks
    expect(screen.getAllByText('Current Demand').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending Demand').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Collection').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Total Balance').length).toBeGreaterThan(0);
  });

  it('displays correct amounts across all 8 metric boxes', () => {
    render(<PropertyMasterRevenueStats performance={mockPerformance} />);

    // Total tax and balance values
    expect(screen.getAllByText('₹4,131').length).toBeGreaterThanOrEqual(4);
    // Retro tax and pending demand
    expect(screen.getAllByText('₹0').length).toBeGreaterThanOrEqual(3);
  });

  it('renders fallbacks cleanly when performance data is undefined', () => {
    render(<PropertyMasterRevenueStats performance={undefined} />);

    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThanOrEqual(8);
  });

  it('formats large numbers in Crores (Cr) to prevent ellipsis truncation while preserving full value in tooltip', () => {
    const largePerformance: PropertyPerformanceData = {
      thisAssessmentRevenue: '₹2,46,16,36,350',
      oldCurrentTax: '₹0',
      currentTax: '₹7,57,54,342',
      retroTax: '₹2,38,58,808',
      totalTax: '₹2,46,16,36,350',
      totalDemand: '₹2,46,16,36,350',
      currentDemand: '₹7,57,54,342',
      pendingDemand: '₹2,38,58,808',
      collectionAmount: '₹0',
      totalBalance: '₹2,46,16,36,350',
    };

    render(<PropertyMasterRevenueStats performance={largePerformance} />);

    // Compact Cr amounts in stat cards
    expect(screen.getAllByText('₹7.58 Cr').length).toBe(2); // currentTax & currentDemand
    expect(screen.getAllByText('₹2.39 Cr').length).toBe(2); // retroTax & pendingDemand
    expect(screen.getAllByText('₹246.16 Cr').length).toBe(4); // totalTax, totalBalance & 2 tooltip badges

    // Full amounts still preserved in the hover tooltips
    expect(screen.getAllByText('₹7,57,54,342').length).toBe(2);
    expect(screen.getAllByText('₹2,38,58,808').length).toBe(2);
    expect(screen.getAllByText('₹2,46,16,36,350').length).toBeGreaterThanOrEqual(2);
  });
});

describe('PropertyMasterRevenueCard', () => {
  const mockPerformance: PropertyPerformanceData = {
    thisAssessmentRevenue: '₹4,131',
    revenueGrowthPct: '+5%',
    oldCurrentTax: '₹3,500',
    currentTax: '₹4,131',
    retroTax: '₹0',
    totalTax: '₹4,131',
    currentDemand: '₹4,131',
    pendingDemand: '₹0',
    collectionAmount: '₹0',
    totalBalance: '₹4,131',
  };

  it('renders header, mascot, hero revenue, and all 4+4 boxes', () => {
    render(
      <PropertyMasterRevenueCard
        performance={mockPerformance}
        descriptionRegional="निवासी"
      />
    );

    expect(screen.getByText('ADD. REVENUE')).toBeInTheDocument();
    expect(screen.getByText('DESC:')).toBeInTheDocument();
    expect(screen.getByText('निवासी')).toBeInTheDocument();

    // Hero amount & growth
    expect(screen.getByText('+5%')).toBeInTheDocument();

    // 4 boxes in row 1
    expect(screen.getAllByText('Old Current Tax').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Current Tax').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Retro Tax').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Total Tax').length).toBeGreaterThan(0);

    // 4 boxes in row 2
    expect(screen.getAllByText('Current Demand').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending Demand').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Collection').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Total Balance').length).toBeGreaterThan(0);
  });
});
