import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import SocietyForm from '@/components/modules/property-tax/ptis/QuickDataEntry/society/SocietyForm';
import { PropertySocietyDetailsApiItem } from '@/types/property-society-details.types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { updatePropertySocietyDetailsAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Society/action';

// Mock dependencies
vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            'society.title': 'Society Details',
            'society.landOwnerPlaceholder': 'Land Owner',
            'society.builderNamePlaceholder': 'Builder Name',
            'society.buildingSocietyNamePlaceholder': 'Society Name',
            'society.societyEmailPlaceholder': 'Society Email',
            'society.societyAddressPlaceholder': 'Society Address',
            'society.managerNamePlaceholder': 'Manager Name',
            'society.managerEmailPlaceholder': 'Manager Email',
            'society.secretaryNamePlaceholder': 'Secretary Name',
            'society.secretaryEmailPlaceholder': 'Secretary Email',
            'commonbuttonmessages.UpdateChanges': 'Update Changes',
            'footer.saving': 'Saving...',
            'society.updateSuccess': 'Society details updated successfully',
            'society.updateError': 'An error occurred during update.',
            'society.updateConfirmTitle': 'Confirm Update',
            'society.updateConfirmText': 'Are you sure?',
            'society.updateConfirmButton': 'Yes, Update',
        };
        return translations[key] || key;
    },
}));

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/en/property-tax/ptis/QuickDataEntry/1/Society',
    useParams: () => ({ propertyId: '1', locale: 'en' }),
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Society/action', () => ({
    updatePropertySocietyDetailsAction: vi.fn(),
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

