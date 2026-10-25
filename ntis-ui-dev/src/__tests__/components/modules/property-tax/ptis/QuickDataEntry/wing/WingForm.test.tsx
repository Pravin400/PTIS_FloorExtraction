import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import WingForm from '@/components/modules/property-tax/ptis/QuickDataEntry/wing/WingForm';
import { SocietyDetailItem } from '@/types/zone-master/properties/societyDetails.types';
import { WingItem } from '@/types/zone-master/properties/wing.types';
import { toast } from 'sonner';
import { updateApartmentQcWingDetailsAction } from '@/app/[locale]/property-tax/ptis/apartment/action';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'wing.title': 'Wing Details & Management Information',
      'wing.selectWing': 'Select Wing',
      'wing.wingName': 'Wing Name',
      'wing.wingNamePlaceholder': 'Enter wing name (e.g. A Wing)',
      'wing.managerName': 'Manager Name (Regional)',
      'wing.managerNamePlaceholder': 'उदा. भूषण',
      'wing.managerNameEnglish': 'Manager Name',
      'wing.managerNameEnglishPlaceholder': 'e.g. Bhushan',
      'wing.managerMobileNo': 'Manager Mobile No',
      'wing.managerMobileNoPlaceholder': 'Enter 10 digit mobile number',
      'wing.managerEmailId': 'Manager Email ID',
      'wing.managerEmailIdPlaceholder': 'e.g. manager@example.com',
      'wing.secretaryName': 'Secretary Name (Regional)',
      'wing.secretaryNamePlaceholder': 'उदा. अमित',
      'wing.secretaryNameEnglish': 'Secretary Name',
      'wing.secretaryNameEnglishPlaceholder': 'e.g. Amit',
      'wing.secretaryMobileNo': 'Secretary Mobile No',
      'wing.secretaryMobileNoPlaceholder': 'Enter 10 digit mobile number',
      'wing.secretaryEmailId': 'Secretary Email ID',
      'wing.secretaryEmailIdPlaceholder': 'e.g. secretary@example.com',
      'building.selectWing': 'SELECT WING',
      'commonbuttonmessages.UpdateChanges': 'Update Changes',
      'wing.saving': 'Saving...',
      'wing.success.wingUpdated': 'Wing details updated successfully!',
      'wing.validation.wingNameRequired': 'Wing name is required.',
      'wing.validation.invalidManagerEmail': 'Invalid Manager Email address format.',
      'wing.validation.invalidSecretaryEmail': 'Invalid Secretary Email address format.',
      'wing.validation.invalidManagerMobile': 'Manager Mobile Number must be 10 digits.',
      'wing.validation.invalidSecretaryMobile': 'Secretary Mobile Number must be 10 digits.',
    };
    return translations[key] || key;
  },
}));

const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ locale: 'en', propertyId: '123' }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/property-tax/ptis/apartment/action', () => ({
  updateApartmentQcWingDetailsAction: vi.fn(),
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: vi.fn((options) => {
      if (options.onConfirm) {
        options.onConfirm();
      }
    }),
  }),
}));

