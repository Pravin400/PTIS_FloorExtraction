import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSocialAttributeForm } from '@/hooks/social-attribute-master/useSocialAttributeForm';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  createSocialAttributeAction,
  updateSocialAttributeAction,
} from '@/app/[locale]/property-tax/social-attribute-master/action';
import { useConfirm } from '@/components/common/ConfirmProvider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => 'en'),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock server actions
vi.mock('@/app/[locale]/property-tax/social-attribute-master/action', () => ({
  createSocialAttributeAction: vi.fn(),
  updateSocialAttributeAction: vi.fn(),
}));

// Mock ConfirmProvider
vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: vi.fn(() => ({ confirm: vi.fn() })),
}));

describe('useSocialAttributeForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useTranslations).mockReturnValue(
      ((key: string) => key) as unknown as ReturnType<typeof useTranslations>
    );
    vi.mocked(useLocale).mockReturnValue('en');
  });

  const defaultProps = {
    id: null,
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
  };

  it('should initialize with default values for create mode', () => {
    const { result } = renderHook(() => useSocialAttributeForm(defaultProps));

    expect(result.current.formData.socialAttributeCode).toBe('');
    expect(result.current.isEdit).toBe(false);
    expect(result.current.isActive).toBe(true);
  });

  it('should initialize with initial data for edit mode', () => {
    const initialData = {
      id: 123,
      socialAttributeCode: 'ATTR_1',
      socialAttributeName: 'Attr Name',
      dataType: 'DECIMAL',
      unit: 'Meter',
      displayOrder: 5,
      parentAttributeId: null,
      isRequiredWhenParentTrue: false,
      isDiscountApplicable: false,
      isPhotoRequired: false,
      isDocumentRequired: false,
      isActive: false,
      createdDate: '2024-01-01',
      updatedDate: null,
    };

    const { result } = renderHook(() =>
      useSocialAttributeForm({ ...defaultProps, id: 123, initialData })
    );

    expect(result.current.formData.socialAttributeCode).toBe('ATTR_1');
    expect(result.current.isEdit).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it('should handle input changes', () => {
    const { result } = renderHook(() => useSocialAttributeForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: 'socialAttributeCode', value: 'NEWCODE' },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.socialAttributeCode).toBe('NEWCODE');
  });

  it('should handle status toggle', () => {
    const { result } = renderHook(() => useSocialAttributeForm(defaultProps));

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.formData.isActive).toBe(false);
  });

  it('should validate and show errors on submit', async () => {
    const { result } = renderHook(() => useSocialAttributeForm(defaultProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.socialAttributeCode).toBeDefined();
    expect(createSocialAttributeAction).not.toHaveBeenCalled();
  });

  it('should call create action on successful submit', async () => {
    vi.mocked(createSocialAttributeAction).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSocialAttributeForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: 'socialAttributeCode', value: 'ROAD_WIDTH' },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: 'socialAttributeName', value: 'Road Width' },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: 'dataType', value: 'DECIMAL' },
      } as unknown as React.ChangeEvent<HTMLSelectElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(createSocialAttributeAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should call update action in edit mode', async () => {
    vi.mocked(updateSocialAttributeAction).mockResolvedValue({ success: true });

    const initialData = {
      id: 123,
      socialAttributeCode: 'ROAD_WIDTH',
      socialAttributeName: 'Road Width',
      dataType: 'DECIMAL',
      unit: 'Meter',
      displayOrder: 1,
      parentAttributeId: null,
      isRequiredWhenParentTrue: false,
      isDiscountApplicable: true,
      isPhotoRequired: false,
      isDocumentRequired: false,
      isActive: true,
      createdDate: '',
      updatedDate: null,
    };

    const { result } = renderHook(() =>
      useSocialAttributeForm({ ...defaultProps, id: 123, initialData })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(updateSocialAttributeAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('should handle child toggle', () => {
    const { result } = renderHook(() => useSocialAttributeForm(defaultProps));

    expect(result.current.isChild).toBe(false);

    act(() => {
      result.current.handleToggleIsChild();
    });

    expect(result.current.isChild).toBe(true);

    act(() => {
      result.current.handleToggleIsChild();
    });

    expect(result.current.isChild).toBe(false);
    expect(result.current.formData.parentAttributeId).toBeNull();
    expect(result.current.formData.isRequiredWhenParentTrue).toBe(false);
  });

  it('should handle cancel', () => {
    const { result } = renderHook(() => useSocialAttributeForm(defaultProps));

    act(() => {
      result.current.handleCancel();
    });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should prompt confirmation on cancel if form is dirty', () => {
    const confirmMock = vi.fn();
    vi.mocked(useConfirm).mockReturnValue({ confirm: confirmMock });

    const { result } = renderHook(() => useSocialAttributeForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: 'socialAttributeCode', value: 'DIRTY_CODE' },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleCancel();
    });

    expect(confirmMock).toHaveBeenCalled();
    expect(mockOnCancel).not.toHaveBeenCalled();
  });
});
