import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaxationBreakdownForm from '@/components/modules/property-tax/ptis/QuickDataEntry/old-details/TaxationBreakdown/TaxationBreakdownForm';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { saveOldTaxesDetailsAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/taxation-breakdown/action';

import { OldTaxesDetails } from '@/types/OldDetails/property-old-details.types';

// Mock dependencies
vi.mock('next-intl', () => {
  const useTranslations = (namespace: string) => {
    const t = (key: string) => `${namespace}.${key}`;
    t.has = () => false;
    return t;
  };
  return {
    useTranslations,
    useLocale: () => 'en',
  };
});

vi.mock('next/navigation', () => ({
  useParams: () => ({ propertyId: '123', locale: 'en' }),
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: vi.fn(),
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/taxation-breakdown/action', () => ({
  saveOldTaxesDetailsAction: vi.fn(),
}));

describe('TaxationBreakdownForm Component', () => {
  const mockConfirm = vi.fn();
  const mockInitialData = {
    propertyId: 123,
    taxYears: [
      {
        year: 2023,
        financeYearId: 5,
        yearCode: '23-24',
        taxes: [
          { taxId: 1, taxName: 'Property Tax', taxAmount: 1000 },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConfirm).mockReturnValue({ confirm: mockConfirm } as unknown as { confirm: Mock });
  });

  it('renders correctly with initial data', () => {
    render(<TaxationBreakdownForm initialData={mockInitialData as unknown as OldTaxesDetails} />);
    
    expect(screen.getByText('quickDataEntry.oldDetails.taxationBreakdown.title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Property Tax')).toHaveValue('1000');
    expect(screen.getByText('Property Tax')).toBeInTheDocument();
  });

  it('allows changing tax amount', () => {
    render(<TaxationBreakdownForm initialData={mockInitialData as unknown as OldTaxesDetails} />);
    
    const taxInput = screen.getByPlaceholderText('Property Tax');
    fireEvent.change(taxInput, { target: { value: '2000' } });
    
    expect(taxInput).toHaveValue('2000');
  });

  it('calls confirm dialog when update button is clicked', () => {
    render(<TaxationBreakdownForm initialData={mockInitialData as unknown as OldTaxesDetails} />);
    
    // Modify a field to enable the update button
    const taxInput = screen.getByPlaceholderText('Property Tax');
    fireEvent.change(taxInput, { target: { value: '2000' } });

    const updateButton = screen.getByRole('button', { name: /quickDataEntry.commonbuttonmessages.UpdateChanges/i });
    fireEvent.click(updateButton);
    
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it('triggers API call and shows success toast on successful confirmation', async () => {
    vi.mocked(saveOldTaxesDetailsAction).mockResolvedValue({ success: true, data: {} as unknown } as unknown as Awaited<ReturnType<typeof saveOldTaxesDetailsAction>>);
    
    // Simulate onConfirm call
    mockConfirm.mockImplementation(({ onConfirm }: { onConfirm: () => void }) => onConfirm());
    
    render(<TaxationBreakdownForm initialData={mockInitialData as unknown as OldTaxesDetails} />);
    
    // Modify a field to enable the update button
    const taxInput = screen.getByPlaceholderText('Property Tax');
    fireEvent.change(taxInput, { target: { value: '2000' } });

    const updateButton = screen.getByRole('button', { name: /quickDataEntry.commonbuttonmessages.UpdateChanges/i });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(saveOldTaxesDetailsAction).toHaveBeenCalled();
    });
  });
});
