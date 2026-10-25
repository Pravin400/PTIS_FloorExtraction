import Propertybasicform from '@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/Property-basic-info/Propertybasicform';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/mock-path',
  useSearchParams: () => new URLSearchParams(''),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string, options?: { fallback?: string }) => {
      if (options?.fallback) return options.fallback;
      return key;
    };
    return t;
  },
}));

// Mock custom hooks and actions
vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, unknown>),
    useToast: () => ({
      success: vi.fn(),
      error: vi.fn(),
    }),
  };
});

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: vi.fn().mockImplementation((config) => {
      if (config.onConfirm) config.onConfirm();
    }),
  }),
}));

vi.mock('@/app/[locale]/property-tax/ptis/appartmentQC/action', () => ({
  updateBasicDetailsAction: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
}));

describe('Propertybasicform Component', () => {
  const mockPropertyData = {
    id: 1,
    ownerName: 'John Doe',
    occupierName: 'Jane Doe',
    renterName: 'Renter A',
    propertyType: 1,
    bhk: '2',
    mobileNo: '9876543210',
    emailId: 'test@example.com',
    flatOrShopName: 'Test Shop',
    wingName: 'A',
    flatOrShopNo: '101',
    oldPropertyNo: '44',
    remark: 'Test remark',
    oldRV: 1000,
    newRV: 1200,
    oldTotalTax: 500,
    newTaxTotal: 600,
    oldConstructionArea: 50,
    carpetASqMtr: 60,
    oldUseType: 'Residential',
    oldConstructionType: 'RCC',
    oldCSN: 'CSN123',
    oldConstructionYear: '1990',
  };

  const mockPropertyTypes = [
    { id: 1, code: 'RES', propertyDescription: 'Residential' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with provided data', () => {
    render(<Propertybasicform propertyData={mockPropertyData} propertyTypes={mockPropertyTypes} />);
    
    // Check if initial data is rendered
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    render(<Propertybasicform propertyData={{ id: 1 }} propertyTypes={mockPropertyTypes} />);
    
    const updateButton = screen.getByRole('button', { name: /update changes/i });
    
    // We expect the button to be disabled if there are no changes,
    // so let's trigger a change first to enable it.
    const ownerInput = screen.getAllByRole('textbox')[0]; // First input is ownerName
    fireEvent.change(ownerInput, { target: { value: 'New Owner' } });
    fireEvent.change(ownerInput, { target: { value: '' } }); // Clear it to trigger validation
    
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Owner name is required')).toBeInTheDocument();
      expect(screen.getByText('Occupier name is required')).toBeInTheDocument();
      expect(screen.getByText('Flat/Shop No. is required')).toBeInTheDocument();
    });
  });
});
