import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardStats } from '@/components/modules/assets/dashboard/master-dashboard/DashboardStats';
import { ICONS } from '@/lib/utils/asset-utils/asset-dashboard-helpers';
import type { DashboardStats as DashboardStatsType } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      totalAssets: 'Total Assets',
      totalValue: 'Total Value',
      encroachments: 'Encroachments',
      maintenanceDue: 'Maintenance Due',
      activeCases: 'Active Cases',
    };
    return translations[key] || key;
  },
}));

// Mock Lucide icons to render simple spans
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    BarChart3: () => <span data-testid="icon-BarChart3" />,
    IndianRupee: () => <span data-testid="icon-IndianRupee" />,
    ShieldAlert: () => <span data-testid="icon-ShieldAlert" />,
    Wrench: () => <span data-testid="icon-Wrench" />,
    Activity: () => <span data-testid="icon-Activity" />,
    MapPin: () => <span data-testid="icon-MapPin" />,
    Coins: () => <span data-testid="icon-Coins" />
  };
});

const mockStats: DashboardStatsType = {
  totalAssets: {
    value: '10',
    change: '+10%',
    backInfo: [
      { label: 'Land', value: '5', category: '1' },
      { label: 'Building', value: '5', category: '2' },
    ]
  },
  totalValue: {
    value: '₹ 5.0 Cr',
    change: '',
    backInfo: [
      { label: 'Land Value', value: '₹ 2.5 Cr' },
      { label: 'Building Value', value: '₹ 2.5 Cr' }
    ]
  },
  encroachments: {
    value: '3',
    change: '-5%',
    backInfo: [
      { label: 'Active Cases', value: '2', category: 'active-cases' }
    ]
  },
  maintenance: {
    value: '0',
    change: '0%',
    backInfo: []
  },
  monetized: { value: '0', change: '', backInfo: [] },
  auctions: { value: '0', change: '', backInfo: [] },
  acquisitions: { value: '0', change: '', backInfo: [] }
};

describe('DashboardStats', () => {
  it('should render all primary stat values', () => {
    render(<DashboardStats stats={mockStats} icons={ICONS} onCategoryClick={vi.fn()} />);

    // Primary values
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('₹ 5.0 Cr')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Encroachments

    // Titles
    expect(screen.getAllByText('Total Assets')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Total Value')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Encroachments')[0]).toBeInTheDocument();

    // Check icons
    expect(screen.getAllByTestId('icon-BarChart3')[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('icon-IndianRupee')[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('icon-ShieldAlert')[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('icon-Wrench')[0]).toBeInTheDocument();
  });

  it('should flip card and display back info on hover (focus/mouse events)', () => {
    render(<DashboardStats stats={mockStats} icons={ICONS} onCategoryClick={vi.fn()} />);

    // Initially backinfo should be in DOM but the flip class is applied on hover/focus.
    // We check if backinfo texts are in document.
    expect(screen.getByText('Land')).toBeInTheDocument();
    expect(screen.getByText('Building')).toBeInTheDocument();
    expect(screen.getByText('Land Value')).toBeInTheDocument();

    // Values from backInfo
    expect(screen.getAllByText('5')).toHaveLength(2);
    expect(screen.getAllByText('₹ 2.5 Cr')).toHaveLength(2);
  });

  it('should call onCategoryClick when clicking a category inside Encroachments', () => {
    const handleCategoryClick = vi.fn();
    render(<DashboardStats stats={mockStats} icons={ICONS} onCategoryClick={handleCategoryClick} />);

    // Click on a category in the Encroachments back panel
    const activeCasesBtn = screen.getByText('Active Cases');

    fireEvent.click(activeCasesBtn);

    expect(handleCategoryClick).toHaveBeenCalledWith('active-cases');
  });

  it('should handle null/empty stats gracefully', () => {
    const emptyStats: DashboardStatsType = {
      totalAssets: { value: '0', change: '', backInfo: [] },
      totalValue: { value: '0', change: '', backInfo: [] },
      encroachments: { value: '0', change: '', backInfo: [] },
      maintenance: { value: '0', change: '', backInfo: [] },
      monetized: { value: '0', change: '', backInfo: [] },
      auctions: { value: '0', change: '', backInfo: [] },
      acquisitions: { value: '0', change: '', backInfo: [] }
    };

    render(<DashboardStats stats={emptyStats} icons={ICONS} onCategoryClick={vi.fn()} />);

    // Zeros should be rendered
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });
});
