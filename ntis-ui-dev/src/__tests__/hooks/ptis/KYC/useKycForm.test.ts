import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import * as kycActions from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Kyc/action';
import { KycDetails, OwnerTypeApiItem } from '@/types/property-kyc.types';
import { useKycForm } from '@/hooks/ptis/QuickDataEntry/kyc/useKycForm';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Kyc/action', () => ({
  updatePropertyKycAction: vi.fn(),
}));

describe('useKycForm', () => {
  const mockKycData: KycDetails = {
    propertyId: 123,
    ownerTypeId: 1,
    ownerType: 'Individual',
    ownerTitle: 'Mr.',
    ownerName: 'John Doe',
    occupierName: 'Jane Doe',
    flatOrShopName: 'Shop 1',
    emailId: 'john@example.com',
    address: '123 Main St',
    location: 'Downtown',
    mobileNo: '9876543210',
    adharCardNo: '223456789012',
    aadharCardNo: '223456789012',
    ownerTitleEnglish: null,
    ownerNameEnglish: null,
    occupierTitle: null,
    occupierTitleEnglish: null,
    occupierNameEnglish: null,
    flatOrShopNameEnglish: null,
    flatOrShopNo: null,
    flatOrShopNoEnglish: null,
    addressEnglish: null,
    locationEnglish: null,
    pinCode: '123456',
  };

  const mockOwnerTypes: OwnerTypeApiItem[] = [
    { id: 1, ownerType: 'Individual', isActive: true, createdDate: '2024-01-01', updatedDate: '2024-01-01' },
    { id: 2, ownerType: 'Company', isActive: true, createdDate: '2024-01-01', updatedDate: '2024-01-01' },
  ];

  const mockT = (key: string) => key;
  const mockConfirm = vi.fn((options) => {
    options.onConfirm();
  });
  const mockRouter = { refresh: vi.fn() };

  const defaultProps = {
    KycDetailsData: mockKycData,
    OwnerTypeMasterList: mockOwnerTypes,
    locale: 'en',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with provided KYC data', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      expect(result.current.formData.ownerTypeId).toBe(1);
      expect(result.current.formData.ownerTitle).toBe('Mr.');
      expect(result.current.formData.ownerName).toBe('John Doe');
      expect(result.current.formData.emailId).toBe('john@example.com');
      expect(result.current.formData.pinCode).toBe('123456');
    });

    it('should initialize with empty data when KycDetailsData is null', () => {
      const { result } = renderHook(() =>
        useKycForm(
          { ...defaultProps, KycDetailsData: null },
          mockT,
          mockConfirm,
          mockRouter
        )
      );

      expect(result.current.formData.ownerName).toBe('');
      expect(result.current.formData.emailId).toBe('');
      expect(result.current.formData.pinCode).toBe('');
    });

    it('should initialize mobile input with KYC mobile number', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      expect(result.current.mobileInput.value).toBe('9876543210');
    });

    it('should initialize aadhar input with KYC aadhar number', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      expect(result.current.aadharInput.value).toBe('223456789012');
    });

    it('should initialize ownerTypeOptions from OwnerTypeMasterList', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      expect(result.current.ownerTypeOptions).toEqual([
        { label: 'Individual', value: '1' },
        { label: 'Company', value: '2' },
      ]);
    });
  });

  describe('hasChanges detection', () => {
    it('should detect no changes on initial load', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      expect(result.current.hasChanges).toBe(false);
    });

    it('should detect changes when form data is modified', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          ownerName: 'Jane Smith',
        }));
      });

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect changes when mobile number is modified', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.mobileInput.handleChange(0, '8');
      });

      expect(result.current.hasChanges).toBe(true);
    });

    it('should detect changes when aadhar number is modified', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.aadharInput.handleChange(0, '9');
      });

      expect(result.current.hasChanges).toBe(true);
    });

    it('should normalize email comparison (trim whitespace)', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          emailId: 'john@example.com  ',
        }));
      });

      expect(result.current.hasChanges).toBe(false);
    });

    it('should detect changes when pincode is modified', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          pinCode: '654321',
        }));
      });

      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('canSubmit validation', () => {
    it('should allow submission with valid data', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      expect(result.current.canSubmit()).toBe(true);
    });

    it('should prevent submission with invalid owner name', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          ownerName: 'A', // Too short
        }));
      });

      expect(result.current.canSubmit()).toBe(false);
    });

    it('should prevent submission with invalid email', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          emailId: 'invalid-email',
        }));
      });

      expect(result.current.canSubmit()).toBe(false);
    });

    it('should prevent submission with invalid mobile number', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.mobileInput.setDigits(['1', '2', '3', '', '', '', '', '', '', '']);
      });

      expect(result.current.canSubmit()).toBe(false);
    });

    it('should prevent submission with invalid aadhar number', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.aadharInput.setDigits(['1', '2', '3', '', '', '', '', '', '', '', '', '']);
      });

      expect(result.current.canSubmit()).toBe(false);
    });

    it('should prevent submission with invalid pincode', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          pinCode: '12345',
        }));
      });

      expect(result.current.canSubmit()).toBe(false);
    });

    it('should prevent submission with repeated pincode digits', () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          pinCode: '111111',
        }));
      });

      expect(result.current.canSubmit()).toBe(false);
    });
  });

  describe('handleSubmit', () => {
    it('should show error if propertyId is missing', async () => {
      const { result } = renderHook(() =>
        useKycForm(
          { ...defaultProps, KycDetailsData: { ...mockKycData, propertyId: undefined as unknown as number } },
          mockT,
          mockConfirm,
          mockRouter
        )
      );

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(toast.error).toHaveBeenCalledWith('kyc.propertyIdMissing');
      expect(mockConfirm).not.toHaveBeenCalled();
    });

    it('should show validation error if form is invalid', async () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          ownerName: 'A', // Invalid
        }));
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(toast.error).toHaveBeenCalledWith('kyc.validation.invalidName');
      expect(mockConfirm).not.toHaveBeenCalled();
    });

    it('should call confirm dialog with correct metadata', async () => {
      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          emailId: 'changed@example.com',
        }));
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'update',
          meta: {
            name: 'John Doe',
          },
        })
      );
    });

    it('should call updatePropertyKycAction with correct payload on confirm', async () => {
      vi.mocked(kycActions.updatePropertyKycAction).mockResolvedValue({
        success: true,
        message: 'Success',
      });

      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          emailId: 'changed@example.com',
        }));
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(kycActions.updatePropertyKycAction).toHaveBeenCalled();
      });

      expect(kycActions.updatePropertyKycAction).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          propertyId: 123,
          ownerTypeId: 1,
          ownerName: 'John Doe',
          emailId: 'changed@example.com',
          mobileNo: '+919876543210',
          adharCardNo: '223456789012',
          pinCode: '123456',
        }),
        'en'
      );
    });

    it('should show success toast and refresh on successful submission', async () => {
      vi.mocked(kycActions.updatePropertyKycAction).mockResolvedValue({
        success: true,
        message: 'KYC updated successfully',
      });

      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          emailId: 'changed@example.com',
        }));
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('KYC updated successfully');
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('should show error toast on failed submission', async () => {
      vi.mocked(kycActions.updatePropertyKycAction).mockResolvedValue({
        success: false,
        error: 'Update failed',
      });

      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          emailId: 'changed@example.com',
        }));
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
      });
    });

    it('should handle JSON error responses', async () => {
      const jsonError = JSON.stringify({
        errors: {
          ownerName: ['Name is required'],
          emailId: ['Invalid email'],
        },
      });

      vi.mocked(kycActions.updatePropertyKycAction).mockResolvedValue({
        success: false,
        error: jsonError,
      });

      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          emailId: 'changed@example.com',
        }));
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Name is required\nInvalid email');
      });
    });

    it('should set isUpdating state during submission', async () => {
      vi.mocked(kycActions.updatePropertyKycAction).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, message: 'Success' }), 100)
          )
      );

      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          emailId: 'changed@example.com',
        }));
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        result.current.handleSubmit(mockEvent);
        // Should be updating immediately after confirm
        await vi.waitFor(() => {
          expect(result.current.isUpdating).toBe(true);
        });
      });
    });

    it('should handle null owner type correctly', async () => {
      vi.mocked(kycActions.updatePropertyKycAction).mockResolvedValue({
        success: true,
        message: 'Success',
      });

      const { result } = renderHook(() =>
        useKycForm(
          { ...defaultProps, KycDetailsData: { ...mockKycData, ownerTypeId: null } },
          mockT,
          mockConfirm,
          mockRouter
        )
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          emailId: 'changed@example.com',
        }));
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(kycActions.updatePropertyKycAction).toHaveBeenCalledWith(
          123,
          expect.objectContaining({
            ownerTypeId: null,
            ownerType: null,
          }),
          'en'
        );
      });
    });
  });

  describe('isSubmitted state', () => {
    it('should set isSubmitted to true on form submission', async () => {
      vi.mocked(kycActions.updatePropertyKycAction).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, message: 'Success' }), 100)
          )
      );

      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      act(() => {
        result.current.handleSubmit(mockEvent);
      });

      // Should be submitted during submission (before completion)
      expect(result.current.isSubmitted).toBe(true);
    });

    it('should reset isSubmitted to false on successful submission', async () => {
      vi.mocked(kycActions.updatePropertyKycAction).mockResolvedValue({
        success: true,
        message: 'Success',
      });

      const { result } = renderHook(() =>
        useKycForm(defaultProps, mockT, mockConfirm, mockRouter)
      );

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          emailId: 'changed@example.com',
        }));
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isSubmitted).toBe(false);
      });
    });
  });
});
