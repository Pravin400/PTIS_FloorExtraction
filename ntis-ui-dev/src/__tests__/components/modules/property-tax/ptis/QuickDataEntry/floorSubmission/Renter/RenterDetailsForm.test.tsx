import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RenterDetailsForm } from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/Renter/RenterDetailsForm';
import { useRenterForm } from '@/hooks/ptis/floorSubmission/renter/useRenterForm';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: vi.fn(() => 'en'),
  useTranslations: vi.fn(() => (key: string) => key),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    back: vi.fn(),
    push: vi.fn(),
  })),
  usePathname: vi.fn(() => '/en/property-tax/ptis/QuickDataEntry/123/FloorSubmission/Renter'),
  useSearchParams: vi.fn(() => new URLSearchParams('')),
}));

// Mock the validation utility
vi.mock('@/lib/utils/renter/renter-validation', () => ({
  validateRenterForm: vi.fn(() => []),
  areDatesOverlapping: vi.fn(() => false),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the custom hook
const mockSetFormData = vi.fn();
const mockHandleSave = vi.fn();

vi.mock('@/hooks/ptis/floorSubmission/renter/useRenterForm', () => ({
  useRenterForm: vi.fn(() => ({
    formData: {
      renterName: 'John Doe',
      renterDetails: [],
      renterMast: [],
    },
    setFormData: mockSetFormData,
    isSaving: false,
    handleSave: mockHandleSave,
  })),
}));

// Mock sub-components using literal absolute paths (vi.mock is hoisted)
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/Renter/PropertyDetailsOnRenter', () => ({
  PropertyDetailsOnRenter: () => <div data-testid="property-details">Property Details</div>,
}));
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/Renter/AgreementDetails', () => ({
  __esModule: true,
  default: () => <div data-testid="agreement-details">Agreement Details</div>,
}));
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/Renter/RentManagementCard', () => ({
  RentManagementCard: () => <div data-testid="rent-management">Rent Management</div>,
}));
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/Renter/SelectedFloorDetails', () => ({
  SelectedFloorDetails: () => <div data-testid="floor-details">Floor Details</div>,
}));
vi.mock('@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/Renter/RentBreakdownDialog', () => ({
  RentBreakdownDialog: () => <div data-testid="rent-breakdown">Rent Breakdown</div>,
}));

const mockPropertyInfo = {
  propertyName: 'Test Property',
  floorNumber: '1st Floor',
  zone: 'Zone 1',
};

describe('RenterDetailsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the form correctly and handles interactions', async () => {
    // Access useRenterForm to satisfy the linter
    expect(useRenterForm).toBeDefined();

    render(
      <RenterDetailsForm
        propertyInfo={mockPropertyInfo}
        wardNo="1"
        propertyNo="101"
        partitionNo="0"
        propertyId="123"
        floorId="456"
      />
    );

    // Verify main components are present
    expect(screen.getByText('floor.renterSection.management')).toBeInTheDocument();
    expect(screen.getByTestId('property-details')).toBeInTheDocument();
    
    // Verify save button works
    const saveButton = screen.getByText('floor.renterSection.saveChanges');
    fireEvent.click(saveButton);
    expect(mockHandleSave).toHaveBeenCalled();
  });
});
