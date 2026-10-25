import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePropertyBasicForm } from '@/hooks/apartmentQc/usePropertyBasicForm';
import { updateBasicDetailsAction } from '@/app/[locale]/property-tax/ptis/appartmentQC/action';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
  }),
  usePathname: () => '/mock-path',
  useSearchParams: () => new URLSearchParams(''),
}));

// Mock useToast and useConfirm
const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock('@/components/common', () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: vi.fn().mockImplementation((config) => {
      if (config.onConfirm) config.onConfirm();
    }),
  }),
}));

// Mock action
vi.mock('@/app/[locale]/property-tax/ptis/appartmentQC/action', () => ({
  updateBasicDetailsAction: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
}));

describe('usePropertyBasicForm', () => {
  const mockT = vi.fn((key: string, options?: Record<string, string | number | Date>): string => (options?.fallback as string) || key);
  const mockTQ = vi.fn((key: string, options?: Record<string, string | number | Date>): string => (options?.fallback as string) || key);
  const mockTHas = vi.fn(() => true);

  const defaultProps = {
    propertyData: {
      id: 1,
      ownerName: 'Initial Owner',
      mobileNo: '9876543210',
      emailId: 'test@example.com',
    },
    propertyTypes: [],
    oldPropertyFetchResult: null,
    t: mockT,
    tQ: mockTQ,
    tHas: mockTHas,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes form data correctly', () => {
    const { result } = renderHook(() => usePropertyBasicForm(defaultProps));

    expect(result.current.formData.ownerName).toBe('Initial Owner');
    expect(result.current.formData.mobileNo).toBe('9876543210');
    expect(result.current.formData.emailId).toBe('test@example.com');
  });

  it('handles field changes and formats specific fields correctly', () => {
    const { result } = renderHook(() => usePropertyBasicForm(defaultProps));

    act(() => {
      result.current.handleFieldChange('ownerName', 'New Owner 123!');
    });
    // Should strip invalid characters based on OWNERNAME_REGEX
    expect(result.current.formData.ownerName).toBe('New Owner ');

    act(() => {
      result.current.handleFieldChange('mobileNo', '12a3b4c5d6');
    });
    // Should strip non-numeric characters
    expect(result.current.formData.mobileNo).toBe('123456');

    act(() => {
      result.current.handleFieldChange('emailId', 'test@@example.com');
    });
    // Should limit to single @
    expect(result.current.formData.emailId).toBe('test@example.com');
    
    expect(result.current.hasChanges).toBe(true);
  });

  it('validates required fields on submit and sets errors', () => {
    const { result } = renderHook(() => usePropertyBasicForm({
      ...defaultProps,
      propertyData: { id: 1, ownerName: '', occupierName: '', flatOrShopNo: '' },
    }));

    act(() => {
      // Create a mock event to prevent default
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      result.current.handleUpdate(mockEvent);
    });

    expect(result.current.errors).toHaveProperty('ownerName');
    expect(result.current.errors).toHaveProperty('occupierName');
    expect(result.current.errors).toHaveProperty('flatOrShopNo');
    expect(updateBasicDetailsAction).not.toHaveBeenCalled();
  });

  it('validates invalid mobile and email formats', () => {
    const { result } = renderHook(() => usePropertyBasicForm({
      ...defaultProps,
      propertyData: { 
        id: 1, 
        ownerName: 'Owner', 
        occupierName: 'Occupier', 
        flatOrShopNo: '101',
        mobileNo: '123', // invalid length
        emailId: 'invalid-email', // invalid format
      },
    }));

    act(() => {
      result.current.handleUpdate();
    });

    expect(result.current.errors).toHaveProperty('mobileNo');
    expect(result.current.errors).toHaveProperty('emailId');
    expect(updateBasicDetailsAction).not.toHaveBeenCalled();
  });

  it('calls updateBasicDetailsAction when form is valid', async () => {
    const { result } = renderHook(() => usePropertyBasicForm({
      ...defaultProps,
      propertyData: { 
        id: 1, 
        ownerName: 'Owner', 
        occupierName: 'Occupier', 
        flatOrShopNo: '101',
      },
    }));

    // Trigger update (without event for coverage)
    await act(async () => {
      result.current.handleUpdate();
    });

    // Since confirm mock automatically triggers onConfirm, updateBasicDetailsAction should be called
    expect(updateBasicDetailsAction).toHaveBeenCalledWith(1, expect.objectContaining({
      ownerName: 'Owner',
      occupierName: 'Occupier',
      flatOrShopNo: '101',
    }));
  });

  it('handles old property refresh correctly', async () => {
    const { result } = renderHook(() => usePropertyBasicForm({
      ...defaultProps,
      propertyData: { id: 1, oldPropertyNo: 'TEST1234' },
    }));

    await act(async () => {
      await result.current.handleOldPropertyRefresh();
    });

    expect(mockPush).toHaveBeenCalled();
    const pushUrl = mockPush.mock.calls[0][0];
    expect(pushUrl).toContain('oldPropertyNo=TEST1234');
    expect(pushUrl).toContain('_refresh=');
  });
});
