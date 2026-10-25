import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SelectedPropertyTaxBreakdown } from '@/components/modules/property-tax/ptis/apartment/tables/SelectedPropertyTaxBreakdown';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === 'propertyPrefix') return `Property ${params?.label ?? ''}`;
    if (key === 'unitPrefix') return `Unit #${params?.id ?? ''}`;
    if (key === 'appliedTaxBreakdown') return `${params?.property ?? ''} Applied Tax Breakdown`;
    if (key === 'totalTaxBadge') return `TOTAL ${params?.mode ?? ''} TAX: ₹${params?.amount ?? ''}`;
    if (key === 'closeTooltip') return 'Close Tax Breakdown';
    if (key === 'calculating') return 'Calculating RV & CV taxes...';
    if (key === 'headsCount') return `(${params?.count ?? ''} heads)`;
    return key;
  },
  useLocale: () => 'en',
}));

describe('SelectedPropertyTaxBreakdown', () => {
  const mockRvTaxes = [
    { taxName: 'General Tax', taxAmount: 1000 },
    { taxName: 'Water Benefit Cess', taxAmount: 200 },
    { taxName: 'Tree Cess', taxAmount: 50 },
  ];

  const mockCvTaxes = [
    { taxName: 'Capital Value General Tax', taxAmount: 1500 },
    { taxName: 'Capital Value Water Cess', taxAmount: 300 },
  ];

  it('renders RV tax heads and total correctly', () => {
    render(
      <SelectedPropertyTaxBreakdown
        selectedPropId={101}
        propertyLabel="Flat 1"
        rvTaxes={mockRvTaxes}
        rvTotal={1250}
      />
    );

    expect(screen.getByText(/Property Flat 1 Applied Tax Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText('General Tax:')).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
    expect(screen.getByText(/TOTAL RV TAX: ₹1,250/i)).toBeInTheDocument();
  });

  it('renders CV taxes and switches tabs between RV and CV', () => {
    render(
      <SelectedPropertyTaxBreakdown
        selectedPropId={102}
        propertyLabel="Shop 5"
        rvTaxes={mockRvTaxes}
        rvTotal={1250}
        cvTaxes={mockCvTaxes}
        cvTotal={1800}
      />
    );

    expect(screen.getByRole('button', { name: /CV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /RV/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /CV/i }));

    expect(screen.getByText('Capital Value General Tax:')).toBeInTheDocument();
    expect(screen.getByText('₹1,500')).toBeInTheDocument();
    expect(screen.getByText(/TOTAL CV TAX: ₹1,800/i)).toBeInTheDocument();
  });

  it('shows loading state when calculating taxes', () => {
    render(
      <SelectedPropertyTaxBreakdown
        selectedPropId={103}
        loadingTax={true}
      />
    );

    expect(screen.getByText(/Calculating RV & CV taxes/i)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <SelectedPropertyTaxBreakdown
        selectedPropId={104}
        rvTaxes={mockRvTaxes}
        rvTotal={1250}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByTitle('Close Tax Breakdown');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
