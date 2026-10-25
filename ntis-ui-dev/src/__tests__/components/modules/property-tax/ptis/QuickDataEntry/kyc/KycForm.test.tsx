import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import KycFormView from '@/components/modules/property-tax/ptis/QuickDataEntry/kyc/KycFormView';
import { toast } from 'sonner';
import { updatePropertyKycAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Kyc/action';
import { KycDetails } from '@/types/property-kyc.types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'kyc.title': 'Owner & Contact Information',
      'kyc.ownerType': 'Owner Category',
      'kyc.titleLabel': 'Title',
      'kyc.ownerName': 'Owner Name',
      'kyc.ownerNameRegional': 'Owner Name (Regional)',
      'kyc.ownerNameEnglish': 'Owner Name',
      'kyc.propertyHolderName': 'Property Holder Name',
      'kyc.propertyHolderNameMarathi': 'Property Holder Name (Regional)',
      'kyc.propertyHolderNameEnglish': 'Property Holder Name',
      'kyc.occupierName': 'Occupier Name',
      'kyc.occupierNameMarathi': 'Occupier Name (Regional)',
      'kyc.occupierNameEnglish': 'Occupier Name',
      'kyc.shopName': 'Shop Name',
      'kyc.shopNameMarathi': 'Shop Name (Regional)',
      'kyc.shopNameEnglish': 'Shop Name',
      'kyc.address': 'Address',
      'kyc.addressMarathi': 'Address (Regional)',
      'kyc.addressEnglish': 'Address',
      'kyc.emailId': 'Email ID',
      'kyc.pinCode': 'Pin Code',
      'kyc.enterPinCode': 'Enter 6 digit pin code',
      'kyc.validation.invalidPinCode': 'Pin code must be exactly 6 digits',
      'kyc.validation.invalidName': 'Invalid name. Only letters and basic punctuation are allowed.',
      'kyc.validation.invalidEmail': 'Invalid email address.',
      'kyc.validation.invalidAddress': 'Invalid address.',
      'kyc.aadharCardNo': 'Aadhar Card No',
      'kyc.mobileNo': 'Mobile No',
      'kyc.select': 'Select',
      'kyc.enterFullName': 'Enter full name',
      'kyc.enterFullNameMarathi': 'Enter full name (Regional)',
      'kyc.enterFullNameEnglish': 'Enter full name',
      'kyc.enterOccupierNameMarathi': 'Enter occupier name (Regional)',
      'kyc.enterOccupierNameEnglish': 'Enter occupier name',
      'kyc.enterShopNameMarathi': 'Enter shop name (Regional)',
      'kyc.enterShopNameEnglish': 'Enter shop name',
      'kyc.enterAddressMarathi': 'Enter complete address (Regional)',
      'kyc.enterAddressEnglish': 'Enter complete address',
      'commonbuttonmessages.UpdateChanges': 'Update Changes',
      'footer.saving': 'Saving...',
    };
    return translations[key] || key;
  },
}));

// Mock useConfirm
vi.mock('@/components/common', async () => {
  const actual = await vi.importActual('@/components/common');
  return {
    ...actual,
    useConfirm: () => ({
      confirm: vi.fn(({ onConfirm }) => onConfirm()),
    }),
  };
});

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the action
vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Kyc/action', () => ({
  updatePropertyKycAction: vi.fn(),
}));

const mockOwnerTypeMasterList = [
  { id: 1, ownerType: 'Self', isActive: true, createdDate: '', updatedDate: null },
  { id: 2, ownerType: 'Soldier', isActive: true, createdDate: '', updatedDate: null },
];

const mockKycDetailsData = {
  propertyId: 550726,
  ownerTypeId: 1,
  ownerType: 'Self',
  adharCardNo: '223456789012',
  ownerTitle: 'Mr',
  ownerName: 'John Doe',
  ownerTitleEnglish: 'Mr',
  ownerNameEnglish: 'John Doe',
  occupierTitle: 'Mr',
  occupierName: 'Jane Doe',
  occupierTitleEnglish: 'Mr',
  occupierNameEnglish: 'Jane Doe',
  address: '123 Street',
  location: 'City',
  addressEnglish: '123 Street',
  locationEnglish: 'City',
  flatOrShopName: 'My Shop',
  flatOrShopNameEnglish: 'My Shop',
  flatOrShopNo: '101',
  flatOrShopNoEnglish: '101',
  mobileNo: '9876543210',
  emailId: 'john@example.com',
  pinCode: '123456',
};

