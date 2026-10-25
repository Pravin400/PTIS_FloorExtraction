import { render, screen } from '@testing-library/react';
import { InventoryKpiSummary } from '@/components/modules/assets/municipal-Asset/asset-detail-view/InventoryKpiSummary';
import { vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('InventoryKpiSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with totals and kpi data', () => {
    const kpiData = [
      { id: '1', label: 'FURNITURE', count: 5, icon: 'furniture', color: 'text-blue-500', bgColor: 'bg-blue-50' },
      { id: '2', label: 'ELECTRONICS', count: 10, icon: 'electronics', color: 'text-red-500', bgColor: 'bg-red-50' },
    ];

    render(<InventoryKpiSummary totalValue={1000} totalQuantity={15} kpiData={kpiData} />);
    
    // Check totals
    expect(screen.getByText('totalCapitalValue')).toBeInTheDocument();
    expect(screen.getByText('₹ 1,000')).toBeInTheDocument();
    
    expect(screen.getByText('totalItems')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    // Check KPI categories
    expect(screen.getByText('FURNITURE')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    
    expect(screen.getByText('ELECTRONICS')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders gracefully when kpiData is empty', () => {
    render(<InventoryKpiSummary totalValue={0} totalQuantity={0} kpiData={[]} />);
    
    expect(screen.getByText('totalCapitalValue')).toBeInTheDocument();
    expect(screen.getByText('totalItems')).toBeInTheDocument();
  });
});
