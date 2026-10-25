import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApartment } from '@/hooks/property-tax/apartment';
import * as aptActionModule from '@/app/[locale]/property-tax/ptis/apartment/action';

vi.mock('@/app/[locale]/property-tax/ptis/apartment/action', () => ({
  fetchApartmentDetailsWingWiseAction: vi.fn(),
  fetchApartmentPropertyTaxDetailsRvAction: vi.fn().mockResolvedValue({ success: true, data: { taxAmounts: [] } }),
  fetchApartmentPropertyTaxDetailsCvAction: vi.fn().mockResolvedValue({ success: true, data: { taxAmounts: [] } }),
  saveSurveyUnitAction: vi.fn().mockResolvedValue({ success: true }),
}));

describe('useApartment — Pure API Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockData = {
      success: true,
      items: {
        items: [
          {
            newSurvey: { id: 17530, propertyNo: '102', carpetASqFt: 624, rateableValue: 3510, newTaxTotal: 10811 },
            oldSurvey: { id: 17530, propertyNo: '102', carpetASqFt: 624, rateableValue: 3510, oldTotalTax: 10811 },
            difference: { carpetAreaSqFeetDiff: 0, totalTaxDiff: 0 },
          },
        ],
      },
    };
    vi.mocked(aptActionModule.fetchApartmentDetailsWingWiseAction).mockResolvedValue(mockData as unknown as Awaited<ReturnType<typeof aptActionModule.fetchApartmentDetailsWingWiseAction>>);
  });

  it('should initialize empty and fetch data automatically from API action', async () => {
    const { result } = renderHook(() => useApartment(123));

    await waitFor(() => {
      expect(result.current.surveyUnits.length).toBe(1);
    });

    expect(result.current.previousUnits.length).toBe(1);
    expect(result.current.differences.length).toBe(1);
  });

  it('should toggle panel visibility correctly', () => {
    const { result } = renderHook(() => useApartment());
    expect(result.current.hiddenPanels).toEqual([]);

    act(() => {
      result.current.togglePanelVisibility('survey');
    });

    expect(result.current.hiddenPanels).toContain('survey');

    act(() => {
      result.current.restoreAllPanels();
    });

    expect(result.current.hiddenPanels).toEqual([]);
  });

  it('should update unit survey values and recalculate deltas', async () => {
    const { result } = renderHook(() => useApartment(123));

    await waitFor(() => {
      expect(result.current.surveyUnits.length).toBe(1);
    });

    const firstUnit = result.current.surveyUnits[0];

    act(() => {
      result.current.handleUpdateUnit({
        ...firstUnit,
        cpt: 800,
        bua: 1000,
      });
    });

    const updatedFirst = result.current.surveyUnits.find((u) => u.id === firstUnit.id);
    expect(updatedFirst?.cpt).toBe(800);
    expect(updatedFirst?.bua).toBe(1000);
  });

  it('should filter units by selected wing', async () => {
    const multiWingData = {
      success: true,
      items: {
        items: [
          {
            newSurvey: { id: 101, propertyNo: '101', wing: 'C', carpetASqFt: 500, rateableValue: 3000, newTaxTotal: 8000 },
            oldSurvey: { id: 101, propertyNo: '101', wing: 'C', carpetASqFt: 500, rateableValue: 3000, oldTotalTax: 8000 },
            difference: { carpetAreaSqFeetDiff: 0, totalTaxDiff: 0 },
          },
          {
            newSurvey: { id: 102, propertyNo: '102', wing: 'D', carpetASqFt: 600, rateableValue: 3600, newTaxTotal: 9000 },
            oldSurvey: { id: 102, propertyNo: '102', wing: 'D', carpetASqFt: 600, rateableValue: 3600, oldTotalTax: 9000 },
            difference: { carpetAreaSqFeetDiff: 0, totalTaxDiff: 0 },
          },
        ],
      },
    };
    vi.mocked(aptActionModule.fetchApartmentDetailsWingWiseAction).mockResolvedValue(multiWingData as unknown as Awaited<ReturnType<typeof aptActionModule.fetchApartmentDetailsWingWiseAction>>);

    const { result } = renderHook(() => useApartment(123));

    await waitFor(() => {
      expect(result.current.surveyUnits.length).toBe(2);
    });

    // Switch wing to 'C'
    act(() => {
      const updated = { ...result.current.filters, wingName: 'C', wingDetailId: 999 };
      result.current.setFilters(updated);
      result.current.fetchWingWiseData(updated);
    });

    await waitFor(() => {
      expect(result.current.surveyUnits.length).toBe(1);
      expect(result.current.surveyUnits[0].rawSurvey?.wing).toBe('C');
    });
  });
});

describe('useApartment: the sort is made by the API', () => {
  const okResponse = {
    success: true,
    items: {
      items: [
        {
          newSurvey: { id: 1, propertyNo: '102', carpetASqFt: 624, rateableValue: 3510, newTaxTotal: 10811 },
          oldSurvey: { id: 1, propertyNo: '102', carpetASqFt: 624, rateableValue: 3510, oldTotalTax: 10811 },
          difference: { carpetAreaSqFeetDiff: 0, totalTaxDiff: 0 },
        },
      ],
    },
  };

  const lastRequest = () => {
    const calls = vi.mocked(aptActionModule.fetchApartmentDetailsWingWiseAction).mock.calls;
    return calls[calls.length - 1][0];
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aptActionModule.fetchApartmentDetailsWingWiseAction).mockResolvedValue(
      okResponse as unknown as Awaited<ReturnType<typeof aptActionModule.fetchApartmentDetailsWingWiseAction>>,
    );
  });

  it('a click on a header asks the API for that column, from page 1', async () => {
    const { result } = renderHook(() => useApartment(123));
    await waitFor(() => expect(result.current.surveyUnits.length).toBe(1));

    act(() => {
      result.current.handlePageChange(3);
    });
    await waitFor(() => expect(lastRequest().pageNumber).toBe(3));

    act(() => {
      result.current.handleSort('survey', 'tax');
    });

    await waitFor(() => expect(lastRequest().sortBy).toBe('survey:tax'));
    expect(lastRequest().sortOrder).toBe('asc');
    expect(lastRequest().pageNumber).toBe(1);
    expect(result.current.sort).toEqual({ panel: 'survey', column: 'tax', direction: 'asc' });
  });

  it('a second click on the same column sorts descending, a third one removes the sort', async () => {
    const { result } = renderHook(() => useApartment(123));
    await waitFor(() => expect(result.current.surveyUnits.length).toBe(1));

    act(() => result.current.handleSort('existing', 'rv'));
    await waitFor(() => expect(lastRequest().sortOrder).toBe('asc'));

    act(() => result.current.handleSort('existing', 'rv'));
    await waitFor(() => expect(lastRequest().sortOrder).toBe('desc'));
    expect(lastRequest().sortBy).toBe('existing:rv');

    act(() => result.current.handleSort('existing', 'rv'));
    await waitFor(() => expect(lastRequest().sortBy ?? null).toBeNull());
    expect(result.current.sort).toBeNull();
  });

  it('clearSort goes back to the original order', async () => {
    const { result } = renderHook(() => useApartment(123));
    await waitFor(() => expect(result.current.surveyUnits.length).toBe(1));

    act(() => result.current.handleSort('difference', 'tax'));
    await waitFor(() => expect(lastRequest().sortBy).toBe('difference:tax'));

    act(() => result.current.clearSort());
    await waitFor(() => expect(lastRequest().sortBy ?? null).toBeNull());
    expect(result.current.sort).toBeNull();
  });
});
