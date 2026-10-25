import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCascadingPropertyFilters } from '@/hooks/extendedAreaAssessment/useCascadingPropertyFilters';
import { getWardsDropdownAction, getPropertyOptionsByWardAction } from '@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action';
import type { WardDropdownOption, WardPropertyOptionDto } from '@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action', () => ({
  getWardsDropdownAction: vi.fn(),
  getPropertyOptionsByWardAction: vi.fn(),
}));

// Hoisted, stable references — a real caller (SingleAssessmentScreen) passes these as component
// props that don't change identity every render. Recreating an inline array literal directly
// inside the renderHook() callback would give the hook's "sync from initial props" effect
// (keyed on array reference) a new identity on every render, looping it forever.
const oneWard: WardDropdownOption[] = [{ id: 1, wardNo: 'MM11', description: null }];

const t = ((key: string) => key) as unknown as Parameters<typeof useCascadingPropertyFilters>[0]['t'];

describe('useCascadingPropertyFilters', () => {
  const push = vi.fn();
  const onPropertyResolved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as never);
    vi.mocked(usePathname).mockReturnValue('/en/property-tax/extended-area-assesment/single-assessment');
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('') as never);
    // Resolved by default (fallback wards-fetch effect fires whenever initialWards is empty) —
    // an unresolved/undefined mock here throws synchronously inside a passive effect, which
    // crashes the whole worker instead of failing just one test.
    vi.mocked(getWardsDropdownAction).mockResolvedValue({ success: true, data: [] });
    vi.mocked(getPropertyOptionsByWardAction).mockResolvedValue({ success: true, data: [] });
  });

  it('seeds selected ward/property from explicit initial props over URL params', () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('wardId=99') as never);
    const { result } = renderHook(() =>
      useCascadingPropertyFilters({
        t,
        initialWardId: '1',
        initialPropertyId: '10',
        onPropertyResolved,
      })
    );
    expect(result.current.selectedWardId).toBe('1');
    expect(result.current.selectedPropertyId).toBe('10');
  });

  it('falls back to reading wardId/propertyId from the URL when no initial props are given', () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('wardId=2&propertyId=20') as never);
    const { result } = renderHook(() => useCascadingPropertyFilters({ t, onPropertyResolved }));
    expect(result.current.selectedWardId).toBe('2');
    expect(result.current.selectedPropertyId).toBe('20');
  });

  it('fetches wards from the fallback action when initialWards is empty', async () => {
    vi.mocked(getWardsDropdownAction).mockResolvedValue({
      success: true,
      data: [{ id: 1, wardNo: 'MM11', description: null }],
    });
    const { result } = renderHook(() => useCascadingPropertyFilters({ t, onPropertyResolved }));
    await waitFor(() => expect(getWardsDropdownAction).toHaveBeenCalled());
    await waitFor(() => expect(result.current.wardOptions).toHaveLength(2));
    expect(result.current.wardOptions[1]).toEqual({ label: 'MM11', value: '1' });
  });

  it('does not fetch wards when initialWards is already populated', () => {
    renderHook(() => useCascadingPropertyFilters({ t, initialWards: oneWard, onPropertyResolved }));
    expect(getWardsDropdownAction).not.toHaveBeenCalled();
  });

  describe('handleWardChange', () => {
    it('resets downstream selection and loads property options for the new ward without navigating', async () => {
      const items: WardPropertyOptionDto[] = [
        { propertyId: 1, propertyNo: 'P1', partitionNo: null, upicId: 'U1' },
        { propertyId: 2, propertyNo: 'P1', partitionNo: 'A1', upicId: 'U2' },
        { propertyId: 3, propertyNo: 'P2', partitionNo: null, upicId: 'U3' },
      ];
      vi.mocked(getPropertyOptionsByWardAction).mockResolvedValue({ success: true, data: items });
      const { result } = renderHook(() => useCascadingPropertyFilters({ t, initialWards: oneWard, onPropertyResolved }));

      await act(async () => {
        await result.current.handleWardChange('1');
      });

      // Selecting Ward/Property No must only update local state — the actual schedule search
      // happens on the "Search property" button click, not on dropdown change.
      expect(push).not.toHaveBeenCalled();
      expect(result.current.selectedWardId).toBe('1');
      expect(result.current.propertyOptions.slice(1)).toEqual([
        { label: 'P1', value: '1' },
        { label: 'P1-A1', value: '2' },
        { label: 'P2', value: '3' },
      ]);
    });

    it('skips fetching properties and does not navigate when the ward is cleared', async () => {
      const { result } = renderHook(() => useCascadingPropertyFilters({ t, initialWards: oneWard, onPropertyResolved }));
      await act(async () => {
        await result.current.handleWardChange('');
      });
      expect(push).not.toHaveBeenCalled();
      expect(getPropertyOptionsByWardAction).not.toHaveBeenCalled();
    });
  });

  describe('handlePropertyChange', () => {
    const items: WardPropertyOptionDto[] = [
      { propertyId: 42, propertyNo: 'P1', partitionNo: 'A1', upicId: 'MM1100150000' },
    ];

    it('resolves the matching item and calls onPropertyResolved with its UPIC, without navigating', async () => {
      vi.mocked(getPropertyOptionsByWardAction).mockResolvedValue({ success: true, data: items });
      const { result } = renderHook(() =>
        useCascadingPropertyFilters({ t, initialWardId: '1', initialWards: oneWard, onPropertyResolved })
      );

      await act(async () => {
        await result.current.handleWardChange('1');
      });

      act(() => {
        result.current.handlePropertyChange('42');
      });

      expect(result.current.selectedPropertyId).toBe('42');
      expect(onPropertyResolved).toHaveBeenCalledWith('MM1100150000');
      // Only the "Search property" button click should navigate/trigger the schedule fetch.
      expect(push).not.toHaveBeenCalled();
    });

    it('does not call onPropertyResolved when no matching item has a UPIC (e.g. unmatched value)', () => {
      const { result } = renderHook(() => useCascadingPropertyFilters({ t, initialWards: oneWard, onPropertyResolved }));

      act(() => {
        result.current.handlePropertyChange('UNMATCHED');
      });

      expect(result.current.selectedPropertyId).toBe('UNMATCHED');
      expect(onPropertyResolved).not.toHaveBeenCalled();
    });
  });
});