describe('WingForm', () => {
  const mockSocietyWings: SocietyDetailItem[] = [
    {
      id: 101,
      propertyId: 123,
      wingId: 1,
      wingNo: 'A',
      wingName: 'A Wing',
      managerName: 'भूषण पाटील',
      managerNameEnglish: 'Bhushan Patil',
      managerMobileNo: '9876543211',
      managerEmailId: 'manager@example.com',
      secretaryName: 'अमित जोशी',
      secretaryNameEnglish: 'Amit Joshi',
      secretaryMobileNo: '9876543210',
      secretaryEmailId: 'secretary@example.com',
      societyName: 'Gokul Dham',
      societyAddress: 'Station Road',
      landOwnerName: 'Owner',
      builderName: 'Builder',
      landOwnerNameEnglish: 'Owner',
      builderNameEnglish: 'Builder',
      societyNameEnglish: 'Gokul Dham',
      societyAddressEnglish: 'Station Road',
      societyEmailId: 'gokul@example.com',
      markedForDeletion: false,
      isActive: true,
      createdDate: '2026-01-01',
      updatedDate: null,
    },
    {
      id: 102,
      propertyId: 123,
      wingId: 2,
      wingNo: 'B',
      wingName: 'B Wing',
      managerName: 'राहुल सावंत',
      managerNameEnglish: 'Rahul Sawant',
      managerMobileNo: '9988776655',
      managerEmailId: 'b_manager@example.com',
      secretaryName: 'संदीप माने',
      secretaryNameEnglish: 'Sandeep Mane',
      secretaryMobileNo: '9988776644',
      secretaryEmailId: 'b_secretary@example.com',
      societyName: 'Gokul Dham',
      societyAddress: 'Station Road',
      landOwnerName: 'Owner',
      builderName: 'Builder',
      landOwnerNameEnglish: 'Owner',
      builderNameEnglish: 'Builder',
      societyNameEnglish: 'Gokul Dham',
      societyAddressEnglish: 'Station Road',
      societyEmailId: 'gokul@example.com',
      markedForDeletion: false,
      isActive: true,
      createdDate: '2026-01-01',
      updatedDate: null,
    },
  ];

  const mockWingMaster: WingItem[] = [
    { id: 1, wingNo: 'A', isActive: true, sequenceNo: 1, createdDate: '2026-01-01', updatedDate: null },
    { id: 2, wingNo: 'B', isActive: true, sequenceNo: 2, createdDate: '2026-01-01', updatedDate: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all 9 wing fields and header correctly in the drawer', () => {
      render(
        <WingForm
          propertyId={123}
          locale="en"
          initialWingDetailId={101}
          societyWings={mockSocietyWings}
          wingMaster={mockWingMaster}
        />
      );

      expect(screen.getByText('Wing Details & Management Information')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter wing name (e.g. A Wing)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('उदा. भूषण')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. Bhushan')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. manager@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('उदा. अमित')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. Amit')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. secretary@example.com')).toBeInTheDocument();

      const wingNameInput = screen.getByPlaceholderText('Enter wing name (e.g. A Wing)') as HTMLInputElement;
      expect(wingNameInput.value).toBe('A Wing');

      const mgrEngInput = screen.getByPlaceholderText('e.g. Bhushan') as HTMLInputElement;
      expect(mgrEngInput.value).toBe('Bhushan Patil');
    });

    it('should render 10 digit boxes for both manager and secretary mobile numbers', () => {
      render(
        <WingForm
          propertyId={123}
          locale="en"
          initialWingDetailId={101}
          societyWings={mockSocietyWings}
          wingMaster={mockWingMaster}
        />
      );

      const managerContainer = document.getElementById('manager-mobile-container');
      const secretaryContainer = document.getElementById('secretary-mobile-container');

      expect(managerContainer).toBeInTheDocument();
      expect(secretaryContainer).toBeInTheDocument();

      const mgrInputs = managerContainer?.querySelectorAll('input');
      const secInputs = secretaryContainer?.querySelectorAll('input');

      expect(mgrInputs?.length).toBe(10);
      expect(secInputs?.length).toBe(10);
    });

    it('should render SELECT WING pills and shift details when a different wing pill is clicked', () => {
      render(
        <WingForm
          propertyId={123}
          locale="en"
          initialWingDetailId={101}
          societyWings={mockSocietyWings}
          wingMaster={mockWingMaster}
        />
      );

      expect(screen.getByText('SELECT WING')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'A Wing' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'B Wing' })).toBeInTheDocument();

      const wingNameInput = screen.getByPlaceholderText('Enter wing name (e.g. A Wing)') as HTMLInputElement;
      expect(wingNameInput.value).toBe('A Wing');

      // Click on 'B Wing' pill
      fireEvent.click(screen.getByRole('button', { name: 'B Wing' }));

      // Form should shift to B Wing details
      expect(wingNameInput.value).toBe('B Wing');
      const mgrEngInput = screen.getByPlaceholderText('e.g. Bhushan') as HTMLInputElement;
      expect(mgrEngInput.value).toBe('Rahul Sawant');
    });
  });

  describe('Modifications & Updating', () => {
    it('should disable update button initially and enable on field modification', () => {
      render(
        <WingForm
          propertyId={123}
          locale="en"
          initialWingDetailId={101}
          societyWings={mockSocietyWings}
          wingMaster={mockWingMaster}
        />
      );

      const submitBtn = screen.getByRole('button', { name: /Update Changes/i });
      expect(submitBtn).toBeDisabled();

      const wingNameInput = screen.getByPlaceholderText('Enter wing name (e.g. A Wing)');
      fireEvent.change(wingNameInput, { target: { value: 'Tower A' } });

      expect(submitBtn).not.toBeDisabled();
    });

    it('should submit updated wing data via updateApartmentQcWingDetailsAction and show success toast', async () => {
      (updateApartmentQcWingDetailsAction as Mock).mockResolvedValue({
        success: true,
        data: { id: 101 },
      });

      render(
        <WingForm
          propertyId={123}
          locale="en"
          initialWingDetailId={101}
          societyWings={mockSocietyWings}
          wingMaster={mockWingMaster}
        />
      );

      const wingNameInput = screen.getByPlaceholderText('Enter wing name (e.g. A Wing)');
      fireEvent.change(wingNameInput, { target: { value: 'Wing A Renamed' } });

      const submitBtn = screen.getByRole('button', { name: /Update Changes/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(updateApartmentQcWingDetailsAction).toHaveBeenCalledWith(
          101,
          expect.objectContaining({
            wingName: 'Wing A Renamed',
            managerName: 'भूषण पाटील',
            managerNameEnglish: 'Bhushan Patil',
            managerEmailId: 'manager@example.com',
            secretaryName: 'अमित जोशी',
            secretaryNameEnglish: 'Amit Joshi',
            secretaryEmailId: 'secretary@example.com',
          })
        );
        expect(toast.success).toHaveBeenCalledWith('Wing details updated successfully!');
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('should validate email format and show error toast on invalid email', async () => {
      (updateApartmentQcWingDetailsAction as Mock).mockClear();

      render(
        <WingForm
          propertyId={123}
          locale="en"
          initialWingDetailId={101}
          societyWings={mockSocietyWings}
          wingMaster={mockWingMaster}
        />
      );

      const mgrEmailInput = screen.getByPlaceholderText('e.g. manager@example.com');
      fireEvent.change(mgrEmailInput, { target: { value: 'invalid-email-string' } });

      const submitBtn = screen.getByRole('button', { name: /Update Changes/i });
      fireEvent.click(submitBtn);

      expect(toast.error).toHaveBeenCalledWith('Invalid Manager Email address format.');
      expect(updateApartmentQcWingDetailsAction).not.toHaveBeenCalled();
    });
  });
});
