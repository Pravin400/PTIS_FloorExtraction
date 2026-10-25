/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFloorInformationForm } from '@/hooks/ptis/QuickDataEntry/Olddetails/useFloorInformationForm';
import { useFloorFormState } from '@/hooks/ptis/QuickDataEntry/Olddetails/useFloorFormState';
import { useFloorFormValidation } from '@/hooks/ptis/QuickDataEntry/Olddetails/useFloorFormValidation';
import { useFloorFormApi } from '@/hooks/ptis/QuickDataEntry/Olddetails/useFloorFormApi';
import { toast } from 'sonner';

vi.mock('@/hooks/ptis/QuickDataEntry/Olddetails/useFloorFormState');
vi.mock('@/hooks/ptis/QuickDataEntry/Olddetails/useFloorFormValidation');
vi.mock('@/hooks/ptis/QuickDataEntry/Olddetails/useFloorFormApi');
vi.mock('next/navigation', () => ({
  useParams: () => ({ propertyId: '123', locale: 'en' }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('useFloorInformationForm', () => {
  const mockState = {
    formData: { oldFloorId: '1' },
    setFormData: vi.fn(),
    setInitialEditValues: vi.fn(),
    handleUseTypeChange: vi.fn(),
    handleEdit: vi.fn(),
    handleReset: vi.fn(),
  };

  const mockValidation = {
    errors: {},
    validate: vi.fn(),
    resetValidation: vi.fn(),
    showError: vi.fn(),
  };

  const mockApi = {
    isSubmitting: false,
    handleSave: vi.fn(),
    handleDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useFloorFormState as any).mockReturnValue(mockState);
    (useFloorFormValidation as any).mockReturnValue(mockValidation);
    (useFloorFormApi as any).mockReturnValue(mockApi);
  });

  it('should call apiSave if validation passes', async () => {
    mockValidation.validate.mockReturnValue({}); // No errors
    const { result } = renderHook(() => useFloorInformationForm({ propertyId: 123, locale: 'en', initialSubUseTypeOptions: [] }));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockApi.handleSave).toHaveBeenCalledWith(mockState.formData, expect.any(Function));
  });

  it('should not call apiSave if validation fails', async () => {
    mockValidation.validate.mockReturnValue({ oldFloorId: 'Required' }); // Errors
    const { result } = renderHook(() => useFloorInformationForm({ propertyId: 123, locale: 'en', initialSubUseTypeOptions: [] }));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockApi.handleSave).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should calculate isChanged as false when year/area match in standard vs Marathi digits', () => {
    const originalFormData = mockState.formData;
    mockState.formData = {
      oldFloorId: '1',
      oldSubFloorId: '2',
      oldConstructionYear: '२०२०',
      oldAssessmentYear: '२०२१',
      oldConstructionTypeId: '3',
      oldTypeOfUseId: '4',
      oldSubTypeOfUseId: '5',
      oldAreaSqMeter: '१५.५',
    } as any;
    (mockState as any).initialEditValues = {
      oldFloorId: '1',
      oldSubFloorId: '2',
      oldConstructionYear: '2020',
      oldAssessmentYear: '2021',
      oldConstructionTypeId: '3',
      oldTypeOfUseId: '4',
      oldSubTypeOfUseId: '5',
      oldAreaSqMeter: '15.5',
    } as any;

    const { result } = renderHook(() => useFloorInformationForm({ propertyId: 123, locale: 'en', initialSubUseTypeOptions: [] }));
    expect(result.current.isChanged).toBe(false);

    // cleanup
    mockState.formData = originalFormData;
    delete (mockState as any).initialEditValues;
  });

  it('should calculate isChanged as true when year/area differ', () => {
    const originalFormData = mockState.formData;
    mockState.formData = {
      oldFloorId: '1',
      oldSubFloorId: '2',
      oldConstructionYear: '२०२२', // different
      oldAssessmentYear: '२०२१',
      oldConstructionTypeId: '3',
      oldTypeOfUseId: '4',
      oldSubTypeOfUseId: '5',
      oldAreaSqMeter: '१५.५',
    } as any;
    (mockState as any).initialEditValues = {
      oldFloorId: '1',
      oldSubFloorId: '2',
      oldConstructionYear: '2020',
      oldAssessmentYear: '2021',
      oldConstructionTypeId: '3',
      oldTypeOfUseId: '4',
      oldSubTypeOfUseId: '5',
      oldAreaSqMeter: '15.5',
    } as any;

    const { result } = renderHook(() => useFloorInformationForm({ propertyId: 123, locale: 'en', initialSubUseTypeOptions: [] }));
    expect(result.current.isChanged).toBe(true);

    // cleanup
    mockState.formData = originalFormData;
    delete (mockState as any).initialEditValues;
  });
});