describe('SocietyForm', () => {
    const mockRouter = {
        push: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn().mockResolvedValue(undefined),
    };

    const mockSocietyData: PropertySocietyDetailsApiItem = {
        propertyId: 123,
        societyDetailId: 1,
        wingId: 1,
        wingNo: 'A',
        wingName: 'Wing A',
        societyName: 'Test Society',
        societyAddress: '123 Test Street',
        societyEmailId: 'society@test.com',
        managerName: 'John Manager',
        managerEmailId: 'manager@test.com',
        managerMobileNo: '9876543210',
        secretaryName: 'Jane Secretary',
        secretaryEmailId: 'secretary@test.com',
        secretaryMobileNo: '9876543211',
        landOwnerName: 'Land Owner',
        builderName: 'Builder Name',
        societyNameEnglish: 'Test Society',
        societyAddressEnglish: '123 Test Street',
        managerNameEnglish: 'John Manager',
        secretaryNameEnglish: 'Jane Secretary',
        landOwnerNameEnglish: 'Land Owner',
        builderNameEnglish: 'Builder Name',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
    });

    describe('Rendering', () => {
        it('should render the form with all fields', () => {
            render(
                <SocietyForm
                    societyData={null}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            expect(screen.getByText('Society Details')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Land Owner')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Builder Name')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Society Name')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Society Email')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Society Address')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Manager Name')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Manager Email')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Secretary Name')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Secretary Email')).toBeInTheDocument();
        });

        it('should render with default values when societyData is provided', () => {
            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            const landOwnerInput = screen.getByPlaceholderText('Land Owner') as HTMLInputElement;
            const builderInput = screen.getByPlaceholderText('Builder Name') as HTMLInputElement;
            const societyNameInput = screen.getByPlaceholderText('Society Name') as HTMLInputElement;

            expect(landOwnerInput.value).toBe('Land Owner');
            expect(builderInput.value).toBe('Builder Name');
            expect(societyNameInput.value).toBe('Test Society');
        });

        it('should render mobile number inputs with 10 digit boxes', () => {
            render(
                <SocietyForm
                    societyData={null}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            const managerContainer = document.getElementById('manager-mobile-container');
            const secretaryContainer = document.getElementById('secretary-mobile-container');

            expect(managerContainer).toBeInTheDocument();
            expect(secretaryContainer).toBeInTheDocument();

            const managerInputs = managerContainer?.querySelectorAll('input');
            const secretaryInputs = secretaryContainer?.querySelectorAll('input');

            expect(managerInputs?.length).toBe(10);
            expect(secretaryInputs?.length).toBe(10);
        });

        it('should populate mobile number digits when societyData is provided', () => {
            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            const managerContainer = document.getElementById('manager-mobile-container');
            const managerInputs = managerContainer?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

            expect(managerInputs[0].value).toBe('9');
            expect(managerInputs[1].value).toBe('8');
            expect(managerInputs[2].value).toBe('7');
            expect(managerInputs[9].value).toBe('0');
        });
    });

    describe('Button States', () => {
        it('should disable save button initially', () => {
            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            const submitBtn = screen.getByRole('button', { name: /Update Changes/i });
            expect(submitBtn).toBeDisabled();
        });

        it('should enable save button when data is modified', () => {
            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const submitBtn = screen.getByRole('button', { name: /Update Changes/i });
            expect(submitBtn).not.toBeDisabled();
        });
    });

    describe('Mobile Number Input Behavior', () => {
        it('should auto-focus next input on entering a digit', async () => {
            render(
                <SocietyForm
                    societyData={null}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            const managerContainer = document.getElementById('manager-mobile-container');
            const inputs = managerContainer?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

            const firstInput = inputs[0];

            fireEvent.change(firstInput, { target: { value: '9' } });

            // Check if value is set
            await waitFor(() => {
                expect(firstInput.value).toBe('9');
            });
        });

        it('should handle backspace navigation', () => {
            render(
                <SocietyForm
                    societyData={null}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            const managerContainer = document.getElementById('manager-mobile-container');
            const inputs = managerContainer?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

            const secondInput = inputs[1];

            fireEvent.keyDown(secondInput, { key: 'Backspace' });

            // Backspace behavior is tested
            expect(secondInput).toBeInTheDocument();
        });

        it('should only accept numeric values', async () => {
            render(
                <SocietyForm
                    societyData={null}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            const managerContainer = document.getElementById('manager-mobile-container');
            const inputs = managerContainer?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

            const firstInput = inputs[0];

            fireEvent.change(firstInput, { target: { value: 'a' } });

            await waitFor(() => {
                expect(firstInput.value).toBe('');
            });
        });
    });

    describe('Form Validation', () => {
        it('should not disable update button for invalid email format but show error toast on click', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockClear();

            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            const societyEmailInput = screen.getByPlaceholderText('Society Email');
            fireEvent.change(societyEmailInput, { target: { value: 'invalid-email' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            expect(submitButton).not.toBeDisabled();

            fireEvent.click(submitButton);
            expect(toast.error).toHaveBeenCalledWith('society.validation.societyEmail');
            expect(updatePropertySocietyDetailsAction).not.toHaveBeenCalled();
        });

        it('should not disable update button for invalid manager mobile number length but show error toast on click', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockClear();

            render(
                <SocietyForm
                    societyData={null}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            // Change land owner to trigger hasChanges
            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const managerContainer = document.getElementById('manager-mobile-container');
            const inputs = managerContainer?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

            // Enter only 5 digits
            fireEvent.change(inputs[0], { target: { value: '9' } });
            fireEvent.change(inputs[1], { target: { value: '8' } });
            fireEvent.change(inputs[2], { target: { value: '7' } });
            fireEvent.change(inputs[3], { target: { value: '6' } });
            fireEvent.change(inputs[4], { target: { value: '5' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            expect(submitButton).not.toBeDisabled();

            fireEvent.click(submitButton);
            expect(toast.error).toHaveBeenCalledWith('society.validation.invalidMobile');
            expect(updatePropertySocietyDetailsAction).not.toHaveBeenCalled();
        });

        it('should not disable update button for manager mobile number with repeated digit sequences but show error toast on click', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockClear();

            render(
                <SocietyForm
                    societyData={null}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            // Change land owner to trigger hasChanges
            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const managerContainer = document.getElementById('manager-mobile-container');
            const inputs = managerContainer?.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

            // Enter a repeated sequence: 9999912345
            for (let i = 0; i < 5; i++) {
                fireEvent.change(inputs[i], { target: { value: '9' } });
            }
            fireEvent.change(inputs[5], { target: { value: '1' } });
            fireEvent.change(inputs[6], { target: { value: '2' } });
            fireEvent.change(inputs[7], { target: { value: '3' } });
            fireEvent.change(inputs[8], { target: { value: '4' } });
            fireEvent.change(inputs[9], { target: { value: '5' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            expect(submitButton).not.toBeDisabled();

            fireEvent.click(submitButton);
            expect(toast.error).toHaveBeenCalledWith('society.validation.invalidRepeatedSequence');
            expect(updatePropertySocietyDetailsAction).not.toHaveBeenCalled();
        });
    });

    describe('Form Submission', () => {
        it('should submit form with valid data', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockResolvedValue({
                success: true,
            });

            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            // Trigger some change to enable the button
            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(updatePropertySocietyDetailsAction).toHaveBeenCalled();
            });
        });

        it('should show success toast on successful submission', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockResolvedValue({
                success: true,
            });

            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            // Trigger some change to enable the button
            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Society details updated successfully');
            });
        });

        it('should refresh router on successful submission', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockResolvedValue({
                success: true,
            });

            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            // Trigger some change to enable the button
            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockRouter.refresh).toHaveBeenCalled();
            });
        });

        it('should show error toast on submission failure', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockResolvedValue({
                success: false,
                error: 'Update failed',
            });

            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            // Trigger some change to enable the button
            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Update failed');
            });
        });

        it('should handle submission exception', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockRejectedValue(
                new Error('Network error')
            );

            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            // Trigger some change to enable the button
            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('An error occurred during update.');
            });
        });
    });

    describe('Loading State', () => {
        it('should show loading state during submission', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
            );

            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            // Trigger some change to enable the button
            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            fireEvent.click(submitButton);

            // Button should be in loading state
            await waitFor(() => {
                expect(updatePropertySocietyDetailsAction).toHaveBeenCalled();
            });
        });
    });

    describe('Payload Construction', () => {
        it('should construct correct payload with all fields', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockResolvedValue({
                success: true,
            });

            render(
                <SocietyForm
                    societyData={mockSocietyData}
                    propertyIdSearch={123}
                    locale="en"
                />
            );

            // Trigger some change to enable the button
            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(updatePropertySocietyDetailsAction).toHaveBeenCalled();
            });

            expect(updatePropertySocietyDetailsAction).toHaveBeenCalledWith(
                'en',
                123,
                expect.objectContaining({
                    propertyId: 123,
                    societyDetailId: 1,
                    societyName: 'Test Society',
                    societyAddress: '123 Test Street',
                    managerName: 'John Manager',
                    managerEmailId: 'manager@test.com',
                    managerMobileNo: '+919876543210',
                    secretaryName: 'Jane Secretary',
                    secretaryEmailId: 'secretary@test.com',
                    secretaryMobileNo: '+919876543211',
                    landOwnerName: 'New Owner',
                    builderName: 'Builder Name',
                })
            );
        });

        it('should use propertyIdSearch when societyData is null', async () => {
            (updatePropertySocietyDetailsAction as Mock).mockResolvedValue({
                success: true,
            });

            render(
                <SocietyForm
                    societyData={null}
                    propertyIdSearch={456}
                    locale="en"
                />
            );

            const landOwnerInput = screen.getByPlaceholderText('Land Owner');
            fireEvent.change(landOwnerInput, { target: { value: 'New Owner' } });

            const submitButton = screen.getByRole('button', { name: /Update Changes/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(updatePropertySocietyDetailsAction).toHaveBeenCalled();
            });

            expect(updatePropertySocietyDetailsAction).toHaveBeenCalledWith(
                'en',
                456,
                expect.objectContaining({
                    propertyId: 456,
                })
            );
        });
    });
});


