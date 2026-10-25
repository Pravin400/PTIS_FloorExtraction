/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaxationBreakdownForm } from '@/hooks/ptis/QuickDataEntry/Olddetails/useTaxationBreakdownForm';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common';
import { useParams, useRouter } from 'next/navigation';
import { saveOldTaxesDetailsAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/taxation-breakdown/action';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/common', () => ({
  useConfirm: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
  })),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/taxation-breakdown/action', () => ({
  saveOldTaxesDetailsAction: vi.fn(),
}));

describe('useTaxationBreakdownForm', () => {
  const mockInitialData = {
    propertyId: 123,
    taxYears: [
      {
        financeYearId: 1,
        year: 2024,
        yearCode: '2024-25',
        taxes: [
          { taxId: 1, taxName: 'Property Tax', taxAmount: 500 },
        ],
      },
    ],
  };

  const mockConfirm = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConfirm).mockReturnValue({ confirm: mockConfirm } as any);
    vi.mocked(useParams).mockReturnValue({ propertyId: '123' } as any);
    vi.mocked(useRouter).mockReturnValue({ refresh: mockRefresh } as any);
  });

  it('should initialize with provided data', () => {
    const { result } = renderHook(() => useTaxationBreakdownForm(mockInitialData));

    expect(result.current.taxes[0].taxAmount).toBe(500);
  });

  it('should calculate and save correct totals when tax amount changes', async () => {
    mockConfirm.mockImplementation(({ onConfirm }) => onConfirm());
    vi.mocked(saveOldTaxesDetailsAction).mockResolvedValue({ success: true } as any);

    const { result } = renderHook(() => useTaxationBreakdownForm(mockInitialData));

    act(() => {
      result.current.handleTaxChange(1, '700');
    });

    await act(async () => {
      result.current.handleSave();
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(saveOldTaxesDetailsAction).toHaveBeenCalledWith(
      123,
      expect.objectContaining({
        taxYears: expect.arrayContaining([
          expect.objectContaining({
            taxes: expect.arrayContaining([
              expect.objectContaining({
                taxId: 1,
                taxAmount: 700,
              }),
            ]),
          }),
        ]),
      }),
      'en'
    );
    expect(toast.success).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should block save when taxes data is empty', async () => {
    const emptyTaxesData = {
      propertyId: 123,
      taxYears: [
        {
          financeYearId: 1,
          year: 2024,
          yearCode: '2024-25',
          taxes: [], // empty taxes
        },
      ],
    };
    const { result } = renderHook(() => useTaxationBreakdownForm(emptyTaxesData));

    await act(async () => {
      result.current.handleSave();
    });

    expect(toast.error).toHaveBeenCalledWith('noTaxDataAvailable');
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('should block save when there are validation errors', async () => {
    const { result } = renderHook(() => useTaxationBreakdownForm(mockInitialData));

    act(() => {
      // Trigger a validation error, e.g., negative taxAmount
      result.current.handleTaxChange(1, '-50');
    });

    expect(result.current.validationErrors[`tax_1`]).toBeDefined();

    await act(async () => {
      result.current.handleSave();
    });

    expect(toast.error).toHaveBeenCalledWith('property.validation.fixErrors');
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('should allow selecting a future year but register validation error under yearMaster', () => {
    const futureYear = new Date().getFullYear() + 1;
    const mockYearOptions = [
      { id: 1, year: 2024, yearCode: '2024-25', isActive: true, status: 'active', startDate: '', endDate: '', description: '' },
      { id: 2, year: futureYear, yearCode: `${futureYear}-${String(futureYear + 1).slice(2)}`, isActive: true, status: 'active', startDate: '', endDate: '', description: '' },
    ];

    const { result } = renderHook(() => useTaxationBreakdownForm(mockInitialData, mockYearOptions));

    // Try selecting the future year
    act(() => {
      result.current.setSelectedYearId('2'); // ID 2 is year 2027
    });

    expect(result.current.selectedYearId).toBe('2');
    expect(result.current.validationErrors.yearMaster).toBe('property.validation.futureYearNotAllowed');
  });

  it('should set isChanged to true and validationErrors.yearMaster to undefined when selecting a valid different year', () => {
    const mockYearOptions = [
      { id: 1, year: 2024, yearCode: '2024-25', isActive: true, status: 'active', startDate: '', endDate: '', description: '' },
      { id: 2, year: 2025, yearCode: '2025-26', isActive: true, status: 'active', startDate: '', endDate: '', description: '' },
    ];

    const { result } = renderHook(() => useTaxationBreakdownForm(mockInitialData, mockYearOptions));

    expect(result.current.isChanged).toBe(false);

    // Select a valid different year (2025)
    act(() => {
      result.current.setSelectedYearId('2');
    });

    expect(result.current.selectedYearId).toBe('2');
    expect(result.current.isChanged).toBe(true);
    expect(result.current.validationErrors.yearMaster).toBeUndefined();
  });

  it('should always call saveOldTaxesDetailsAction (PUT) regardless of existing data', async () => {
    mockConfirm.mockImplementation(({ onConfirm }) => onConfirm());
    vi.mocked(saveOldTaxesDetailsAction).mockResolvedValue({ success: true } as any);

    const mockInitialDataNotApplied = {
      propertyId: 123,
      taxYears: [
        {
          financeYearId: 1,
          year: 2024,
          yearCode: '2024-25',
          taxes: [] as any[],
        },
        {
          financeYearId: 2,
          year: 2025,
          yearCode: '2025-26',
          taxes: [
            { taxId: 1, taxName: 'Property Tax', taxAmount: 500 },
          ],
        }
      ],
    };

    const { result } = renderHook(() => useTaxationBreakdownForm(mockInitialDataNotApplied));

    act(() => {
      result.current.handleTaxChange(1, '600');
    });

    await act(async () => {
      result.current.handleSave();
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(saveOldTaxesDetailsAction).toHaveBeenCalledWith(
      123,
      expect.objectContaining({
        taxYears: expect.arrayContaining([
          expect.objectContaining({
            taxes: expect.arrayContaining([
              expect.objectContaining({
                taxId: 1,
                taxAmount: 600,
              }),
            ]),
          }),
        ]),
      }),
      'en'
    );
    expect(toast.success).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should not set any default year if financeYearId is null', () => {
    const nullFinanceYearData = {
      propertyId: 123,
      taxYears: [
        {
          financeYearId: null as any,
          year: 2024,
          yearCode: '2024-25',
          taxes: [] as any[],
        },
      ],
    };
    const mockYearOptions = [
      { id: 1, year: 2024, yearCode: '2024-25', isActive: true, status: 'active', startDate: '', endDate: '', description: '' },
    ];
    const { result } = renderHook(() => useTaxationBreakdownForm(nullFinanceYearData, mockYearOptions));
    expect(result.current.selectedYearId).toBe('');
  });

  it('should not set any default year if initialData (API response) is null', () => {
    const mockYearOptions = [
      { id: 1, year: 2024, yearCode: '2024-25', isActive: true, status: 'active', startDate: '', endDate: '', description: '' },
    ];
    const { result } = renderHook(() => useTaxationBreakdownForm(null, mockYearOptions));
    expect(result.current.selectedYearId).toBe('');
  });

  it('should show correct year as selected when financeYearId is provided', () => {
    const validFinanceYearData = {
      propertyId: 123,
      taxYears: [
        {
          financeYearId: 4,
          year: 2024,
          yearCode: '2024-25',
          taxes: [] as any[],
        },
      ],
    };
    const mockYearOptions = [
      { id: 4, year: 2024, yearCode: '2024-25', isActive: true, status: 'active', startDate: '', endDate: '', description: '' },
    ];
    const { result } = renderHook(() => useTaxationBreakdownForm(validFinanceYearData, mockYearOptions));
    expect(result.current.selectedYearId).toBe('4');
  });
});