describe('KycFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with initial data', () => {
    render(
      <KycFormView
        KycDetailsData={mockKycDetailsData as KycDetails}
        OwnerTypeMasterList={mockOwnerTypeMasterList}
        locale="en"
      />
    );

    expect(screen.getAllByDisplayValue('John Doe')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('Jane Doe')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('My Shop')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('123 Street')).toHaveLength(2);
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456')).toBeInTheDocument();

    // Check Aadhar digits
    const aadharInputs = screen.getAllByLabelText(/Aadhar Card No/i);
    expect(aadharInputs).toHaveLength(12);
    expect(aadharInputs[0]).toHaveValue('2');
    expect(aadharInputs[11]).toHaveValue('2');

    // Check Mobile digits
    const mobileInputs = screen.getAllByLabelText(/Mobile No/i);
    expect(mobileInputs).toHaveLength(10);
    expect(mobileInputs[0]).toHaveValue('9');
    expect(mobileInputs[9]).toHaveValue('0');
  });

  // Helper to support both button label queries in tests
  const getSaveButton = () =>
    screen.getByRole('button', { name: /Save Changes|Update Changes/i });

  it('disables save button initially', () => {
    render(
      <KycFormView
        KycDetailsData={mockKycDetailsData as KycDetails}
        OwnerTypeMasterList={mockOwnerTypeMasterList}
        locale="en"
      />
    );

    const submitBtn = getSaveButton();
    expect(submitBtn).toBeDisabled();
  });

  it('enables save button when data is modified', async () => {
    render(
      <KycFormView
        KycDetailsData={mockKycDetailsData as KycDetails}
        OwnerTypeMasterList={mockOwnerTypeMasterList}
        locale="en"
      />
    );

    const nameInput = screen.getByLabelText(/Owner Name \(Regional\)|Property Holder Name \(Regional\)/i);
    fireEvent.change(nameInput, { target: { value: 'John Smith' } });

    const submitBtn = getSaveButton();
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits form with updated data', async () => {
    (updatePropertyKycAction as Mock).mockResolvedValue({ success: true, message: 'Updated' });

    render(
      <KycFormView
        KycDetailsData={mockKycDetailsData as KycDetails}
        OwnerTypeMasterList={mockOwnerTypeMasterList}
        locale="en"
      />
    );

    const nameInput = screen.getByLabelText(/Owner Name \(Regional\)|Property Holder Name \(Regional\)/i);
    fireEvent.change(nameInput, { target: { value: 'John Smith' } });

    const submitBtn = getSaveButton();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updatePropertyKycAction).toHaveBeenCalled();
    });

    expect(updatePropertyKycAction).toHaveBeenCalledWith(
      mockKycDetailsData.propertyId,
      expect.objectContaining({
        ownerName: 'John Smith',
        mobileNo: '+919876543210',
        adharCardNo: '223456789012',
        pinCode: '123456',
      }),
      'en'
    );
    expect(toast.success).toHaveBeenCalledWith('Updated');
  });

  it('handles submission error correctly', async () => {
    (updatePropertyKycAction as Mock).mockResolvedValue({ success: false, error: 'Failed' });

    render(
      <KycFormView
        KycDetailsData={mockKycDetailsData as KycDetails}
        OwnerTypeMasterList={mockOwnerTypeMasterList}
        locale="en"
      />
    );

    const nameInput = screen.getByLabelText(/Owner Name \(Regional\)|Property Holder Name \(Regional\)/i);
    fireEvent.change(nameInput, { target: { value: 'John Smith' } });

    const submitBtn = getSaveButton();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed');
    });
  });

  it('validates email correctly', async () => {
    render(
      <KycFormView
        KycDetailsData={mockKycDetailsData as KycDetails}
        OwnerTypeMasterList={mockOwnerTypeMasterList}
        locale="en"
      />
    );

    const emailInput = screen.getByLabelText(/Email ID/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitBtn = getSaveButton();
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(toast.error).toHaveBeenCalledWith('Invalid email address.');
    expect(updatePropertyKycAction).not.toHaveBeenCalled();
  });
});
